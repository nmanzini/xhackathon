import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { mockInterviews } from "../data/mockInterviews";
import { analyzeInterview } from "../utils/analyzeInterview";
import type { InterviewAnalysis, Score, SolutionOutcome } from "../types";

const API_KEY = import.meta.env.VITE_XAI_API_KEY || "";

function getScoreColor(score: Score): string {
  switch (score) {
    case 5:
      return "#10b981";
    case 4:
      return "#22c55e";
    case 3:
      return "#eab308";
    case 2:
      return "#f97316";
    default:
      return "#ef4444";
  }
}

function getScoreLabel(score: Score): string {
  switch (score) {
    case 5:
      return "Excellent";
    case 4:
      return "Good";
    case 3:
      return "Average";
    case 2:
      return "Below Average";
    default:
      return "Poor";
  }
}

function getOutcomeColor(outcome: SolutionOutcome): string {
  switch (outcome) {
    case "optimal":
      return "var(--success-color)";
    case "working":
      return "var(--primary-color)";
    case "partial":
      return "var(--warning-color)";
    default:
      return "var(--alert-color)";
  }
}

function getOutcomeLabel(outcome: SolutionOutcome): string {
  switch (outcome) {
    case "optimal":
      return "Optimal Solution";
    case "working":
      return "Working Solution";
    case "partial":
      return "Partial Solution";
    case "incorrect":
      return "Incorrect Solution";
    case "incomplete":
      return "Incomplete";
  }
}

// Commented out unused function - may be useful later
// function getOutcomeDescription(outcome: SolutionOutcome): string {
//   switch (outcome) {
//     case "optimal":
//       return "Found the best possible solution";
//     case "working":
//       return "Solution works but could be optimized";
//     case "partial":
//       return "Partially correct, handles some cases";
//     case "incorrect":
//       return "Wrong approach or logic";
//     case "incomplete":
//       return "Did not finish the solution";
//   }
// }


interface ScoreRowProps {
  title: string;
  score: Score;
}

function ScoreRow({ title, score }: ScoreRowProps) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            {title}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold" style={{ color }}>
              {score}
            </span>
            <span className="text-sm text-[var(--text-disabled)]">/ 5</span>
            <span className="text-xs ml-2" style={{ color }}>
              {label}
            </span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-[var(--border-color)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(score / 5) * 100}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface CombinedScoresCardProps {
  overall: Score;
  communication: Score;
  thoughtProcess: Score;
}

