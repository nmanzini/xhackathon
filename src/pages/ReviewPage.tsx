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
      const newPosition = Math.min(
        Math.round(scrollPercent * (totalSteps - 1)),
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

  const visibleTranscript = interview.transcript.slice(0, timelinePosition + 1);
  const currentCode = interview.transcript[timelinePosition].code;

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
              className="px-3 py-1.5 text-sm rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--card-bg-hover)] hover:text-[var(--text-primary)] transition-all duration-200"
            >
              Settings
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <TranscriptView entries={visibleTranscript} />
          </div>
        </div>
        <div className="w-1/2 h-full bg-[var(--bg-primary)]">
          <ReviewCodeViewer code={currentCode} direction={direction} />
        </div>
      </div>

      {/* Spacer to create scroll height */}
      <div style={{ height: "calc(100vh + 200px)" }} />

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
