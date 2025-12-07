/**
 * XAI Realtime API WebSocket message types
 */

// Base message type
export interface BaseMessage {
  type: string;
  [key: string]: unknown;
}

// ========================================
// Client → Server messages
// ========================================

export interface AudioAppendMessage extends BaseMessage {
  type: "input_audio_buffer.append";
  audio: string; // base64 PCM16
}

export interface AudioCommitMessage extends BaseMessage {
  type: "input_audio_buffer.commit";
}

export interface ResponseCreateMessage extends BaseMessage {
  type: "response.create";
}

export interface SessionUpdateMessage extends BaseMessage {
  type: "session.update";
  session: {
    instructions?: string;
    voice?: string;
    audio?: {
      input?: {
        format?: {
          type: string;
          rate: number;
        };
      };
      output?: {
        format?: {
          type: string;
          rate: number;
        };
      };
    };
    turn_detection?: {
      type: "server_vad";
    };
  };
}

export interface ConversationItemCreateMessage extends BaseMessage {
  type: "conversation.item.create";
  item: {
    type: "message";
    role: "user" | "assistant";
    content: Array<{
      type: "input_text" | "text";
      text: string;
    }>;
  };
}

// ========================================
// Server → Client messages
// ========================================

export interface ConversationCreatedMessage extends BaseMessage {
  type: "conversation.created";
  conversation?: {
    id: string;
  };
}

export interface SessionCreatedMessage extends BaseMessage {
  type: "session.created";
  session?: unknown;
}

export interface SessionUpdatedMessage extends BaseMessage {
  type: "session.updated";
  session?: unknown;
}

export interface SpeechStartedMessage extends BaseMessage {
  type: "input_audio_buffer.speech_started";
  audio_start_ms?: number;
}

export interface SpeechStoppedMessage extends BaseMessage {
  type: "input_audio_buffer.speech_stopped";
  audio_end_ms?: number;
}

export interface InputAudioBufferCommittedMessage extends BaseMessage {
  type: "input_audio_buffer.committed";
  item_id?: string;
}

export interface ResponseOutputAudioDeltaMessage extends BaseMessage {
  type: "response.output_audio.delta";
  delta: string; // base64 PCM16
}

export interface ResponseOutputAudioTranscriptDeltaMessage extends BaseMessage {
  type: "response.output_audio_transcript.delta";
  delta: string;
}

export interface ResponseCreatedMessage extends BaseMessage {
  type: "response.created";
}

export interface ResponseDoneMessage extends BaseMessage {
  type: "response.done";
}

export interface ConversationItemAddedMessage extends BaseMessage {
  type: "conversation.item.added";
  item?: {
    role?: string;
    content?: Array<{
      type: string;
      transcript?: string;
    }>;
  };
}

export interface ErrorMessage extends BaseMessage {
  type: "error";
  error?: {
    type?: string;
    code?: string;
    message?: string;
  };
}

// Union type for all messages
export type Message =
  | AudioAppendMessage
  | AudioCommitMessage
  | ResponseCreateMessage
  | SessionUpdateMessage
  | ConversationItemCreateMessage
  | ConversationCreatedMessage
  | SessionCreatedMessage
  | SessionUpdatedMessage
  | SpeechStartedMessage
  | SpeechStoppedMessage
  | InputAudioBufferCommittedMessage
  | ResponseOutputAudioDeltaMessage
  | ResponseOutputAudioTranscriptDeltaMessage
  | ResponseCreatedMessage
  | ResponseDoneMessage
  | ConversationItemAddedMessage
  | ErrorMessage
  | BaseMessage;

// Transcript entry for UI
export interface TranscriptEntry {
  timestamp: string;
  role: "user" | "assistant" | "code";
  content: string;
}

