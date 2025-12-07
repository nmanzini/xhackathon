interface ProblemDescriptionProps {
  title: string;
  description: string;
}

export function ProblemDescription({ title, description }: ProblemDescriptionProps) {
  return (
    <div className="h-full flex flex-col bg-zinc-900 text-white overflow-hidden">
      <div className="p-4 border-b border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-100">Problem</h2>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        <div className="prose prose-invert prose-sm max-w-none">
          <div
            className="text-zinc-300 leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            {description.split("\n").map((line, i) => {
              // Handle code blocks
              if (line.startsWith("```")) {
                return null;
              }
              // Handle inline code
              if (line.includes("`")) {
                const parts = line.split(/(`[^`]+`)/g);
                return (
                  <p key={i} className="mb-2">
                    {parts.map((part, j) =>
                      part.startsWith("`") && part.endsWith("`") ? (
                        <code
                          key={j}
                          className="bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-sm"
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
              // Handle bold text
              if (line.startsWith("**") && line.endsWith("**")) {
                return (
                  <h4 key={i} className="font-semibold text-white mt-4 mb-2">
                    {line.slice(2, -2)}
                  </h4>
                );
              }
              // Handle bullet points
              if (line.startsWith("- ")) {
                return (
                  <li key={i} className="ml-4 mb-1 text-zinc-300">
                    {line.slice(2)}
                  </li>
                );
              }
              // Regular text
              if (line.trim()) {
                return (
                  <p key={i} className="mb-2 text-zinc-300">
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

