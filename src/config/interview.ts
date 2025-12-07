import type { InterviewInput } from "../types";

/**
 * Sample coding interview problem
 * This can be easily swapped for different problems
 */
export const DEFAULT_INTERVIEW: InterviewInput = {
  instruction: "You are a coding interviewer. Be concise.",

  question: `**Two Sum**

Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers that add up to \`target\`.

You may assume that each input has exactly one solution, and you may not use the same element twice.

**Example:**
\`\`\`
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Explanation: nums[0] + nums[1] = 2 + 7 = 9
\`\`\`

**Constraints:**
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- Only one valid answer exists`,

  userInfo: {
    name: "Nicola",
  },

  helpLevel: "low",

  expectedSolution: `function two_sum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,

  functionName: "two_sum",

  starterCode: {
    javascript: `function two_sum(nums, target) {
  // Your solution here
  
}`,
    python: `def two_sum(nums, target):
    # Your solution here
    pass`,
  },

  testCases: [
    { id: "1", input: [[2, 7, 11, 15], 9], expected: [0, 1] },
  ],

  // Hidden test cases - run at the end for final evaluation
  // User and LLM don't see these during the interview
  finalTestCases: [
    // Edge case: negative numbers
    { id: "final-1", input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
    // Edge case: target is 0
    { id: "final-2", input: [[-3, 4, 3, 90], 0], expected: [0, 2] },
    // Edge case: large numbers
    { id: "final-3", input: [[1000000000, 999999999, 1], 1000000001], expected: [0, 2] },
    // Edge case: duplicates
    { id: "final-4", input: [[3, 3], 6], expected: [0, 1] },
    // Edge case: minimum array size
    { id: "final-5", input: [[1, 2], 3], expected: [0, 1] },
  ],
};
