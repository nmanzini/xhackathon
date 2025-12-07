interface InterviewPanelProps {
  isConnected?: boolean;
  isListening?: boolean;
  transcript?: string;
}

export function InterviewPanel({
  isConnected = false,
  isListening = false,
  transcript = "",
}: InterviewPanelProps) {
  return (
    <div className="h-full flex flex-col bg-[var(--card-bg)] text-[var(--text-primary)] transition-colors duration-300">
      <div className="p-4 border-b border-[var(--border-color)]">
        <h2 className="text-lg font-semibold">Voice AI Interviewer</h2>
        <div className="flex items-center gap-2 mt-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? "bg-[var(--success-color)]"
                : "bg-[var(--alert-color)]"
            }`}
          />
          <span className="text-sm text-[var(--text-secondary)]">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
              Status
            </h3>
            <div className="flex items-center gap-2">
              {isListening && (
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 bg-[var(--primary-color)] animate-pulse rounded" />
                  <span className="w-1 h-4 bg-[var(--primary-color)] animate-pulse rounded" />
                  <span className="w-1 h-2 bg-[var(--primary-color)] animate-pulse rounded" />
                </div>
              )}
              <span className="text-sm">
                {isListening ? "Listening..." : "Waiting to start"}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
              Transcript
            </h3>
            <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg p-3 min-h-[200px] text-sm shadow-sm">
              {transcript || "Interview transcript will appear here..."}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-[var(--border-color)]">
        <button className="w-full py-2 px-4 bg-[var(--primary-color)] text-white hover:opacity-90 rounded-lg font-medium transition-all shadow-md">
          Start Interview
        </button>
      </div>
    </div>
  );
}
