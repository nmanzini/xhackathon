import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mockInterviews } from "../data/mockInterviews";
import { analyzeInterview } from "../utils/analyzeInterview";
import type { InterviewAnalysis, InterviewOutput } from "../types";

const API_KEY = import.meta.env.VITE_XAI_API_KEY || "";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function analyzeWithRetry(
  interview: InterviewOutput,
  apiKey: string,
  maxRetries = 5
): Promise<InterviewAnalysis> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await analyzeInterview(interview, apiKey);
    } catch (error) {
      const isRateLimit =
        error instanceof Error && error.message.includes("429");
      if (isRateLimit && attempt < maxRetries - 1) {
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

function getScoreColor(score: number): string {
  if (score >= 5) {
    return "#10b981";
  }
  if (score >= 4) {
    return "#22c55e";
  }
  if (score >= 3) {
    return "#eab308";
  }
  if (score >= 2) {
    return "#f97316";
  }
  return "#ef4444";
}

const SCORE_OPTIONS = [
  { value: "all", label: "All Scores", color: null },
  { value: "5", label: "5", color: "#10b981" },
  { value: "4", label: "4+", color: "#22c55e" },
  { value: "3", label: "3+", color: "#eab308" },
  { value: "2", label: "2+", color: "#f97316" },
  { value: "1", label: "1+", color: "#ef4444" },
  { value: "unscored", label: "Unscored", color: null },
];

export function InterviewListPage() {
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<
    Record<string, InterviewAnalysis>
  >({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [isScoring, setIsScoring] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleScoreAll() {
    const uncachedInterviews = mockInterviews.filter(
      (interview) => !analysisResults[interview.id]
    );

    if (uncachedInterviews.length === 0) {
      return;
    }

    setIsScoring(true);
    setLoadingIds(new Set(uncachedInterviews.map((i) => i.id)));

    const results = await Promise.allSettled(
      uncachedInterviews.map(async (interview) => {
        const analysis = await analyzeWithRetry(interview, API_KEY);
        setAnalysisResults((prev) => ({
          ...prev,
          [interview.id]: analysis,
        }));
        setLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(interview.id);
          return next;
        });
        return { id: interview.id, analysis };
      })
    );

    setIsScoring(false);
    setLoadingIds(new Set());

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.error(`${failed.length} analyses failed`);
    }
  }

  const filteredInterviews = mockInterviews.filter((interview) => {
    const matchesSearch = interview.input.userInfo.name
      .toLowerCase()
      .includes(search.toLowerCase());

    if (!matchesSearch) {
      return false;
    }

    if (scoreFilter === "all") {
      return true;
    }

    const analysis = analysisResults[interview.id];

    if (scoreFilter === "unscored") {
      return !analysis;
    }

    if (!analysis) {
      return false;
    }

    const minScore = parseInt(scoreFilter);
    return analysis.finalScores.overall >= minScore;
  });

  return (
    <div className="h-screen bg-[var(--bg-primary)] p-8 flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h1 className="text-4xl font-semibold text-[var(--text-primary)]">
          Interviews
        </h1>
        <button
          onClick={handleScoreAll}
          disabled={isScoring}
          className="px-6 py-3 rounded-xl border-2 border-[var(--primary-color)] bg-[var(--card-bg)] text-[var(--primary-color)] font-medium text-lg hover:bg-[var(--card-bg-hover)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-[var(--shadow-md)]"
        >
          {isScoring ? (
            <div className="w-6 h-6 border-2 border-[var(--border-color)] border-t-[var(--primary-color)] rounded-full animate-spin" />
          ) : (
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          )}
          {isScoring ? "Scoring..." : "Score All Candidates"}
        </button>
      </div>
      <div className="flex gap-3 shrink-0 bg-[var(--bg-primary)] relative z-10">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search interviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-5 py-4 pl-14 text-lg rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary-color)] shadow-[var(--shadow-sm)] transition-all"
          />
          <svg
            className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-disabled)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 px-4 py-4 rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--card-bg-hover)]"
          >
            <svg
              className="w-5 h-5 text-[var(--text-disabled)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span className="min-w-[80px] text-left">
              {SCORE_OPTIONS.find((o) => o.value === scoreFilter)?.label}
            </span>
            <svg
              className={`w-4 h-4 text-[var(--text-disabled)] transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-lg)] z-50 overflow-hidden">
              {SCORE_OPTIONS.map((option, index) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setScoreFilter(option.value);
                    setDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-[var(--card-bg-hover)] transition-colors ${
                    scoreFilter === option.value
                      ? "bg-[var(--card-bg-hover)]"
                      : ""
                  } ${index === 0 ? "rounded-t-xl" : ""} ${
                    index === SCORE_OPTIONS.length - 1 ? "rounded-b-xl" : ""
                  }`}
                >
                  {option.color ? (
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  ) : (
                    <span className="w-3 h-3 rounded-full bg-[var(--text-disabled)] opacity-30" />
                  )}
                  <span
                    style={{ color: option.color || "var(--text-primary)" }}
                  >
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto border-b border-[var(--border-color)] pt-4 pb-4">
        <div className="grid gap-4">
          {filteredInterviews.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              No interviews found matching "{search}"
            </div>
          ) : (
            filteredInterviews.map((interview) => {
              const startTime = interview.transcript[0]?.timestamp;
              const formattedDate = startTime
                ? new Date(startTime).toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "Unknown date";

              const firstTimestamp = interview.transcript[0]?.timestamp;
              const lastTimestamp =
                interview.transcript[interview.transcript.length - 1]
                  ?.timestamp;
              const totalTimeMs =
                firstTimestamp && lastTimestamp
                  ? lastTimestamp - firstTimestamp
                  : 0;
              const totalMinutes = Math.floor(totalTimeMs / 60000);
              const totalSeconds = Math.floor((totalTimeMs % 60000) / 1000);
              const formattedTime =
                totalMinutes > 0
                  ? `${totalMinutes}m ${totalSeconds}s`
                  : `${totalSeconds}s`;

              const analysis = analysisResults[interview.id];
              const isLoading = loadingIds.has(interview.id);

              return (
                <div
                  key={interview.id}
                  onClick={() => navigate(`/analysis/${interview.id}`)}
                  className="block p-5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-md)] transition-all duration-200 cursor-pointer hover:bg-[var(--card-bg-hover)]"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: "var(--primary-color)" }}
                      >
                        {interview.input.userInfo.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">
                          {interview.input.userInfo.name}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)]">
                          {formattedDate}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 flex justify-center">
                        {isLoading && (
                          <div className="w-6 h-6 border-2 border-[var(--border-color)] border-t-[var(--primary-color)] rounded-full animate-spin" />
                        )}
                        {analysis && (
                          <div
                            className="px-2 py-1 rounded-lg text-sm font-medium text-center"
                            style={{
                              backgroundColor: `${getScoreColor(
                                analysis.finalScores.overall
                              )}20`,
                              color: getScoreColor(
                                analysis.finalScores.overall
                              ),
                            }}
                          >
                            {analysis.finalScores.overall}/5
                          </div>
                        )}
                      </div>
                      <div className="w-20 text-sm text-[var(--text-secondary)] bg-[var(--code-bg)] px-2 py-1 rounded text-center">
                        {formattedTime}
                      </div>
                      <Link
                        to={`/review/${interview.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary-color)] hover:bg-[var(--card-bg-hover)] transition-all duration-200"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
