import type { TranscriptEntry } from "../types/messages";

interface InterviewPanelProps {
  isConnected: boolean;
  isCapturing: boolean;
  audioLevel: number;
  transcript: TranscriptEntry[];
  error: string | null;
  onStart: () => void;
  onStop: () => void;
}

export function InterviewPanel({
  isConnected,
  isCapturing,
  audioLevel,
  transcript,
  error,
  onStart,
  onStop,
}: InterviewPanelProps) {
  return (
    <div className="h-full flex flex-col bg-zinc-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-zinc-700">
        <h2 className="text-lg font-semibold">Voice Interviewer</h2>
        <div className="flex items-center gap-2 mt-2">
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              isConnected ? "bg-emerald-500" : "bg-zinc-500"
            }`}
          />
          <span className="text-sm text-zinc-400">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Audio Level Indicator */}
      {isCapturing && (
        <div className="px-4 py-3 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    audioLevel > i * 0.1
                      ? "bg-emerald-500"
                      : "bg-zinc-700"
                  }`}
                  style={{
                    height: `${12 + i * 4}px`,
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-zinc-400">
              {audioLevel > 0.05 ? "Listening..." : "Speak now"}
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Transcript */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Transcript</h3>
        <div className="space-y-3">
          {transcript.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">
              Start the interview to begin the conversation...
            </p>
          ) : (
            transcript.map((entry, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  entry.role === "assistant"
                    ? "bg-zinc-800 border-l-2 border-emerald-500"
                    : entry.role === "code"
                    ? "bg-violet-900/20 border-l-2 border-violet-500"
                    : "bg-zinc-800/50 border-l-2 border-blue-500"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-medium ${
                      entry.role === "assistant"
                        ? "text-emerald-400"
                        : entry.role === "code"
                        ? "text-violet-400"
                        : "text-blue-400"
                    }`}
                  >
                    {entry.role === "assistant"
                      ? "Interviewer"
                      : entry.role === "code"
                      ? "📄 Code Sent"
                      : "You"}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {entry.role === "code" ? (
                  <pre className="text-xs text-zinc-400 font-mono overflow-auto max-h-40 whitespace-pre-wrap bg-zinc-900/50 p-2 rounded">
                    {entry.content}
                  </pre>
                ) : (
                  <p className="text-sm text-zinc-300">{entry.content}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-zinc-700">
        {!isConnected ? (
          <button
            onClick={onStart}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <MicIcon />
            Start Interview
          </button>
        ) : (
          <button
            onClick={onStop}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <StopIcon />
            End Interview
          </button>
        )}
      </div>
    </div>
  );
}

// Simple icons
function MicIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
      />
    </svg>
  );
}
