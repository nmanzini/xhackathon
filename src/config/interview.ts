import type { InterviewInput } from "../types";

export interface QuestionTemplate {
  id: string;
  title: string;
  question: string;
  expectedSolution: string;
  functionName: string;
  starterCode: { javascript: string; python: string };
  testCases: { id: string; input: any[]; expected: any }[];
  finalTestCases: { id: string; input: any[]; expected: any }[];
}

export const PREDEFINED_QUESTIONS: QuestionTemplate[] = [
  {
    id: "two-sum",
    title: "Two Sum",
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
    testCases: [{ id: "1", input: [[2, 7, 11, 15], 9], expected: [0, 1] }],
    finalTestCases: [
      { id: "final-1", input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
      { id: "final-2", input: [[-3, 4, 3, 90], 0], expected: [0, 2] },
      {
        id: "final-3",
        input: [[1000000000, 999999999, 1], 1000000001],
        expected: [0, 2],
      },
      { id: "final-4", input: [[3, 3], 6], expected: [0, 1] },
      { id: "final-5", input: [[1, 2], 3], expected: [0, 1] },
    ],
  },
  {
    id: "reverse-string",
    title: "Reverse String",
    question: `**Reverse String**

Write a function that reverses a string. The input string is given as an array of characters.

You must do this by modifying the input array in-place with O(1) extra memory.

**Example 1:**
\`\`\`
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]
\`\`\`

**Example 2:**
\`\`\`
Input: s = ["H","a","n","n","a","h"]
Output: ["h","a","n","n","a","H"]
\`\`\`

**Constraints:**
- 1 <= s.length <= 10^5
- s[i] is a printable ascii character`,
    expectedSolution: `function reverse_string(s) {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    [s[left], s[right]] = [s[right], s[left]];
    left++;
    right--;
  }
  return s;
}`,
    functionName: "reverse_string",
    starterCode: {
      javascript: `function reverse_string(s) {
  // Your solution here
  
}`,
      python: `def reverse_string(s):
    # Your solution here
    pass`,
    },
    testCases: [
      {
        id: "1",
        input: [["h", "e", "l", "l", "o"]],
        expected: ["o", "l", "l", "e", "h"],
      },
    ],
    finalTestCases: [
      {
        id: "final-1",
        input: [["H", "a", "n", "n", "a", "h"]],
        expected: ["h", "a", "n", "n", "a", "H"],
      },
      { id: "final-2", input: [["a"]], expected: ["a"] },
      { id: "final-3", input: [["a", "b"]], expected: ["b", "a"] },
      {
        id: "final-4",
        input: [["A", " ", "m", "a", "n"]],
        expected: ["n", "a", "m", " ", "A"],
      },
    ],
  },
  {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    question: `**Valid Palindrome**

A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.

**Example 1:**
\`\`\`
Input: s = "A man, a plan, a canal: Panama"
Output: true
Explanation: "amanaplanacanalpanama" is a palindrome.
\`\`\`

**Example 2:**
\`\`\`
Input: s = "race a car"
Output: false
Explanation: "raceacar" is not a palindrome.
\`\`\`

**Constraints:**
- 1 <= s.length <= 2 * 10^5
- s consists only of printable ASCII characters`,
    expectedSolution: `function is_palindrome(s) {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let left = 0;
  let right = cleaned.length - 1;
  while (left < right) {
    if (cleaned[left] !== cleaned[right]) {
      return false;
    }
    left++;
    right--;
  }
  return true;
}`,
    functionName: "is_palindrome",
    starterCode: {
      javascript: `function is_palindrome(s) {
  // Your solution here
  
}`,
      python: `def is_palindrome(s):
    # Your solution here
    pass`,
    },
    testCases: [
      {
        id: "1",
        input: ["A man, a plan, a canal: Panama"],
        expected: true,
      },
    ],
    finalTestCases: [
      { id: "final-1", input: ["race a car"], expected: false },
      { id: "final-2", input: [" "], expected: true },
      { id: "final-3", input: ["aa"], expected: true },
      { id: "final-4", input: ["0P"], expected: false },
    ],
  },
  {
    id: "fizz-buzz",
    title: "FizzBuzz",
    question: `**FizzBuzz**

Given an integer \`n\`, return a string array \`answer\` (1-indexed) where:

- \`answer[i] == "FizzBuzz"\` if \`i\` is divisible by 3 and 5.
- \`answer[i] == "Fizz"\` if \`i\` is divisible by 3.
- \`answer[i] == "Buzz"\` if \`i\` is divisible by 5.
- \`answer[i] == i\` (as a string) if none of the above conditions are true.

**Example 1:**
\`\`\`
Input: n = 3
Output: ["1","2","Fizz"]
\`\`\`

**Example 2:**
\`\`\`
Input: n = 5
Output: ["1","2","Fizz","4","Buzz"]
\`\`\`

**Example 3:**
\`\`\`
Input: n = 15
Output: ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]
\`\`\`

**Constraints:**
- 1 <= n <= 10^4`,
    expectedSolution: `function fizz_buzz(n) {
  const result = [];
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) {
      result.push("FizzBuzz");
    } else if (i % 3 === 0) {
      result.push("Fizz");
    } else if (i % 5 === 0) {
      result.push("Buzz");
    } else {
      result.push(String(i));
    }
  }
  return result;
}`,
    functionName: "fizz_buzz",
    starterCode: {
      javascript: `function fizz_buzz(n) {
  // Your solution here
  
}`,
      python: `def fizz_buzz(n):
    # Your solution here
    pass`,
    },
    testCases: [{ id: "1", input: [3], expected: ["1", "2", "Fizz"] }],
    finalTestCases: [
      { id: "final-1", input: [5], expected: ["1", "2", "Fizz", "4", "Buzz"] },
      {
        id: "final-2",
        input: [15],
        expected: [
          "1",
          "2",
          "Fizz",
          "4",
          "Buzz",
          "Fizz",
          "7",
          "8",
          "Fizz",
          "Buzz",
          "11",
          "Fizz",
          "13",
          "14",
          "FizzBuzz",
        ],
      },
      { id: "final-3", input: [1], expected: ["1"] },
    ],
  },
];

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

  testCases: [{ id: "1", input: [[2, 7, 11, 15], 9], expected: [0, 1] }],

  // Hidden test cases - run at the end for final evaluation
  // User and LLM don't see these during the interview
  finalTestCases: [
    // Edge case: negative numbers
    { id: "final-1", input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
    // Edge case: target is 0
    { id: "final-2", input: [[-3, 4, 3, 90], 0], expected: [0, 2] },
    // Edge case: large numbers
    {
      id: "final-3",
      input: [[1000000000, 999999999, 1], 1000000001],
      expected: [0, 2],
    },
    // Edge case: duplicates
    { id: "final-4", input: [[3, 3], 6], expected: [0, 1] },
    // Edge case: minimum array size
    { id: "final-5", input: [[1, 2], 3], expected: [0, 1] },
  ],
};
