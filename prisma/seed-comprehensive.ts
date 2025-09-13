import { PrismaClient, SubmissionStatus, UserRole, ProblemType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive database seeding...')

  // Clear existing data
  await prisma.submission.deleteMany()
  await prisma.testCase.deleteMany()
  await prisma.problem.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
  await prisma.round.deleteMany()

  console.log('🗑️ Cleared existing data')

  // Create users
  const users = [
    {
      email: 'admin@idearpit.com',
      username: 'hellblazer',
      password: 'Egon_the_dragon_slayer',
      role: UserRole.ADMIN
    },
    {
      email: 'alice@example.com',
      username: 'alice_coder',
      password: 'password123',
      role: UserRole.USER
    },
    {
      email: 'bob@example.com',
      username: 'bob_dev',
      password: 'password123',
      role: UserRole.USER
    },
    {
      email: 'charlie@example.com',
      username: 'charlie_pro',
      password: 'password123',
      role: UserRole.USER
    },
    {
      email: 'diana@example.com',
      username: 'diana_hacker',
      password: 'password123',
      role: UserRole.USER
    }
  ]

  const createdUsers = []
  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10)
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        role: userData.role
      }
    })
    createdUsers.push(user)
    console.log(`👤 Created user: ${user.username} (${user.role})`)
  }

  // Create problems
  const problems = [
    {
      title: 'Fibonacci Sequence',
      description: `Write a function that returns the nth Fibonacci number.

The Fibonacci sequence is defined as:
- F(0) = 0
- F(1) = 1
- F(n) = F(n-1) + F(n-2) for n > 1

**Input:** An integer n (0 ≤ n ≤ 30)
**Output:** The nth Fibonacci number

**Example:**
Input: 5
Output: 5

**Explanation:** F(5) = F(4) + F(3) = 3 + 2 = 5`,
      skeletonCode: `function fibonacci(n) {
    // Your code here
    return 0;
}`,
      type: ProblemType.GENERAL,
      complexity: 'Easy',
      timeLimit: 2000,
      memoryLimit: 128,
      points: 100
    },
    {
      title: 'Two Sum',
      description: `Given an array of integers and a target sum, find two numbers that add up to the target.

**Input:** 
- An array of integers
- A target sum

**Output:** 
- The indices of the two numbers that add up to the target
- Return [0, 1] if no solution exists

**Example:**
Input: [2, 7, 11, 15], target = 9
Output: [0, 1]

**Explanation:** nums[0] + nums[1] = 2 + 7 = 9`,
      skeletonCode: `function twoSum(nums, target) {
    // Your code here
    return [0, 1];
}`,
      type: ProblemType.GENERAL,
      complexity: 'Easy',
      timeLimit: 2000,
      memoryLimit: 128,
      points: 150
    },
    {
      title: 'Binary Tree Maximum Path Sum',
      description: `Given a binary tree, find the maximum path sum.

A path is defined as any sequence of nodes from some starting node to any node in the tree along the parent-child connections. The path must contain at least one node and does not need to go through the root.

**Input:** Root of a binary tree
**Output:** Maximum path sum

**Example:**
Input: [1,2,3]
Output: 6

**Explanation:** The optimal path is 2 -> 1 -> 3 with a sum of 6.`,
      skeletonCode: `function maxPathSum(root) {
    // Your code here
    return 0;
}`,
      type: ProblemType.GENERAL,
      complexity: 'Hard',
      timeLimit: 3000,
      memoryLimit: 256,
      points: 300
    },
    {
      title: 'Longest Common Subsequence',
      description: `Given two strings, find the length of their longest common subsequence.

A subsequence is a sequence that appears in the same relative order, but not necessarily contiguous.

**Input:** Two strings
**Output:** Length of the longest common subsequence

**Example:**
Input: "abcde", "ace"
Output: 3

**Explanation:** The longest common subsequence is "ace" with length 3.`,
      skeletonCode: `function longestCommonSubsequence(text1, text2) {
    // Your code here
    return 0;
}`,
      type: ProblemType.GENERAL,
      complexity: 'Medium',
      timeLimit: 2500,
      memoryLimit: 192,
      points: 200
    },
    {
      title: 'Valid Parentheses',
      description: `Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.

**Input:** A string containing only parentheses
**Output:** true if valid, false otherwise

**Example:**
Input: "()[]{}"
Output: true

**Explanation:** All brackets are properly closed.`,
      skeletonCode: `function isValid(s) {
    // Your code here
    return false;
}`,
      type: ProblemType.GENERAL,
      complexity: 'Easy',
      timeLimit: 2000,
      memoryLimit: 128,
      points: 100
    }
  ]

  const createdProblems = []
  for (const problemData of problems) {
    const problem = await prisma.problem.create({
      data: problemData
    })
    createdProblems.push(problem)
    console.log(`📝 Created problem: ${problem.title} (${problem.complexity})`)
  }

  // Create test cases for each problem
  const testCases = [
    // Fibonacci test cases
    { problemId: createdProblems[0].id, input: '0', expectedOutput: '0' },
    { problemId: createdProblems[0].id, input: '1', expectedOutput: '1' },
    { problemId: createdProblems[0].id, input: '5', expectedOutput: '5' },
    { problemId: createdProblems[0].id, input: '10', expectedOutput: '55' },
    
    // Two Sum test cases
    { problemId: createdProblems[1].id, input: '[2,7,11,15]\n9', expectedOutput: '[0,1]' },
    { problemId: createdProblems[1].id, input: '[3,2,4]\n6', expectedOutput: '[1,2]' },
    { problemId: createdProblems[1].id, input: '[3,3]\n6', expectedOutput: '[0,1]' },
    
    // Binary Tree test cases
    { problemId: createdProblems[2].id, input: '[1,2,3]', expectedOutput: '6' },
    { problemId: createdProblems[2].id, input: '[-10,9,20,null,null,15,7]', expectedOutput: '42' },
    
    // LCS test cases
    { problemId: createdProblems[3].id, input: 'abcde\nace', expectedOutput: '3' },
    { problemId: createdProblems[3].id, input: 'abc\nabc', expectedOutput: '3' },
    { problemId: createdProblems[3].id, input: 'abc\ndef', expectedOutput: '0' },
    
    // Valid Parentheses test cases
    { problemId: createdProblems[4].id, input: '()', expectedOutput: 'true' },
    { problemId: createdProblems[4].id, input: '()[]{}', expectedOutput: 'true' },
    { problemId: createdProblems[4].id, input: '(]', expectedOutput: 'false' },
    { problemId: createdProblems[4].id, input: '([)]', expectedOutput: 'false' }
  ]

  for (const testCaseData of testCases) {
    await prisma.testCase.create({
      data: testCaseData
    })
  }
  console.log(`🧪 Created ${testCases.length} test cases`)

  // Create sample submissions
  const submissions = [
    // Alice's submissions
    {
      userId: createdUsers[1].id, // alice
      problemId: createdProblems[0].id, // Fibonacci
      code: 'function fibonacci(n) {\n    if (n <= 1) return n;\n    return fibonacci(n-1) + fibonacci(n-2);\n}',
      language: 'javascript',
      status: SubmissionStatus.ACCEPTED,
      score: 100,
      executionTime: 150,
      memoryUsage: 64,
      isFirstCorrect: true
    },
    {
      userId: createdUsers[1].id, // alice
      problemId: createdProblems[1].id, // Two Sum
      code: 'function twoSum(nums, target) {\n    for (let i = 0; i < nums.length; i++) {\n        for (let j = i + 1; j < nums.length; j++) {\n            if (nums[i] + nums[j] === target) {\n                return [i, j];\n            }\n        }\n    }\n    return [0, 1];\n}',
      language: 'javascript',
      status: SubmissionStatus.ACCEPTED,
      score: 150,
      executionTime: 200,
      memoryUsage: 80,
      isFirstCorrect: true
    },
    {
      userId: createdUsers[1].id, // alice
      problemId: createdProblems[4].id, // Valid Parentheses
      code: 'function isValid(s) {\n    const stack = [];\n    const map = {\'(\': \')\', \'[\': \']\', \'{\': \'}\'};\n    \n    for (let char of s) {\n        if (char in map) {\n            stack.push(char);\n        } else {\n            if (stack.length === 0 || map[stack.pop()] !== char) {\n                return false;\n            }\n        }\n    }\n    \n    return stack.length === 0;\n}',
      language: 'javascript',
      status: SubmissionStatus.ACCEPTED,
      score: 100,
      executionTime: 120,
      memoryUsage: 60,
      isFirstCorrect: true
    },
    
    // Bob's submissions
    {
      userId: createdUsers[2].id, // bob
      problemId: createdProblems[0].id, // Fibonacci
      code: 'function fibonacci(n) {\n    if (n <= 1) return n;\n    let a = 0, b = 1;\n    for (let i = 2; i <= n; i++) {\n        let temp = a + b;\n        a = b;\n        b = temp;\n    }\n    return b;\n}',
      language: 'javascript',
      status: SubmissionStatus.ACCEPTED,
      score: 100,
      executionTime: 100,
      memoryUsage: 50,
      isFirstCorrect: false
    },
    {
      userId: createdUsers[2].id, // bob
      problemId: createdProblems[1].id, // Two Sum
      code: 'function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [0, 1];\n}',
      language: 'javascript',
      status: SubmissionStatus.ACCEPTED,
      score: 150,
      executionTime: 80,
      memoryUsage: 70,
      isFirstCorrect: false
    },
    
    // Charlie's submissions
    {
      userId: createdUsers[3].id, // charlie
      problemId: createdProblems[0].id, // Fibonacci
      code: 'function fibonacci(n) {\n    return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);\n}',
      language: 'javascript',
      status: SubmissionStatus.ACCEPTED,
      score: 100,
      executionTime: 180,
      memoryUsage: 70,
      isFirstCorrect: false
    },
    {
      userId: createdUsers[3].id, // charlie
      problemId: createdProblems[3].id, // LCS
      code: 'function longestCommonSubsequence(text1, text2) {\n    const m = text1.length, n = text2.length;\n    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));\n    \n    for (let i = 1; i <= m; i++) {\n        for (let j = 1; j <= n; j++) {\n            if (text1[i-1] === text2[j-1]) {\n                dp[i][j] = dp[i-1][j-1] + 1;\n            } else {\n                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);\n            }\n        }\n    }\n    \n    return dp[m][n];\n}',
      language: 'javascript',
      status: SubmissionStatus.ACCEPTED,
      score: 200,
      executionTime: 300,
      memoryUsage: 150,
      isFirstCorrect: true
    },
    
    // Diana's submissions
    {
      userId: createdUsers[4].id, // diana
      problemId: createdProblems[0].id, // Fibonacci
      code: 'function fibonacci(n) {\n    if (n <= 1) return n;\n    return fibonacci(n-1) + fibonacci(n-2);\n}',
      language: 'javascript',
      status: SubmissionStatus.WRONG_ANSWER,
      score: 0,
      executionTime: 200,
      memoryUsage: 80,
      isFirstCorrect: false
    },
    {
      userId: createdUsers[4].id, // diana
      problemId: createdProblems[1].id, // Two Sum
      code: 'function twoSum(nums, target) {\n    return [0, 1]; // Wrong implementation\n}',
      language: 'javascript',
      status: SubmissionStatus.WRONG_ANSWER,
      score: 0,
      executionTime: 50,
      memoryUsage: 40,
      isFirstCorrect: false
    }
  ]

  for (const submissionData of submissions) {
    await prisma.submission.create({
      data: {
        ...submissionData,
        submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time in last week
      }
    })
  }
  console.log(`📊 Created ${submissions.length} submissions`)

  // Create a sample round
  const round = await prisma.round.create({
    data: {
      title: 'Weekly Coding Challenge',
      description: 'Test your skills with these algorithmic problems!',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      duration: 180, // 3 hours
      problems: {
        create: [
          { problemId: createdProblems[0].id },
          { problemId: createdProblems[1].id },
          { problemId: createdProblems[4].id }
        ]
      }
    }
  })
  console.log(`🏆 Created round: ${round.title}`)

  console.log('✅ Database seeding completed successfully!')
  console.log(`👥 Users: ${createdUsers.length}`)
  console.log(`📝 Problems: ${createdProblems.length}`)
  console.log(`🧪 Test Cases: ${testCases.length}`)
  console.log(`📊 Submissions: ${submissions.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
