import { useEffect, useRef, useState } from "react";
import type { TranscriptEntry } from "../hooks/useTranscript";

interface InterviewPanelProps {
  isConnected: boolean;
  isCapturing: boolean;
  audioLevel: number;
  transcript: TranscriptEntry[];
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  hideHeader?: boolean;
}

export function InterviewPanel({
  isConnected,
  isCapturing,
  audioLevel,
  transcript,
  error,
  onStart,
  onStop,
  hideHeader = false,
}: InterviewPanelProps) {
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [expandedCodeBlocks, setExpandedCodeBlocks] = useState<Set<number>>(new Set());

  // Auto-scroll to bottom when transcript updates
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const toggleCodeBlock = (index: number) => {
    setExpandedCodeBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{
        backgroundColor: "var(--card-bg)",
        borderLeft: hideHeader ? "none" : "4px solid var(--invite-color)",
      }}
    >
      {/* Header - compact version when hideHeader */}
      {!hideHeader && (
        <div className="p-6 border-b border-[var(--border-color)] bg-[var(--card-bg)]">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-[var(--shadow-md)] transition-all duration-200"
              style={{
                backgroundColor: isConnected
                  ? "rgba(91, 179, 216, 0.2)"
                  : "rgba(91, 179, 216, 0.1)",
              }}
            >
              <svg
                className="w-6 h-6"
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
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
                Interview
              </h2>
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isConnected ? 'animate-pulse' : ''}`}
                  style={{
                    backgroundColor: isConnected
                      ? "var(--success-color)"
                      : "var(--text-disabled)",
                    boxShadow: isConnected ? '0 0 8px var(--success-color)' : 'none',
                  }}
                />
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Compact status bar when header is hidden */}
      {hideHeader && (
        <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--card-bg)] flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isConnected ? 'animate-pulse' : ''}`}
            style={{
              backgroundColor: isConnected
                ? "var(--success-color)"
                : "var(--text-disabled)",
              boxShadow: isConnected ? '0 0 8px var(--success-color)' : 'none',
            }}
          />
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      )}

      {/* Audio Level Indicator */}
      {isCapturing && (
        <div className="px-6 py-4 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--slider-bg-start)] to-[var(--slider-bg-end)]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full transition-all duration-100 shadow-sm"
                  style={{
                    height: `${16 + i * 5}px`,
                    backgroundColor:
                      audioLevel > i * 0.1
                        ? "var(--success-color)"
                        : "var(--border-color)",
                    boxShadow: audioLevel > i * 0.1 ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                  }}
                />
              ))}
            </div>
            <span className="text-base font-medium text-[var(--text-primary)]">
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
      <div className="flex-1 p-6 overflow-y-auto bg-[var(--bg-primary)]">
        <div className="max-w-2xl mx-auto space-y-4">
          {transcript.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-base text-[var(--text-disabled)] italic">
                Start the interview to begin the conversation...
              </p>
            </div>
          ) : (
            transcript.map((entry, index) => {
              // Determine colors and labels based on role
              const getStyle = () => {
                switch (entry.role) {
                  case "assistant":
                    return { bg: "var(--card-bg-hover)", border: "var(--primary-color)", color: "var(--primary-color)" };
                  case "code":
                    return { bg: "var(--code-bg)", border: "var(--warning-color)", color: "var(--warning-color)" };
                  case "tool":
                    return { bg: "rgba(139, 92, 246, 0.1)", border: "rgb(139, 92, 246)", color: "rgb(139, 92, 246)" };
                  case "test_run":
                    return { bg: "rgba(16, 185, 129, 0.1)", border: "rgb(16, 185, 129)", color: "rgb(16, 185, 129)" };
                  default:
                    return { bg: "var(--card-bg)", border: "var(--invite-color)", color: "var(--invite-color)" };
                }
              };
              
              const getLabel = () => {
                switch (entry.role) {
                  case "assistant": return "🤖 AI Interviewer";
                  case "code": return "📄 Code Sent";
                  case "tool": return `🔧 ${entry.toolName === "run_tests" ? "Tests Run" : entry.toolName === "add_test_case" ? "Test Added" : entry.toolName || "Tool"}`;
                  case "test_run": return "🧪 Test Run";
                  default: return "👤 Candidate";
                }
              };
              
              const style = getStyle();
              
              return (
                <div
                  key={index}
                  className="p-6 rounded-xl border shadow-[var(--shadow-lg)] transition-all duration-300 hover:shadow-[var(--shadow-xl)]"
                  style={{
                    backgroundColor: style.bg,
                    borderLeftWidth: "4px",
                    borderLeftColor: style.border,
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="text-sm font-mono text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                    <span className="font-medium" style={{ color: style.color }}>
                      {getLabel()}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {entry.role === "code" ? (
                    <div>
                      <button
                        onClick={() => toggleCodeBlock(index)}
                        className="w-full text-left flex items-center justify-between p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-[var(--card-bg-hover)] transition-colors"
                      >
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {expandedCodeBlocks.has(index) ? "Hide code" : "View code"} ({entry.content.split('\n').length} lines)
                        </span>
                        <svg
                          className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${expandedCodeBlocks.has(index) ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedCodeBlocks.has(index) && (
                        <pre className="mt-2 text-sm font-mono overflow-auto max-h-60 whitespace-pre-wrap p-4 rounded-lg text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border-color)]">
                          {entry.content}
                        </pre>
                      )}
                    </div>
                  ) : entry.role === "test_run" && entry.testResults ? (
                    <div className="space-y-2">
                      <p className="text-base leading-relaxed text-[var(--text-primary)] mb-3">
                        {entry.content}
                      </p>
                      <div className="space-y-2 text-sm">
                        {entry.testResults.map((result, idx) => (
                          <div 
                            key={result.id}
                            className={`p-3 rounded-lg border ${result.passed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}
                          >
                            <div className="flex items-center gap-2 font-medium">
                              <span>{result.passed ? '✓' : '✗'}</span>
                              <span>Test {idx + 1}</span>
                            </div>
                            {!result.passed && (
                              <div className="mt-2 ml-6 text-[var(--text-secondary)] space-y-1">
                                <div>Expected: {result.expected !== undefined ? JSON.stringify(result.expected) : '(undefined)'}</div>
                                <div>Got: {result.actual !== undefined ? JSON.stringify(result.actual) : result.error || '(undefined)'}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-base leading-relaxed text-[var(--text-primary)]">
                      {entry.content}
                    </p>
                  )}
                </div>
              );
            })
          )}
          {/* Invisible element at the end for auto-scroll */}
          <div ref={transcriptEndRef} />
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
