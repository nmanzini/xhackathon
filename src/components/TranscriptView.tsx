import type { TranscriptEntry } from "../types/index";

interface TranscriptViewProps {
  entries: TranscriptEntry[];
}

export function TranscriptView({ entries }: TranscriptViewProps) {
  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-primary)] p-4 transition-colors duration-300">
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border shadow-sm transition-colors duration-200 ${
              entry.role === "llm"
                ? "bg-[var(--card-bg-hover)] border-[var(--primary-color)]"
                : "bg-[var(--card-bg)] border-[var(--border-color)]"
            }`}
            style={
              entry.role === "llm"
                ? {
                    borderLeftWidth: "4px",
                    borderLeftColor: "var(--primary-color)",
                  }
                : {}
            }
          >
            <div className="text-xs font-mono text-[var(--text-secondary)] mb-1">
              {entry.role === "llm" ? "AI Interviewer" : "Candidate"} •{" "}
              {new Date(entry.timestamp).toLocaleTimeString()}
            </div>
            <div className="text-sm text-[var(--text-primary)]">
              {entry.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
