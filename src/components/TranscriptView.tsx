import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "../types/index";

interface TranscriptViewProps {
  entries: TranscriptEntry[];
}

export function TranscriptView({ entries }: TranscriptViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  // Auto-scroll to bottom when new entries appear
  useEffect(() => {
    if (entries.length > prevLengthRef.current && containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    prevLengthRef.current = entries.length;
  }, [entries.length]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto bg-[var(--bg-primary)] p-4 transition-colors duration-300"
    >
      <div className="space-y-5">
        {entries.map((entry, index) => {
          const isNew = index === entries.length - 1 && index > 0;
          return (
            <div
              key={index}
              className={`p-5 rounded-lg border shadow-[var(--shadow-md)] transition-all duration-300 ${
                entry.role === "llm"
                  ? "bg-[var(--card-bg-hover)] border-[var(--primary-color)]"
                  : "bg-[var(--card-bg)] border-[var(--border-color)]"
              }`}
              style={{
                ...(entry.role === "llm"
                  ? {
                      borderLeftWidth: "4px",
                      borderLeftColor: "var(--primary-color)",
                    }
                  : {}),
                animation: isNew ? "slideIn 0.4s ease-out" : "none",
              }}
            >
              <div className="text-sm font-mono text-[var(--text-secondary)] mb-1">
                {entry.role === "llm" ? "AI Interviewer" : "Candidate"} •{" "}
                {new Date(entry.timestamp).toLocaleTimeString()}
              </div>
              <div className="text-base text-[var(--text-primary)]">
                {entry.message}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
