import { useState, useRef, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { TranscriptView } from "../components/TranscriptView";
import { ReviewCodeViewer } from "../components/ReviewCodeViewer";
import { interviewsStore, useStore } from "../stores";

export function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [interviews] = useStore(interviewsStore);
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [showSettings, setShowSettings] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastPositionRef = useRef<number>(0);
  const initialScrollDoneRef = useRef<boolean>(false);

  const interview = interviews.find((i) => i.id === id);
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

  useEffect(() => {
    if (initialScrollDoneRef.current || !interview || totalSteps === 0) {
      return;
    }

    const targetTimeMs = searchParams.get("t");
    if (!targetTimeMs) {
      return;
    }

    const targetTime = parseInt(targetTimeMs, 10);
    if (isNaN(targetTime)) {
      return;
    }

    const firstTimestamp = interview.transcript[0]?.timestamp || 0;

    let closestIndex = 0;
    let closestDiff = Infinity;

    for (let i = 0; i < interview.transcript.length; i++) {
      const entryRelativeTime =
        interview.transcript[i].timestamp - firstTimestamp;
      const diff = Math.abs(entryRelativeTime - targetTime);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }

    initialScrollDoneRef.current = true;
    setTimelinePosition(closestIndex);
    lastPositionRef.current = closestIndex;

    const container = scrollContainerRef.current;
    if (container) {
      const maxScroll = container.scrollHeight - container.clientHeight;
      const scrollPercent = closestIndex / totalSteps;
      container.scrollTop = scrollPercent * maxScroll;
    }
  }, [interview, totalSteps, searchParams]);

  if (!interview || interview.transcript.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="text-xl text-[var(--text-primary)] mb-4">
            {!interview
              ? "Interview not found"
              : "No transcript data available"}
          </div>
          <Link
            to="/reviews"
            className="text-[var(--primary-color)] hover:underline"
          >
            Back to candidates
          </Link>
        </div>
      </div>
    );
  }

  const currentEntry = interview.transcript[timelinePosition];
  const currentCode = currentEntry?.code ?? "";

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
                className="text-[var(--primary-color)] hover:opacity-80 transition-opacity"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ direction: "ltr" }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setShowSettings(false)}
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Interview Settings
                </h2>
              </div>
              <button
                onClick={() => setShowSettings(false)}
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
            <div className="p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--primary-color)]/30 transition-colors duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary-color)]/10 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-[var(--primary-color)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="text-xs uppercase tracking-wide font-medium text-[var(--text-secondary)]">
                      Candidate
                    </div>
                  </div>
                  <div className="text-lg text-[var(--text-primary)] font-medium">
                    {interview.input.userInfo.name}
                  </div>
                </div>
                <div className="p-5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--primary-color)]/30 transition-colors duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary-color)]/10 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-[var(--primary-color)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-xs uppercase tracking-wide font-medium text-[var(--text-secondary)]">
                      Help Level
                    </div>
                  </div>
                  <span
                    className="inline-block px-4 py-1.5 rounded-full text-sm font-medium capitalize"
                    style={{
                      backgroundColor: "var(--primary-color)",
                      color: "white",
                    }}
                  >
                    {interview.input.helpLevel}
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--primary-color)]/30 transition-colors duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary-color)]/10 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-[var(--primary-color)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-xs uppercase tracking-wide font-medium text-[var(--text-secondary)]">
                    Question
                  </div>
                </div>
                <div className="text-[var(--text-primary)] text-sm leading-relaxed max-h-40 overflow-y-auto">
                  {interview.input.question}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--primary-color)]/30 transition-colors duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary-color)]/10 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-[var(--primary-color)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="text-xs uppercase tracking-wide font-medium text-[var(--text-secondary)]">
                    Instruction
                  </div>
                </div>
                <div className="text-[var(--text-primary)] text-sm leading-relaxed max-h-48 overflow-y-auto">
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
