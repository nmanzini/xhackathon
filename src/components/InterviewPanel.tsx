import type { TranscriptEntry } from "../hooks/useTranscript";

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
    <div
      className="h-full flex flex-col"
      style={{
        backgroundColor: "var(--card-bg)",
        borderLeft: "4px solid var(--invite-color)",
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: isConnected
              ? "rgba(91, 179, 216, 0.15)"
              : "rgba(91, 179, 216, 0.1)",
          }}
        >
          <svg
            className="w-4 h-4"
            style={{ color: "var(--invite-color)" }}
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
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Voice Interviewer
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <div
              className="w-2 h-2 rounded-full transition-colors"
              style={{
                backgroundColor: isConnected
                  ? "var(--success-color)"
                  : "var(--text-disabled)",
              }}
            />
            <span className="text-sm text-[var(--text-secondary)]">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* Audio Level Indicator */}
      {isCapturing && (
        <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--slider-bg-start)]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full transition-all duration-75"
                  style={{
                    height: `${12 + i * 4}px`,
                    backgroundColor:
                      audioLevel > i * 0.1
                        ? "var(--success-color)"
                        : "var(--border-color)",
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-[var(--text-secondary)]">
              {audioLevel > 0.05 ? "Listening..." : "Speak now"}
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          className="mx-4 mt-4 p-3 rounded-lg border"
          style={{
            backgroundColor: "rgba(224, 61, 99, 0.1)",
            borderColor: "var(--alert-color)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--alert-color)" }}>
            {error}
          </p>
        </div>
      )}

      {/* Transcript */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-xs uppercase tracking-wide font-medium text-[var(--text-secondary)] mb-3">
          Transcript
        </h3>
        <div className="space-y-3">
          {transcript.length === 0 ? (
            <p className="text-sm text-[var(--text-disabled)] italic">
              Start the interview to begin the conversation...
            </p>
          ) : (
            transcript.map((entry, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border border-[var(--border-color)] shadow-[var(--shadow-sm)] transition-all duration-200"
                style={{
                  backgroundColor:
                    entry.role === "assistant"
                      ? "var(--card-bg-hover)"
                      : entry.role === "code"
                      ? "var(--code-bg)"
                      : "var(--card-bg)",
                  borderLeftWidth: "3px",
                  borderLeftColor:
                    entry.role === "assistant"
                      ? "var(--primary-color)"
                      : entry.role === "code"
                      ? "var(--warning-color)"
                      : "var(--invite-color)",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-medium"
                    style={{
                      color:
                        entry.role === "assistant"
                          ? "var(--primary-color)"
                          : entry.role === "code"
                          ? "var(--warning-color)"
                          : "var(--invite-color)",
                    }}
                  >
                    {entry.role === "assistant"
                      ? "🤖 Interviewer"
                      : entry.role === "code"
                      ? "📄 Code Sent"
                      : "👤 You"}
                  </span>
                  <span className="text-xs text-[var(--text-disabled)]">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {entry.role === "code" ? (
                  <pre className="text-xs font-mono overflow-auto max-h-40 whitespace-pre-wrap p-2 rounded text-[var(--text-secondary)] bg-[var(--bg-primary)]">
                    {entry.content}
                  </pre>
                ) : (
                  <p className="text-sm text-[var(--text-primary)]">
                    {entry.content}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-[var(--border-color)]">
        {!isConnected ? (
          <button
            onClick={onStart}
            className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] border"
            style={{
              backgroundColor: "var(--slider-bg-start)",
              borderColor: "var(--slider-border)",
              color: "var(--primary-color)",
            }}
          >
            <MicIcon />
            Start Interview
          </button>
        ) : (
          <button
            onClick={onStop}
            className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-white shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]"
            style={{ backgroundColor: "var(--alert-color)" }}
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
