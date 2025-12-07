import { useEffect, useState, useRef } from "react";
import { Bot, User } from "lucide-react";
import type { TranscriptEntry } from "../types/index";

interface TranscriptViewProps {
  entry: TranscriptEntry;
}

interface MessageState {
  entry: TranscriptEntry;
  position: "current" | "previous" | "exiting";
}

export function TranscriptView({ entry }: TranscriptViewProps) {
  const [messages, setMessages] = useState<MessageState[]>([
    { entry, position: "current" },
  ]);
  const prevEntryRef = useRef(entry);

  useEffect(() => {
    if (entry !== prevEntryRef.current) {
      setMessages((prev) => {
        const newMessages: MessageState[] = prev
          .filter((m) => m.position !== "exiting")
          .map((m) => {
            if (m.position === "current") {
              return { ...m, position: "previous" as const };
            }
            if (m.position === "previous") {
              return { ...m, position: "exiting" as const };
            }
            return m;
          });

        newMessages.push({ entry, position: "current" });
        return newMessages;
      });

      const timeout = setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.position !== "exiting"));
      }, 400);

      prevEntryRef.current = entry;
      return () => clearTimeout(timeout);
    }
  }, [entry]);

  const getStyles = (position: "current" | "previous" | "exiting") => {
    switch (position) {
      case "current":
        return {
          opacity: 1,
          transform: "translate(-50%, 0)",
        };
      case "previous":
        return {
          opacity: 0.15,
          transform: "translate(-50%, calc(-100% - 16px))",
        };
      case "exiting":
        return {
          opacity: 0,
          transform: "translate(-50%, calc(-200% - 32px))",
        };
    }
  };

  const renderMessage = (messageState: MessageState) => {
    const { entry: messageEntry, position } = messageState;
    const styles = getStyles(position);

    return (
      <div
        key={messageEntry.timestamp}
        className={`absolute left-1/2 max-w-3xl w-full p-8 rounded-xl border shadow-[var(--shadow-lg)] transition-all duration-300 ease-out ${
          messageEntry.role === "llm"
            ? "bg-[var(--card-bg-hover)] border-[var(--primary-color)]"
            : "bg-[var(--card-bg)] border-[var(--border-color)]"
        }`}
        style={{
          ...(messageEntry.role === "llm"
            ? {
                borderLeftWidth: "5px",
                borderLeftColor: "var(--primary-color)",
              }
            : {}),
          ...styles,
        }}
      >
        <div className="text-base font-mono text-[var(--text-secondary)] mb-3 flex items-center gap-2">
          {messageEntry.role === "llm" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
          <span>{messageEntry.role === "llm" ? "AI Interviewer" : "Candidate"}</span>
          <span>•</span>
          <span>{new Date(messageEntry.timestamp).toLocaleTimeString()}</span>
        </div>
        <div className="text-xl leading-relaxed text-[var(--text-primary)]">
          {messageEntry.message}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-hidden bg-[var(--bg-primary)] p-8 flex items-center justify-center transition-colors duration-300">
      <div className="relative w-full max-w-3xl h-auto">
        {messages.map((m) => renderMessage(m))}
      </div>
    </div>
  );
}
