interface InterviewPanelProps {
  isConnected?: boolean;
  isListening?: boolean;
  transcript?: string;
}

export function InterviewPanel({
  isConnected = false,
  isListening = false,
  transcript = "",
}: InterviewPanelProps) {
  return (
    <div className="h-full flex flex-col bg-zinc-900 text-white">
      <div className="p-4 border-b border-zinc-700">
        <h2 className="text-lg font-semibold">Voice AI Interviewer</h2>
        <div className="flex items-center gap-2 mt-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm text-zinc-400">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Status</h3>
            <div className="flex items-center gap-2">
              {isListening && (
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 bg-blue-500 animate-pulse rounded" />
                  <span className="w-1 h-4 bg-blue-500 animate-pulse rounded" />
                  <span className="w-1 h-2 bg-blue-500 animate-pulse rounded" />
                </div>
              )}
              <span className="text-sm">
                {isListening ? "Listening..." : "Waiting to start"}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-2">
              Transcript
            </h3>
            <div className="bg-zinc-800 rounded-lg p-3 min-h-[200px] text-sm">
              {transcript || "Interview transcript will appear here..."}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-zinc-700">
        <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
          Start Interview
        </button>
      </div>
    </div>
  );
}
