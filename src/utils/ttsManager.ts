/**
 * ttsManager.ts
 *
 * Singleton module that wraps expo-speech for per-message TTS playback
 * in the Health Consultant chat. Key design decisions (ported from algoscribe):
 *
 * - US English only (en-US), best-matching voice picked on init
 * - One message speaking at a time; starting a new one stops the previous
 * - Per-message play/pause state tracked via `speakingMessageId`
 * - Pause/resume is simulated: expo-speech has no native pause, so we
 *   track a character offset so the user can "resume" from roughly the
 *   same point. On resume we re-speak from that sentence boundary.
 * - Safari/web: speech synthesis sometimes swallows completion callbacks
 *   → 12 s timeout guard prevents deadlock
 * - AppState: caller is responsible for calling stopSpeaking() on background
 */
import * as Speech from 'expo-speech';

const LANGUAGE = 'en-US';
const SPEECH_TIMEOUT_MS = 12_000;

interface TtsListenerCallback {
  (messageId: string | null, isPaused: boolean): void;
}

// ─── Module-level state ───────────────────────────────────────────────────────
let speakingMessageId: string | null = null;
let isInitialized = false;
let isInitializing = false;
let cachedVoiceId: string | undefined;
let listeners: TtsListenerCallback[] = [];

// Pause/resume tracking
// We split the text into sentences and track how many have been spoken.
let pendingSentences: string[] = [];
let currentSentenceIndex = 0;
let isPaused = false;
let currentGeneration = 0; // incremented on every stop/start to cancel stale callbacks

// ─── Initialization ───────────────────────────────────────────────────────────

const splitIntoSentences = (text: string): string[] => {
  // Strip markdown-style bold/italic markers for cleaner TTS
  const cleaned = text.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1').trim();
  // Split on sentence-ending punctuation followed by whitespace or end of string
  const parts = cleaned.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) ?? [cleaned];
  return parts.map(s => s.trim()).filter(s => s.length > 0);
};

const init = async (): Promise<void> => {
  if (isInitialized || isInitializing) return;
  isInitializing = true;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    // Prefer exact en-US match, then any en-* voice
    const exact = voices.find(v => v.language === LANGUAGE);
    const fallback = voices.find(v => v.language.startsWith('en'));
    cachedVoiceId = exact?.identifier ?? fallback?.identifier;
    isInitialized = true;
  } catch {
    // getAvailableVoicesAsync fails on some Android devices — speech still works
    isInitialized = true;
  } finally {
    isInitializing = false;
  }
};

// ─── Listener management ──────────────────────────────────────────────────────

/** Subscribe to speaking state changes. Returns an unsubscribe function. */
export const subscribeTtsState = (cb: TtsListenerCallback): (() => void) => {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter(l => l !== cb);
  };
};

const notify = (id: string | null): void => {
  listeners.forEach(l => l(id, isPaused));
};

// ─── Core speech helpers ──────────────────────────────────────────────────────

const speakSentence = (
  sentence: string,
  generation: number,
  onDone: () => void
): void => {
  if (generation !== currentGeneration) {
    onDone();
    return;
  }

  let hasCompleted = false;

  const complete = (): void => {
    if (hasCompleted) return;
    hasCompleted = true;
    onDone();
  };

  const options: Speech.SpeechOptions = {
    language: LANGUAGE,
    rate: 0.9,
    pitch: 1.0,
    ...(cachedVoiceId ? { voice: cachedVoiceId } : {}),
    onDone: () => {
      if (generation === currentGeneration) complete();
    },
    onError: () => {
      if (generation === currentGeneration) complete();
    },
    onStopped: () => {
      if (generation === currentGeneration) complete();
    },
  };

  Speech.speak(sentence, options);

  // Timeout guard: Safari/web sometimes swallows completion callbacks
  setTimeout(() => {
    if (!hasCompleted && generation === currentGeneration) {
      complete();
    }
  }, SPEECH_TIMEOUT_MS);
};

const speakFromIndex = async (
  messageId: string,
  sentences: string[],
  startIndex: number
): Promise<void> => {
  const generation = currentGeneration;
  pendingSentences = sentences;
  currentSentenceIndex = startIndex;
  isPaused = false;

  for (let i = startIndex; i < sentences.length; i++) {
    if (generation !== currentGeneration || isPaused) break;
    currentSentenceIndex = i;

    await new Promise<void>((resolve) => {
      speakSentence(sentences[i], generation, resolve);
    });

    if (generation !== currentGeneration) break;
  }

  // Done speaking all sentences (or stopped/paused)
  if (generation === currentGeneration && !isPaused) {
    speakingMessageId = null;
    notify(null);
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the message ID currently being spoken, or null.
 */
export const getSpeakingMessageId = (): string | null => speakingMessageId;

/**
 * Returns true if the TTS manager is currently in a paused state.
 */
export const isTtsPaused = (): boolean => isPaused;

/**
 * Returns true if the given message is currently being spoken.
 */
export const isSpeakingMessage = (messageId: string): boolean =>
  speakingMessageId === messageId && !isPaused;

/**
 * Returns true if the given message is paused (not speaking but has position).
 */
export const isPausedMessage = (messageId: string): boolean =>
  speakingMessageId === messageId && isPaused;

/**
 * Stop speaking any current message (clears state entirely).
 * Safe to call even if nothing is playing.
 */
export const stopSpeaking = (): void => {
  currentGeneration += 1;
  isPaused = false;
  pendingSentences = [];
  currentSentenceIndex = 0;
  speakingMessageId = null;
  Speech.stop().catch(() => {
    // Ignore stop errors — state is already cleared
  });
  notify(null);
};

/**
 * Pause speaking the current message.
 * Position is saved so resumeMessage() can continue.
 */
export const pauseSpeaking = (): void => {
  if (!speakingMessageId || isPaused) return;
  isPaused = true;
  currentGeneration += 1; // Cancels the current sentence loop
  Speech.stop().catch(() => {});
  notify(speakingMessageId); // Still "speaking" this message (but paused)
};

/**
 * Resume speaking the current paused message.
 */
export const resumeSpeaking = (messageId: string): void => {
  if (speakingMessageId !== messageId || !isPaused) return;
  isPaused = false;
  currentGeneration += 1;
  const sentences = pendingSentences;
  const startIdx = currentSentenceIndex; // Resume from where we left off
  void speakFromIndex(messageId, sentences, startIdx);
  notify(messageId);
};

/**
 * Start speaking a bot message's text.
 * - If another message is playing, it is stopped first.
 * - If this message is paused, it resumes.
 * - If this message is already playing, it pauses.
 * Caller must also call `stopAudioPlayer()` before calling this to
 * ensure audio playback and TTS don't overlap.
 */
export const toggleMessageSpeech = async (messageId: string, text: string): Promise<void> => {
  await init();

  if (speakingMessageId === messageId) {
    if (isPaused) {
      // Resume
      resumeSpeaking(messageId);
    } else {
      // Pause
      pauseSpeaking();
    }
    return;
  }

  // Stop any other message (or the same in a different state)
  stopSpeaking();

  if (!text || text.trim() === '') return;

  speakingMessageId = messageId;
  notify(messageId);

  const sentences = splitIntoSentences(text);
  await speakFromIndex(messageId, sentences, 0);
};
