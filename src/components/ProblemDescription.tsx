interface ProblemDescriptionProps {
  title: string;
  description: string;
}

export function ProblemDescription({
  title,
  description,
}: ProblemDescriptionProps) {
  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: "var(--card-bg)",
        borderLeft: "4px solid var(--primary-color)",
      }}
    >
      <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "var(--slider-bg-start)" }}
        >
          <svg
            className="w-4 h-4"
            style={{ color: "var(--primary-color)" }}
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
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Problem
        </h2>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
          {title}
        </h3>
        <div className="prose prose-sm max-w-none">
          <div
            className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: "var(--font-family)" }}
          >
            {description.split("\n").map((line, i) => {
              if (line.startsWith("```")) {
                return null;
              }
              if (line.includes("`")) {
                const parts = line.split(/(`[^`]+`)/g);
                return (
                  <p key={i} className="mb-2 text-[var(--text-secondary)]">
                    {parts.map((part, j) =>
                      part.startsWith("`") && part.endsWith("`") ? (
                        <code
                          key={j}
                          className="bg-[var(--code-bg)] px-1.5 py-0.5 rounded text-[var(--primary-color)] font-mono text-sm"
                        >
                          {part.slice(1, -1)}
                        </code>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </p>
                );
              }
              if (line.startsWith("**") && line.endsWith("**")) {
                return (
                  <h4
                    key={i}
                    className="font-semibold text-[var(--text-primary)] mt-4 mb-2"
                  >
                    {line.slice(2, -2)}
                  </h4>
                );
              }
              if (line.startsWith("- ")) {
                return (
                  <li
                    key={i}
                    className="ml-4 mb-1 text-[var(--text-secondary)]"
                  >
                    {line.slice(2)}
                  </li>
                );
              }
              if (line.trim()) {
                return (
                  <p key={i} className="mb-2 text-[var(--text-secondary)]">
                    {line}
                  </p>
                );
              }
              return <div key={i} className="h-2" />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
