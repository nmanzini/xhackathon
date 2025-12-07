import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { customQuestionsStore } from "../stores";
import type { QuestionTemplate } from "../config/interview";

interface TestCaseInput {
  id: string;
  inputJson: string;
  expectedJson: string;
}

export function CustomQuestionPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [functionName, setFunctionName] = useState("");
  const [expectedSolution, setExpectedSolution] = useState("");
  const [starterCodeJs, setStarterCodeJs] = useState("");
  const [starterCodePy, setStarterCodePy] = useState("");
  const [testCases, setTestCases] = useState<TestCaseInput[]>([
    { id: "1", inputJson: "[]", expectedJson: "" },
  ]);
  const [finalTestCases, setFinalTestCases] = useState<TestCaseInput[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const isValid =
    title.trim().length > 0 &&
    question.trim().length > 0 &&
    functionName.trim().length > 0;

  function addTestCase(isFinal: boolean) {
    const cases = isFinal ? finalTestCases : testCases;
    const setCases = isFinal ? setFinalTestCases : setTestCases;
    const newId = String(cases.length + 1);
    setCases([...cases, { id: newId, inputJson: "[]", expectedJson: "" }]);
  }

  function removeTestCase(id: string, isFinal: boolean) {
    const setCases = isFinal ? setFinalTestCases : setTestCases;
    setCases((prev) => prev.filter((tc) => tc.id !== id));
  }

  function updateTestCase(
    id: string,
    field: "inputJson" | "expectedJson",
    value: string,
    isFinal: boolean
  ) {
    const setCases = isFinal ? setFinalTestCases : setTestCases;
    setCases((prev) =>
      prev.map((tc) => (tc.id === id ? { ...tc, [field]: value } : tc))
    );
  }

  function parseTestCases(
    cases: TestCaseInput[]
  ): { id: string; input: any[]; expected: any }[] | null {
    try {
      return cases.map((tc) => ({
        id: tc.id,
        input: JSON.parse(tc.inputJson),
        expected: JSON.parse(tc.expectedJson),
      }));
    } catch {
      return null;
    }
  }

  function handleSave() {
    const newErrors: string[] = [];

    if (!title.trim()) {
      newErrors.push("Title is required");
    }
    if (!question.trim()) {
      newErrors.push("Question description is required");
    }
    if (!functionName.trim()) {
      newErrors.push("Function name is required");
    }

    const parsedTestCases = parseTestCases(testCases);
    if (!parsedTestCases) {
      newErrors.push("Invalid JSON in test cases");
    }

    const parsedFinalTestCases = parseTestCases(finalTestCases);
    if (finalTestCases.length > 0 && !parsedFinalTestCases) {
      newErrors.push("Invalid JSON in final test cases");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const fn = functionName.trim();
    const defaultStarterJs =
      starterCodeJs.trim() ||
      `function ${fn}() {\n  // Your solution here\n  \n}`;
    const defaultStarterPy =
      starterCodePy.trim() ||
      `def ${fn}():\n    # Your solution here\n    pass`;

    const questionId = `custom-${Date.now()}`;
    const newQuestion: QuestionTemplate = {
      id: questionId,
      title: title.trim(),
      question: question.trim(),
      expectedSolution: expectedSolution.trim(),
      functionName: fn,
      starterCode: {
        javascript: defaultStarterJs,
        python: defaultStarterPy,
      },
      testCases: parsedTestCases || [],
      finalTestCases: parsedFinalTestCases || [],
    };

    const existing = customQuestionsStore.get();
    customQuestionsStore.set([...existing, newQuestion]);

    navigate("/interview/new", { state: { selectedQuestionId: questionId } });
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate("/interview/new")}
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
            Back to Interview Setup
          </button>
        </div>

        <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-8">
          Create Custom Question
        </h1>

        {errors.length > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/50 bg-red-500/10">
            <ul className="text-red-500 text-sm space-y-1">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-md)]">
            <label className="block text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Two Sum"
              className="w-full px-4 py-3 text-lg rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary-color)] transition-all"
            />
          </div>

          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-md)]">
            <label className="block text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
              Problem Description
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Describe the problem. You can use markdown formatting..."
              rows={8}
              className="w-full px-4 py-3 text-base rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary-color)] transition-all resize-none font-mono"
            />
          </div>

          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-md)]">
            <label className="block text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
              Function Name
            </label>
            <input
              type="text"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
              placeholder="e.g., two_sum"
              className="w-full px-4 py-3 text-lg rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary-color)] transition-all font-mono"
            />
          </div>

          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-md)]">
            <label className="block text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
              Expected Solution (Optional)
            </label>
            <textarea
              value={expectedSolution}
              onChange={(e) => setExpectedSolution(e.target.value)}
              placeholder="The ideal solution for reference..."
              rows={6}
              className="w-full px-4 py-3 text-base rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary-color)] transition-all resize-none font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-md)]">
              <label className="block text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
                Starter Code - JavaScript (Optional)
              </label>
              <textarea
                value={starterCodeJs}
                onChange={(e) => setStarterCodeJs(e.target.value)}
                placeholder={`function ${
                  functionName || "solution"
                }() {\n  // Your solution here\n}`}
                rows={5}
                className="w-full px-4 py-3 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary-color)] transition-all resize-none font-mono"
              />
            </div>

            <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-md)]">
              <label className="block text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
                Starter Code - Python (Optional)
              </label>
              <textarea
                value={starterCodePy}
                onChange={(e) => setStarterCodePy(e.target.value)}
                placeholder={`def ${
                  functionName || "solution"
                }():\n    # Your solution here\n    pass`}
                rows={5}
                className="w-full px-4 py-3 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary-color)] transition-all resize-none font-mono"
              />
            </div>
          </div>

          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                Test Cases
              </label>
              <button
                onClick={() => addTestCase(false)}
                className="px-3 py-1.5 text-sm rounded-lg border border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 transition-all"
              >
                + Add Test Case
              </button>
            </div>
            <div className="space-y-4">
              {testCases.map((tc, index) => (
                <div
                  key={tc.id}
                  className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      Test Case {index + 1}
                    </span>
                    {testCases.length > 1 && (
                      <button
                        onClick={() => removeTestCase(tc.id, false)}
                        className="text-red-500 hover:text-red-400 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[var(--text-disabled)] mb-1">
                        Input (JSON array)
                      </label>
                      <input
                        type="text"
                        value={tc.inputJson}
                        onChange={(e) =>
                          updateTestCase(
                            tc.id,
                            "inputJson",
                            e.target.value,
                            false
                          )
                        }
                        placeholder="e.g., [[2, 7, 11, 15], 9]"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary-color)] transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-disabled)] mb-1">
                        Expected (JSON)
                      </label>
                      <input
                        type="text"
                        value={tc.expectedJson}
                        onChange={(e) =>
                          updateTestCase(
                            tc.id,
                            "expectedJson",
                            e.target.value,
                            false
                          )
                        }
                        placeholder="e.g., [0, 1]"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary-color)] transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                  Hidden Test Cases (Optional)
                </label>
                <span className="text-xs text-[var(--text-disabled)]">
                  Run at end of interview for final evaluation
                </span>
              </div>
              <button
                onClick={() => addTestCase(true)}
                className="px-3 py-1.5 text-sm rounded-lg border border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 transition-all"
              >
                + Add Hidden Test
              </button>
            </div>
            {finalTestCases.length === 0 ? (
              <div className="text-center py-6 text-[var(--text-disabled)] text-sm">
                No hidden test cases added
              </div>
            ) : (
              <div className="space-y-4">
                {finalTestCases.map((tc, index) => (
                  <div
                    key={tc.id}
                    className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-[var(--text-secondary)]">
                        Hidden Test {index + 1}
                      </span>
                      <button
                        onClick={() => removeTestCase(tc.id, true)}
                        className="text-red-500 hover:text-red-400 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[var(--text-disabled)] mb-1">
                          Input (JSON array)
                        </label>
                        <input
                          type="text"
                          value={tc.inputJson}
                          onChange={(e) =>
                            updateTestCase(
                              tc.id,
                              "inputJson",
                              e.target.value,
                              true
                            )
                          }
                          placeholder="e.g., [[2, 7, 11, 15], 9]"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary-color)] transition-all font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--text-disabled)] mb-1">
                          Expected (JSON)
                        </label>
                        <input
                          type="text"
                          value={tc.expectedJson}
                          onChange={(e) =>
                            updateTestCase(
                              tc.id,
                              "expectedJson",
                              e.target.value,
                              true
                            )
                          }
                          placeholder="e.g., [0, 1]"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary-color)] transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            Save Question
          </button>
        </div>
      </div>
    </div>
  );
}
