import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PREDEFINED_QUESTIONS } from "../config/interview";
import { interviewSetupStore, customQuestionsStore, useStore } from "../stores";
import type { HelpLevel } from "../types";

const HELP_LEVELS: { value: HelpLevel; label: string; description: string }[] =
  [
    {
      value: "none",
      label: "None",
      description: "No hints or guidance provided",
    },
    {
      value: "low",
      label: "Low",
      description: "Minimal hints when stuck",
    },
    {
      value: "medium",
      label: "Medium",
      description: "Moderate guidance throughout",
    },
    {
      value: "high",
      label: "High",
      description: "Extensive help and explanations",
    },
  ];

export function InterviewSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [customQuestions] = useStore(customQuestionsStore);
  const [candidateName, setCandidateName] = useState("");
  const [helpLevel, setHelpLevel] = useState<HelpLevel>("low");
  const [selectedQuestionId, setSelectedQuestionId] = useState(
    PREDEFINED_QUESTIONS[0].id
  );
  const [customInstruction, setCustomInstruction] = useState(
    "You are a coding interviewer. Be concise."
  );

  useEffect(() => {
    const state = location.state as { selectedQuestionId?: string } | null;
    if (state?.selectedQuestionId) {
      setSelectedQuestionId(state.selectedQuestionId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const isValid = candidateName.trim().length > 0;

  function handleStart() {
    if (!isValid) {
      return;
    }

    interviewSetupStore.set({
      candidateName: candidateName.trim(),
      helpLevel,
      questionId: selectedQuestionId,
      customInstruction: customInstruction.trim(),
    });

    navigate("/interview");
  }

  function handleDeleteQuestion(questionId: string) {
    const updated = customQuestions.filter((q) => q.id !== questionId);
    customQuestionsStore.set(updated);
    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(PREDEFINED_QUESTIONS[0].id);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Candidates
          </button>
        </div>

        <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-8">
          New Interview
        </h1>

        <div className="space-y-8">
          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-md)]">
            <label className="block text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
              Candidate Name
            </label>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Enter candidate name..."
              className="w-full px-4 py-3 text-lg rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary-color)] transition-all"
            />
          </div>

          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-md)]">
            <label className="block text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
              Help Level
            </label>
            <div className="grid grid-cols-2 gap-3">
              {HELP_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setHelpLevel(level.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    helpLevel === level.value
                      ? "border-[var(--primary-color)] bg-[var(--primary-color)]/10"
                      : "border-[var(--border-color)] hover:border-[var(--text-disabled)]"
                  }`}
                >
                  <div
                    className={`font-medium ${
                      helpLevel === level.value
                        ? "text-[var(--primary-color)]"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {level.label}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)] mt-1">
                    {level.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                Select Problem
              </label>
              <button
                onClick={() => navigate("/interview/new/question")}
                className="px-3 py-1.5 text-sm rounded-lg border border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 transition-all flex items-center gap-1.5"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Custom
              </button>
            </div>
            <div className="space-y-3">
              {customQuestions.length > 0 && (
                <>
                  <div className="text-xs font-medium text-[var(--text-disabled)] uppercase tracking-wide pt-2">
                    Custom Questions
                  </div>
                  {customQuestions.map((question) => (
                    <div
                      key={question.id}
                      onClick={() => setSelectedQuestionId(question.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all cursor-pointer relative ${
                        selectedQuestionId === question.id
                          ? "border-[var(--primary-color)] bg-[var(--primary-color)]/10"
                          : "border-[var(--border-color)] hover:border-[var(--text-disabled)]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`font-medium ${
                              selectedQuestionId === question.id
                                ? "text-[var(--primary-color)]"
                                : "text-[var(--text-primary)]"
                            }`}
                          >
                            {question.title}
                          </div>
                          <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--primary-color)]/20 text-[var(--primary-color)]">
                            Custom
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuestion(question.id);
                          }}
                          className="rounded-lg text-[var(--text-disabled)] hover:text-red-500 hover:bg-red-500/10 transition-all self-center"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                        {question.question
                          .split("\n")
                          .find((line) => !line.startsWith("**") && line.trim())
                          ?.trim() || ""}
                      </div>
                    </div>
                  ))}
                  <div className="text-xs font-medium text-[var(--text-disabled)] uppercase tracking-wide pt-4">
                    Predefined Questions
                  </div>
                </>
              )}
              {PREDEFINED_QUESTIONS.map((question) => (
                <button
                  key={question.id}
                  onClick={() => setSelectedQuestionId(question.id)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedQuestionId === question.id
                      ? "border-[var(--primary-color)] bg-[var(--primary-color)]/10"
                      : "border-[var(--border-color)] hover:border-[var(--text-disabled)]"
                  }`}
                >
                  <div
                    className={`font-medium ${
                      selectedQuestionId === question.id
                        ? "text-[var(--primary-color)]"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {question.title}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                    {question.question
                      .split("\n")
                      .find((line) => !line.startsWith("**") && line.trim())
                      ?.trim() || ""}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-md)]">
            <label className="block text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
              Custom Instruction
            </label>
            <textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="Enter custom instructions for the interviewer..."
              rows={3}
              className="w-full px-4 py-3 text-lg rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary-color)] transition-all resize-none"
            />
          </div>

          <button
            onClick={handleStart}
            disabled={!isValid}
            className="w-full px-6 py-4 rounded-xl bg-[var(--primary-color)] text-white font-medium text-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[var(--shadow-md)]"
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
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Start Interview
          </button>
        </div>
      </div>
    </div>
  );
}
