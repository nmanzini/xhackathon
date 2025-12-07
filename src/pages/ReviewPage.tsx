import { useState, useRef, useEffect } from "react";
import { TranscriptView } from "../components/TranscriptView";
import { ReviewCodeViewer } from "../components/ReviewCodeViewer";
import type { InterviewOutput } from "../types/index";

const mockInterviewData: InterviewOutput = {
  input: {
    instruction: "Conduct a technical interview",
    question: "Implement a function to find the longest palindromic substring",
    userInfo: { name: "Alex Chen" },
    helpLevel: "medium",
  },
  compiledSystemPrompt: "You are an AI interviewer...",
  transcript: [
    {
      role: "llm",
      message: "Hello Alex! Ready to start the interview?",
      code: "// Welcome to the Voice AI Interview\n// Write your solution below\n\nfunction solution() {\n  // Your code here\n}\n",
      timestamp: Date.now() - 600000,
    },
    {
      role: "user",
      message: "Yes, I'm ready!",
      code: "// Welcome to the Voice AI Interview\n// Write your solution below\n\nfunction solution() {\n  // Your code here\n}\n",
      timestamp: Date.now() - 590000,
    },
    {
      role: "llm",
      message:
        "Great! Your task is to implement a function that finds the longest palindromic substring in a given string.",
      code: "// Welcome to the Voice AI Interview\n// Write your solution below\n\nfunction solution() {\n  // Your code here\n}\n",
      timestamp: Date.now() - 580000,
    },
    {
      role: "user",
      message:
        "Okay, let me think about this. I'll start by defining the function.",
      code: "function findLongestPalindrome(s) {\n  // TODO: implement\n}\n",
      timestamp: Date.now() - 570000,
    },
    {
      role: "llm",
      message: "Good start! Can you explain your approach?",
      code: "function findLongestPalindrome(s) {\n  // TODO: implement\n}\n",
      timestamp: Date.now() - 560000,
    },
    {
      role: "user",
      message:
        "I'm thinking of using the expand around center approach. For each position, I'll expand outward while characters match.",
      code: "function findLongestPalindrome(s) {\n  if (s.length < 2) return s;\n  \n  let longest = '';\n  \n  for (let i = 0; i < s.length; i++) {\n    // Check odd length palindromes\n    // Check even length palindromes\n  }\n  \n  return longest;\n}\n",
      timestamp: Date.now() - 550000,
    },
    {
      role: "llm",
      message: "Excellent approach! Now let's implement the expansion logic.",
      code: "function findLongestPalindrome(s) {\n  if (s.length < 2) return s;\n  \n  let longest = '';\n  \n  for (let i = 0; i < s.length; i++) {\n    // Check odd length palindromes\n    // Check even length palindromes\n  }\n  \n  return longest;\n}\n",
      timestamp: Date.now() - 540000,
    },
    {
      role: "user",
      message: "I'll create a helper function to expand around a center.",
      code: "function findLongestPalindrome(s) {\n  if (s.length < 2) return s;\n  \n  let longest = '';\n  \n  function expandAroundCenter(left, right) {\n    while (left >= 0 && right < s.length && s[left] === s[right]) {\n      left--;\n      right++;\n    }\n    return s.slice(left + 1, right);\n  }\n  \n  for (let i = 0; i < s.length; i++) {\n    const odd = expandAroundCenter(i, i);\n    const even = expandAroundCenter(i, i + 1);\n    const longer = odd.length > even.length ? odd : even;\n    if (longer.length > longest.length) {\n      longest = longer;\n    }\n  }\n  \n  return longest;\n}\n",
      timestamp: Date.now() - 530000,
    },
  ],
};

export function ReviewPage() {
  const [timelinePosition, setTimelinePosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const totalSteps = mockInterviewData.transcript.length;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;
      const scrollPercent = maxScroll > 0 ? scrollTop / maxScroll : 0;
      const newPosition = Math.min(
        Math.round(scrollPercent * (totalSteps - 1)),
        totalSteps - 1
      );
      setTimelinePosition(newPosition);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [totalSteps]);

  const visibleTranscript = mockInterviewData.transcript.slice(
    0,
    timelinePosition + 1
  );
  const currentCode = mockInterviewData.transcript[timelinePosition].code;

  return (
    <div
      ref={scrollContainerRef}
      className="review-scroll-container h-screen w-screen overflow-y-scroll bg-[var(--bg-primary)]"
      style={{ direction: "rtl" }}
    >
      {/* Fixed content panels - left-5 leaves room for scrollbar */}
      <div
        className="fixed top-0 left-5 bottom-0 right-0 flex"
        style={{ direction: "ltr" }}
      >
        <div className="w-1/2 h-full border-r border-[var(--border-color)]">
          <TranscriptView entries={visibleTranscript} />
        </div>
        <div className="w-1/2 h-full bg-[var(--code-bg)]">
          <ReviewCodeViewer code={currentCode} />
        </div>
      </div>

      {/* Spacer to create scroll height */}
      <div style={{ height: "calc(100vh + 200px)" }} />
    </div>
  );
}
