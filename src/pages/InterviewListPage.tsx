import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mockInterviews } from "../data/mockInterviews";

export function InterviewListPage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredInterviews = mockInterviews.filter((interview) =>
    interview.input.userInfo.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8">
      <h1 className="text-4xl font-semibold text-[var(--text-primary)] mb-6">
        Interviews
      </h1>
      <div className="relative mb-8">
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
              interview.transcript[interview.transcript.length - 1]?.timestamp;
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

            return (
              <div
                key={interview.id}
                onClick={() => navigate(`/analyst/${interview.id}`)}
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
                    <div className="text-sm text-[var(--text-secondary)] bg-[var(--code-bg)] px-2 py-1 rounded">
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
  );
}