function CombinedScoresCard({
  overall,
  communication,
  thoughtProcess,
}: CombinedScoresCardProps) {
  const overallColor = getScoreColor(overall);
  const overallLabel = getScoreLabel(overall);

  return (
    <div
      className="h-full p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-md)] transition-all duration-200 hover:shadow-[var(--shadow-lg)]"
      style={{ borderLeftWidth: "4px", borderLeftColor: overallColor }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${overallColor}20`, color: overallColor }}
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
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          Performance Scores
        </h3>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-4xl font-bold" style={{ color: overallColor }}>
          {overall}
        </span>
        <span className="text-lg text-[var(--text-disabled)]">/ 5</span>
      </div>
      <div className="text-sm font-medium mb-4" style={{ color: overallColor }}>
        {overallLabel} Overall
      </div>

      <div className="space-y-3 pt-4 border-t border-[var(--border-color)]">
        <ScoreRow title="Communication" score={communication} />
        <ScoreRow title="Thought Process" score={thoughtProcess} />
      </div>
    </div>
  );
}

interface OutcomeCardProps {
  outcome: SolutionOutcome;
  explanation: string;
}

function OutcomeCard({ outcome, explanation }: OutcomeCardProps) {
  const color = getOutcomeColor(outcome);
  const label = getOutcomeLabel(outcome);

  return (
    <div
      className="h-full flex flex-col p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-md)] transition-all duration-200 hover:shadow-[var(--shadow-lg)]"
      style={{ borderLeftWidth: "4px", borderLeftColor: color }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
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
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          Solution
        </h3>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>
        {label}
      </div>
      <div className="mt-3 flex-1 text-sm text-[var(--text-secondary)] overflow-y-auto">
        {explanation}
      </div>
    </div>
  );
}

function formatRelativeTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const interview = mockInterviews.find((i) => i.id === id);

  useEffect(() => {
    if (!interview) {
      setLoading(false);
      return;
    }

    async function runAnalysis() {
      try {
        setLoading(true);
        setError(null);
        const result = await analyzeInterview(interview!, API_KEY);
        setAnalysis(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
      } finally {
        setLoading(false);
      }
    }

    runAnalysis();
  }, [interview]);

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

  const firstTimestamp = interview.transcript[0]?.timestamp || 0;

  const chartData =
    analysis?.scoreProgression.map((snapshot) => {
      const entryTimestamp =
        interview.transcript[snapshot.transcriptIndex]?.timestamp || 0;
      const relativeMs = entryTimestamp - firstTimestamp;
      return {
        time: formatRelativeTime(relativeMs),
        timeMs: relativeMs,
        Communication: snapshot.scores.communication,
        "Thought Process": snapshot.scores.thoughtProcess,
      };
    }) || [];

  const hintTimes =
    analysis?.hints.map((h) => {
      const entryTimestamp =
        interview.transcript[h.transcriptIndex]?.timestamp || 0;
      return formatRelativeTime(entryTimestamp - firstTimestamp);
    }) || [];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/reviews"
              className="text-[var(--primary-color)] hover:opacity-80 transition-opacity"
            >
              ← Back
            </Link>
            <h1 className="text-4xl font-semibold text-[var(--text-primary)]">
              {interview.input.userInfo.name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--primary-color)] hover:bg-[var(--card-bg-hover)] transition-all duration-200 flex items-center gap-2"
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
            <Link
              to={`/review/${id}`}
              className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--primary-color)] hover:bg-[var(--card-bg-hover)] transition-all duration-200"
            >
              View Replay
            </Link>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[var(--border-color)] border-t-[var(--primary-color)] rounded-full animate-spin mb-4" />
            <p className="text-[var(--text-secondary)]">
              Analyzing interview with Grok...
            </p>
          </div>
        )}

        {error && (
          <div className="p-6 rounded-xl border border-[var(--alert-color)] bg-[var(--alert-color)]10 mb-8">
            <p className="text-[var(--alert-color)] font-medium">
              Analysis Error
            </p>
            <p className="text-[var(--text-secondary)] mt-1">{error}</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <CombinedScoresCard
                overall={analysis.finalScores.overall}
                communication={analysis.finalScores.communication}
                thoughtProcess={analysis.finalScores.thoughtProcess}
              />
              <div className="lg:col-span-2">
                <OutcomeCard
                  outcome={analysis.solutionOutcome}
                  explanation={analysis.solutionExplanation}
                />
              </div>
            </div>

            <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-md)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Score Progression
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-color)"
                    />
                    <XAxis
                      dataKey="time"
                      label={{
                        value: "Time",
                        position: "bottom",
                        fill: "var(--text-secondary)",
                      }}
                      tick={{ fill: "var(--text-secondary)" }}
                      stroke="var(--border-color)"
                    />
                    <YAxis
                      domain={[1, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      label={{
                        value: "Score",
                        angle: -90,
                        position: "insideLeft",
                        fill: "var(--text-secondary)",
                      }}
                      tick={{ fill: "var(--text-secondary)" }}
                      stroke="var(--border-color)"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card-bg)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        boxShadow: "var(--shadow-lg)",
                      }}
                      labelStyle={{ color: "var(--text-primary)" }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    {hintTimes.map((hintTime, idx) => (
                      <ReferenceLine
                        key={idx}
                        x={hintTime}
                        stroke="var(--warning-color)"
                        strokeDasharray="5 5"
                        label={{ value: "Hint", position: "top" }}
                      />
                    ))}
                    <Line
                      type="monotone"
                      dataKey="Communication"
                      stroke="#5bb3d8"
                      strokeWidth={2}
                      dot={{ fill: "#5bb3d8", strokeWidth: 2, r: 4 }}
                      activeDot={{
                        r: 6,
                        stroke: "#5bb3d8",
                        strokeWidth: 2,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Thought Process"
                      stroke="#5f6be1"
                      strokeWidth={2}
                      dot={{ fill: "#5f6be1", strokeWidth: 2, r: 4 }}
                      activeDot={{
                        r: 6,
                        stroke: "#5f6be1",
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-md)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Solution Hints
                </h2>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor:
                      analysis.hints.length > 0
                        ? "var(--warning-color)20"
                        : "var(--success-color)20",
                    color:
                      analysis.hints.length > 0
                        ? "var(--warning-color)"
                        : "var(--success-color)",
                  }}
                >
                  {analysis.hints.length} hint
                  {analysis.hints.length !== 1 ? "s" : ""}
                </span>
              </div>
              {analysis.hints.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-[var(--success-color)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-lg font-medium text-[var(--text-primary)] mb-1">
                    No hints needed!
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    The candidate solved it independently
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {analysis.hints.map((hint, index) => {
                    const entryTimestamp =
                      interview.transcript[hint.transcriptIndex]?.timestamp ||
                      0;
                    const relativeTime = formatRelativeTime(
                      entryTimestamp - firstTimestamp
                    );
                    return (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">💡</span>
                          <span className="text-xs font-medium text-[var(--text-disabled)]">
                            {relativeTime}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {hint.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                <div className="text-[var(--text-primary)] text-sm leading-relaxed border border-[var(--border-color)] rounded-lg p-4 max-h-32 overflow-y-auto bg-[var(--bg-primary)]">
                  {interview.input.instruction}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide font-medium text-[var(--text-secondary)] mb-2">
                  Expected Solution
                </div>
                <pre className="text-[var(--text-primary)] text-sm leading-relaxed border border-[var(--border-color)] rounded-lg p-4 max-h-48 overflow-y-auto bg-[var(--code-bg)] font-[var(--font-monospace)]">
                  {interview.input.expectedSolution}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
