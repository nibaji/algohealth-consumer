/**
 * ttsManager.ts
 *
 * Singleton module that wraps expo-speech for per-message TTS playback
 * in the Health Consultant chat. Key design decisions:
 *
 * - US English only (en-US), best-matching voice picked on init
 * - One message speaking at a time; starting a new one stops the previous
 * - Per-message play/pause state tracked via `speakingMessageId`
 * - Pause/resume is simulated: expo-speech has no native pause, so we
 *   track a sentence index and re-speak from that boundary on resume.
 * - Safari / Edge / Chromium web: speechSynthesis.getVoices() is async and
 *   requires the `voiceschanged` event to be populated. We wait for it with
 *   a 3 s deadline so Edge doesn't silently fall back to no voice.
 * - Timeout guard (30 s on web, 12 s on native) prevents deadlock when
 *   completion callbacks are swallowed by the browser engine.
 * - AppState: caller is responsible for calling stopSpeaking() on background.
 */
import * as Speech from 'expo-speech';

const LANGUAGE = 'en-US';
const IS_WEB = process.env.EXPO_OS === 'web';
// Edge/Chrome sometimes take >12 s for long sentences. Use a generous timeout.
const SPEECH_TIMEOUT_MS = IS_WEB ? 30_000 : 12_000;
// How long to wait for voiceschanged before giving up (Edge loads voices async)
const VOICES_READY_TIMEOUT_MS = 3_000;

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
  if (!text) return [];

  // Remove markdown headers (e.g., "### Header" -> "Header")
  let cleaned = text.replace(/^#+\s+(.+)$/gm, '$1');

  // Remove list item bullet points (e.g., "- Item" or "* Item" -> "Item")
  cleaned = cleaned.replace(/^\s*[-*•]\s+/gm, '');

  // Strip markdown-style bold/italic markers for cleaner TTS
  cleaned = cleaned.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1');
  cleaned = cleaned.replace(/_{1,3}([^_]+)_{1,3}/g, '$1');

  // Remove inline code backticks (e.g., "`code`" -> "code")
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

  cleaned = cleaned.trim();

  // Split on sentence-ending punctuation followed by whitespace or end of string
  const parts = cleaned.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) ?? [cleaned];
  return parts.map(s => s.trim()).filter(s => s.length > 0);
};

/**
 * On Chromium-based browsers (Edge, Chrome) `speechSynthesis.getVoices()`
 * returns an empty array until voices are loaded. We wait for the
 * `voiceschanged` event with a timeout fallback so Edge works correctly.
 */
const getVoicesWithFallback = async (): Promise<Speech.Voice[]> => {
  if (!IS_WEB) {
    return Speech.getAvailableVoicesAsync();
  }

  // Web path: use the native speechSynthesis API directly to handle Edge
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  if (!synth) return [];

  const immediateVoices = synth.getVoices();
  if (immediateVoices.length > 0) {
    // Already available (e.g., Firefox, or subsequent calls after first load)
    return immediateVoices.map(v => ({
      identifier: v.voiceURI,
      name: v.name,
      language: v.lang,
      quality: 'Default' as Speech.VoiceQuality,
    }));
  }

  // Edge / Chrome: wait for voiceschanged event
  return new Promise<Speech.Voice[]>((resolve) => {
    const timeout = setTimeout(() => {
      // Deadline reached — return whatever is available (may be empty)
      resolve(synth.getVoices().map(v => ({
        identifier: v.voiceURI,
        name: v.name,
        language: v.lang,
        quality: 'Default' as Speech.VoiceQuality,
      })));
    }, VOICES_READY_TIMEOUT_MS);

    synth.onvoiceschanged = () => {
      clearTimeout(timeout);
      synth.onvoiceschanged = null;
      resolve(synth.getVoices().map(v => ({
        identifier: v.voiceURI,
        name: v.name,
        language: v.lang,
        quality: 'Default' as Speech.VoiceQuality,
      })));
    };
  });
};

const init = async (): Promise<void> => {
  if (isInitialized || isInitializing) return;
  isInitializing = true;
  try {
    const voices = await getVoicesWithFallback();
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

  // Timeout guard: Edge/Safari/web sometimes swallows completion callbacks.
  // Use a longer timeout on web to handle long sentences gracefully.
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
