import type { InterviewOutput } from "../types";

interface InterviewSettingsModalProps {
  interview: InterviewOutput;
  show: boolean;
  onClose: () => void;
}

export function InterviewSettingsModal({
  interview,
  show,
  onClose,
}: InterviewSettingsModalProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
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
            onClick={onClose}
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
            <div className="px-5 py-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--primary-color)]/30 transition-colors duration-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
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
              <div className="text-sm text-[var(--text-primary)] font-medium">
                {interview.input.userInfo.name}
              </div>
            </div>
            <div className="px-5 py-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--primary-color)]/30 transition-colors duration-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
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
            <div className="text-sm text-[var(--text-primary)] font-medium leading-relaxed max-h-40 overflow-y-auto">
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
            <div className="text-sm text-[var(--text-primary)] font-medium leading-relaxed max-h-32 overflow-y-auto">
              {interview.input.instruction}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--primary-color)]/30 transition-colors duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--success-color)]/10 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-[var(--success-color)]"
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
              <div className="text-xs uppercase tracking-wide font-medium text-[var(--text-secondary)]">
                Expected Solution
              </div>
            </div>
            <pre className="text-sm text-[var(--text-primary)] font-medium leading-relaxed max-h-56 overflow-y-auto bg-[var(--code-bg)] rounded-lg p-4 font-[var(--font-monospace)]">
              {interview.input.expectedSolution}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
