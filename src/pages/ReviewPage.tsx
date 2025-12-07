import { useState, useRef, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { TranscriptView } from "../components/TranscriptView";
import { ReviewCodeViewer } from "../components/ReviewCodeViewer";
import { interviewsStore, useStore } from "../stores";
import { InterviewSettingsModal } from "../components/InterviewSettingsModal";
import { RawTranscriptModal } from "../components/RawTranscriptModal";

export function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [interviews] = useStore(interviewsStore);
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [showSettings, setShowSettings] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
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
            to="/"
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
                to="/"
                className="text-[var(--primary-color)] hover:opacity-80 transition-opacity"
              >
                ← Back
              </Link>
              <span className="text-[var(--text-primary)] font-medium">
                {interview.input.userInfo.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
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
              <button
                onClick={() => setShowTranscript(true)}
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
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                Transcript
              </button>
            </div>
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

      <div style={{ direction: "ltr" }}>
        <InterviewSettingsModal
          interview={interview}
          show={showSettings}
          onClose={() => setShowSettings(false)}
        />
        <RawTranscriptModal
          transcript={interview.transcript}
          show={showTranscript}
          onClose={() => setShowTranscript(false)}
        />
      </div>
    </div>
  );
}
