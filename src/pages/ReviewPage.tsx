import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { TranscriptView } from "../components/TranscriptView";
import { ReviewCodeViewer } from "../components/ReviewCodeViewer";
import { mockInterviews } from "../data/mockInterviews";

export function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [showSettings, setShowSettings] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastPositionRef = useRef<number>(0);

  const interview = mockInterviews.find((i) => i.id === id);
  const totalSteps = interview?.transcript.length ?? 0;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !interview) {
      return;
    }

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;
      const scrollPercent = maxScroll > 0 ? scrollTop / maxScroll : 0;
      const adjustedPercent = Math.min(scrollPercent * 1.01, 1);
      const newPosition = Math.min(
        Math.floor(adjustedPercent * totalSteps),
        totalSteps - 1
      );
      if (newPosition !== lastPositionRef.current) {
        setDirection(
          newPosition > lastPositionRef.current ? "forward" : "backward"
        );
        lastPositionRef.current = newPosition;
        setTimelinePosition(newPosition);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [totalSteps, interview]);

  if (!interview) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="text-xl text-[var(--text-primary)] mb-4">
            Interview not found
          </div>
          <Link
            to="/reviews"
            className="text-[var(--primary-color)] hover:underline"
          >
            Back to interviews
          </Link>
        </div>
      </div>
    );
  }

  const currentEntry = interview.transcript[timelinePosition];
  const currentCode = currentEntry.code;

  return (
    <div
      ref={scrollContainerRef}
      className="review-scroll-container h-screen w-screen overflow-y-scroll bg-[var(--bg-primary)]"
      style={{ direction: "rtl" }}
    >
      {/* Fixed content panels - left-8 leaves room for scrollbar */}
      <div
        className="fixed top-0 left-8 bottom-0 right-0 flex"
        style={{ direction: "ltr" }}
      >
        <div className="w-1/2 h-full border-r border-[var(--border-color)] flex flex-col">
          <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/reviews"
                className="text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors"
              >
                ← Back
              </Link>
              <span className="text-[var(--text-primary)] font-medium">
                {interview.input.userInfo.name}
              </span>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="px-3 py-1.5 text-sm rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--primary-color)] hover:bg-[var(--card-bg-hover)] transition-all duration-200 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <TranscriptView entry={currentEntry} />
          </div>
        </div>
        <div className="w-1/2 h-full bg-[var(--bg-primary)]">
          <ReviewCodeViewer code={currentCode} direction={direction} />
        </div>
      </div>

      {/* Spacer to create scroll height */}
      <div style={{ height: `calc(100vh + ${totalSteps * 100}px)` }} />

      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ direction: "ltr" }}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSettings(false)}
          />
          <div className="relative bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] shadow-[var(--shadow-xl)] w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)] shrink-0">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Interview Settings
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex gap-6">
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wide font-medium text-[var(--text-secondary)] mb-2">
                    Candidate
                  </div>
                  <div className="text-[var(--text-primary)] font-medium">
                    {interview.input.userInfo.name}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wide font-medium text-[var(--text-secondary)] mb-2">
                    Help Level
                  </div>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-sm font-medium capitalize"
                    style={{
                      backgroundColor: "var(--slider-bg-start)",
                      color: "var(--primary-color)",
                    }}
                  >
                    {interview.input.helpLevel}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide font-medium text-[var(--text-secondary)] mb-2">
                  Question
                </div>
                <div className="text-[var(--text-primary)] text-sm leading-relaxed border border-[var(--border-color)] rounded-lg p-4 max-h-40 overflow-y-auto bg-[var(--bg-primary)]">
                  {interview.input.question}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide font-medium text-[var(--text-secondary)] mb-2">
                  Instruction
                </div>
                <div className="text-[var(--text-primary)] text-sm leading-relaxed border border-[var(--border-color)] rounded-lg p-4 max-h-48 overflow-y-auto bg-[var(--bg-primary)]">
                  {interview.input.instruction}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
