export interface ConsultationSession {
  id: string;
  title: string | null;
  message_count: number;
  created_at: string;
}

export interface ConsultationStrategy {
  intent: string;
  limit: number;
  range: string;
}

export interface ConsultationMessage {
  id: string;
  user_id: string;
  question: string | null;
  answer: string | null;
  question_time: string | null;
  answer_time: string | null;
  strategy: ConsultationStrategy | null;
  has_files: boolean;
  has_audio: boolean;
}

export interface ConsultationSessionDetail extends ConsultationSession {
  messages: ConsultationMessage[];
}

export interface ConsultationChatResponse {
  success: boolean;
  session_id: string;
  message_id: string;
  user_id: string;
  question_time: string;
  answer_time: string;
  answer: string;
  strategy: ConsultationStrategy;
  files: unknown[];
  audio: unknown[];
}

export interface AskBenishResponse {
  success: boolean;
  answer: string;
  strategy: Record<string, unknown>;
  files: unknown[];
  audio: unknown[];
}
