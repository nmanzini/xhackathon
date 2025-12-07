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
};

/**
 * Starter code template for the problem
 */
export const DEFAULT_STARTER_CODE = `// Two Sum Problem
// Return indices of two numbers that add up to target

function twoSum(nums: number[], target: number): number[] {
  // Your solution here
  
}

// Test your solution
const nums = [2, 7, 11, 15];
const target = 9;
console.log(twoSum(nums, target)); // Expected: [0, 1]
`;
