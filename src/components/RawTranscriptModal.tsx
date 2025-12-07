import type { TranscriptEntry } from "../types";

interface RawTranscriptModalProps {
  transcript: TranscriptEntry[];
  show: boolean;
  onClose: () => void;
}

export function RawTranscriptModal({
  transcript,
  show,
  onClose,
}: RawTranscriptModalProps) {
  if (!show) {
    return null;
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />
      <div className="relative bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-[scaleIn_0.2s_ease-out]">
        <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--border-color)] shrink-0 bg-gradient-to-r from-[var(--card-bg)] to-[var(--bg-primary)] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-color)]/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[var(--primary-color)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Raw Transcript
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-all duration-200"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-8 overflow-y-auto space-y-4">
          {transcript.map((entry, index) => (
            <div
              key={index}
              className="p-5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--primary-color)]/30 transition-colors duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor:
                      entry.role === "user"
                        ? "var(--primary-color)/10"
                        : "var(--success-color)/10",
                  }}
                >
                  <svg
                    className="w-4 h-4"
                    style={{
                      color:
                        entry.role === "user"
                          ? "var(--primary-color)"
                          : "var(--success-color)",
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {entry.role === "user" ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    )}
                  </svg>
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wide font-medium text-[var(--text-secondary)]">
                    {entry.role === "user" ? "User" : "Assistant"}
                  </div>
                  <div className="text-xs text-[var(--text-disabled)]">
                    {formatTimestamp(entry.timestamp)}
                  </div>
                </div>
              </div>
              <div className="text-sm text-[var(--text-primary)] leading-relaxed mb-3 whitespace-pre-wrap">
                {entry.message}
              </div>
              {entry.code && (
                <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                  <div className="text-xs uppercase tracking-wide font-medium text-[var(--text-secondary)] mb-2">
                    Code
                  </div>
                  <pre className="text-sm text-[var(--text-primary)] leading-relaxed max-h-56 overflow-y-auto bg-[var(--code-bg)] rounded-lg p-4 font-[var(--font-monospace)]">
                    {entry.code}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
