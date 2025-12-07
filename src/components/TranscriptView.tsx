import type { TranscriptEntry } from "../types/index";

interface TranscriptViewProps {
  entries: TranscriptEntry[];
}

export function TranscriptView({ entries }: TranscriptViewProps) {
  return (
    <div className="h-full overflow-y-auto bg-zinc-900 p-4">
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              entry.role === "llm"
                ? "bg-blue-950 border border-blue-800"
                : "bg-zinc-800 border border-zinc-700"
            }`}
          >
            <div className="text-xs font-mono text-zinc-400 mb-1">
              {entry.role === "llm" ? "AI Interviewer" : "Candidate"} •{" "}
              {new Date(entry.timestamp).toLocaleTimeString()}
            </div>
            <div className="text-sm text-zinc-100">{entry.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
