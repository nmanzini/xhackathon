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
};
