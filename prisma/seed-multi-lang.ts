import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting multi-language database seeding...')

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
      role: 'ADMIN' as const
    },
    {
      email: 'alice@example.com',
      username: 'alice_coder',
      password: 'password123',
      role: 'USER' as const
    },
    {
      email: 'bob@example.com',
      username: 'bob_dev',
      password: 'password123',
      role: 'USER' as const
    },
    {
      email: 'charlie@example.com',
      username: 'charlie_pro',
      password: 'password123',
      role: 'USER' as const
    },
    {
      email: 'diana@example.com',
      username: 'diana_hacker',
      password: 'password123',
      role: 'USER' as const
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

  // Create problems with multi-language support
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
      skeletonCodePython: `def fibonacci(n):
    # Your code here
    return 0`,
      skeletonCodeCpp: `#include <iostream>
using namespace std;

int fibonacci(int n) {
    // Your code here
    return 0;
}

int main() {
    int n;
    cin >> n;
    cout << fibonacci(n) << endl;
    return 0;
}`,
      skeletonCodeJava: `import java.util.Scanner;

public class Main {
    public static int fibonacci(int n) {
        // Your code here
        return 0;
    }
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        System.out.println(fibonacci(n));
    }
}`,
      skeletonCodeJavascript: `function fibonacci(n) {
    // Your code here
    return 0;
}`,
      type: 'GENERAL' as const,
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
      skeletonCodePython: `def two_sum(nums, target):
    # Your code here
    return [0, 1]`,
      skeletonCodeCpp: `#include <iostream>
#include <vector>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Your code here
    return {0, 1};
}

int main() {
    vector<int> nums;
    int target, n, val;
    cin >> n;
    for(int i = 0; i < n; i++) {
        cin >> val;
        nums.push_back(val);
    }
    cin >> target;
    vector<int> result = twoSum(nums, target);
    cout << "[" << result[0] << "," << result[1] << "]" << endl;
    return 0;
}`,
      skeletonCodeJava: `import java.util.Scanner;
import java.util.Arrays;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        // Your code here
        return new int[]{0, 1};
    }
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        int[] nums = new int[n];
        for(int i = 0; i < n; i++) {
            nums[i] = scanner.nextInt();
        }
        int target = scanner.nextInt();
        int[] result = twoSum(nums, target);
        System.out.println(Arrays.toString(result));
    }
}`,
      skeletonCodeJavascript: `function twoSum(nums, target) {
    // Your code here
    return [0, 1];
}`,
      type: 'GENERAL' as const,
      complexity: 'Easy',
      timeLimit: 2000,
      memoryLimit: 128,
      points: 150
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
      skeletonCodePython: `def is_valid(s):
    # Your code here
    return False`,
      skeletonCodeCpp: `#include <iostream>
#include <stack>
#include <string>
using namespace std;

bool isValid(string s) {
    // Your code here
    return false;
}

int main() {
    string s;
    cin >> s;
    cout << (isValid(s) ? "true" : "false") << endl;
    return 0;
}`,
      skeletonCodeJava: `import java.util.Scanner;
import java.util.Stack;

public class Main {
    public static boolean isValid(String s) {
        // Your code here
        return false;
    }
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String s = scanner.nextLine();
        System.out.println(isValid(s));
    }
}`,
      skeletonCodeJavascript: `function isValid(s) {
    // Your code here
    return false;
}`,
      type: 'GENERAL' as const,
      complexity: 'Easy',
      timeLimit: 2000,
      memoryLimit: 128,
      points: 100
    },
    {
      title: 'Binary Search',
      description: `Given a sorted array and a target value, return the index of the target if it exists, otherwise return -1.

**Input:** 
- A sorted array of integers
- A target value

**Output:** 
- The index of the target value, or -1 if not found

**Example:**
Input: [1, 3, 5, 7, 9], target = 5
Output: 2

**Explanation:** The target 5 is found at index 2.`,
      skeletonCode: `function binarySearch(nums, target) {
    // Your code here
    return -1;
}`,
      skeletonCodePython: `def binary_search(nums, target):
    # Your code here
    return -1`,
      skeletonCodeCpp: `#include <iostream>
#include <vector>
using namespace std;

int binarySearch(vector<int>& nums, int target) {
    // Your code here
    return -1;
}

int main() {
    vector<int> nums;
    int target, n, val;
    cin >> n;
    for(int i = 0; i < n; i++) {
        cin >> val;
        nums.push_back(val);
    }
    cin >> target;
    cout << binarySearch(nums, target) << endl;
    return 0;
}`,
      skeletonCodeJava: `import java.util.Scanner;

public class Main {
    public static int binarySearch(int[] nums, int target) {
        // Your code here
        return -1;
    }
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        int[] nums = new int[n];
        for(int i = 0; i < n; i++) {
            nums[i] = scanner.nextInt();
        }
        int target = scanner.nextInt();
        System.out.println(binarySearch(nums, target));
    }
}`,
      skeletonCodeJavascript: `function binarySearch(nums, target) {
    // Your code here
    return -1;
}`,
      type: 'GENERAL' as const,
      complexity: 'Easy',
      timeLimit: 2000,
      memoryLimit: 128,
      points: 150
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
      skeletonCodePython: `def longest_common_subsequence(text1, text2):
    # Your code here
    return 0`,
      skeletonCodeCpp: `#include <iostream>
#include <string>
#include <vector>
using namespace std;

int longestCommonSubsequence(string text1, string text2) {
    // Your code here
    return 0;
}

int main() {
    string text1, text2;
    cin >> text1 >> text2;
    cout << longestCommonSubsequence(text1, text2) << endl;
    return 0;
}`,
      skeletonCodeJava: `import java.util.Scanner;

public class Main {
    public static int longestCommonSubsequence(String text1, String text2) {
        // Your code here
        return 0;
    }
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String text1 = scanner.nextLine();
        String text2 = scanner.nextLine();
        System.out.println(longestCommonSubsequence(text1, text2));
    }
}`,
      skeletonCodeJavascript: `function longestCommonSubsequence(text1, text2) {
    // Your code here
    return 0;
}`,
      type: 'GENERAL' as const,
      complexity: 'Medium',
      timeLimit: 2500,
      memoryLimit: 192,
      points: 200
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

  // Create test cases with multi-language expected outputs
  const testCases = [
    // Fibonacci test cases
    { 
      problemId: createdProblems[0].id, 
      input: '0', 
      expectedOutput: '0',
      expectedOutputPython: '0',
      expectedOutputCpp: '0',
      expectedOutputJava: '0',
      expectedOutputJavascript: '0'
    },
    { 
      problemId: createdProblems[0].id, 
      input: '1', 
      expectedOutput: '1',
      expectedOutputPython: '1',
      expectedOutputCpp: '1',
      expectedOutputJava: '1',
      expectedOutputJavascript: '1'
    },
    { 
      problemId: createdProblems[0].id, 
      input: '5', 
      expectedOutput: '5',
      expectedOutputPython: '5',
      expectedOutputCpp: '5',
      expectedOutputJava: '5',
      expectedOutputJavascript: '5'
    },
    { 
      problemId: createdProblems[0].id, 
      input: '10', 
      expectedOutput: '55',
      expectedOutputPython: '55',
      expectedOutputCpp: '55',
      expectedOutputJava: '55',
      expectedOutputJavascript: '55'
    },
    
    // Two Sum test cases
    { 
      problemId: createdProblems[1].id, 
      input: '4\n2\n7\n11\n15\n9', 
      expectedOutput: '[0,1]',
      expectedOutputPython: '[0, 1]',
      expectedOutputCpp: '[0,1]',
      expectedOutputJava: '[0, 1]',
      expectedOutputJavascript: '[0,1]'
    },
    { 
      problemId: createdProblems[1].id, 
      input: '3\n3\n2\n4\n6', 
      expectedOutput: '[1,2]',
      expectedOutputPython: '[1, 2]',
      expectedOutputCpp: '[1,2]',
      expectedOutputJava: '[1, 2]',
      expectedOutputJavascript: '[1,2]'
    },
    { 
      problemId: createdProblems[1].id, 
      input: '2\n3\n3\n6', 
      expectedOutput: '[0,1]',
      expectedOutputPython: '[0, 1]',
      expectedOutputCpp: '[0,1]',
      expectedOutputJava: '[0, 1]',
      expectedOutputJavascript: '[0,1]'
    },
    
    // Valid Parentheses test cases
    { 
      problemId: createdProblems[2].id, 
      input: '()', 
      expectedOutput: 'true',
      expectedOutputPython: 'True',
      expectedOutputCpp: 'true',
      expectedOutputJava: 'true',
      expectedOutputJavascript: 'true'
    },
    { 
      problemId: createdProblems[2].id, 
      input: '()[]{}', 
      expectedOutput: 'true',
      expectedOutputPython: 'True',
      expectedOutputCpp: 'true',
      expectedOutputJava: 'true',
      expectedOutputJavascript: 'true'
    },
    { 
      problemId: createdProblems[2].id, 
      input: '(]', 
      expectedOutput: 'false',
      expectedOutputPython: 'False',
      expectedOutputCpp: 'false',
      expectedOutputJava: 'false',
      expectedOutputJavascript: 'false'
    },
    { 
      problemId: createdProblems[2].id, 
      input: '([)]', 
      expectedOutput: 'false',
      expectedOutputPython: 'False',
      expectedOutputCpp: 'false',
      expectedOutputJava: 'false',
      expectedOutputJavascript: 'false'
    },
    
    // Binary Search test cases
    { 
      problemId: createdProblems[3].id, 
      input: '5\n1\n3\n5\n7\n9\n5', 
      expectedOutput: '2',
      expectedOutputPython: '2',
      expectedOutputCpp: '2',
      expectedOutputJava: '2',
      expectedOutputJavascript: '2'
    },
    { 
      problemId: createdProblems[3].id, 
      input: '5\n1\n3\n5\n7\n9\n3', 
      expectedOutput: '1',
      expectedOutputPython: '1',
      expectedOutputCpp: '1',
      expectedOutputJava: '1',
      expectedOutputJavascript: '1'
    },
    { 
      problemId: createdProblems[3].id, 
      input: '5\n1\n3\n5\n7\n9\n6', 
      expectedOutput: '-1',
      expectedOutputPython: '-1',
      expectedOutputCpp: '-1',
      expectedOutputJava: '-1',
      expectedOutputJavascript: '-1'
    },
    
    // LCS test cases
    { 
      problemId: createdProblems[4].id, 
      input: 'abcde\nace', 
      expectedOutput: '3',
      expectedOutputPython: '3',
      expectedOutputCpp: '3',
      expectedOutputJava: '3',
      expectedOutputJavascript: '3'
    },
    { 
      problemId: createdProblems[4].id, 
      input: 'abc\nabc', 
      expectedOutput: '3',
      expectedOutputPython: '3',
      expectedOutputCpp: '3',
      expectedOutputJava: '3',
      expectedOutputJavascript: '3'
    },
    { 
      problemId: createdProblems[4].id, 
      input: 'abc\ndef', 
      expectedOutput: '0',
      expectedOutputPython: '0',
      expectedOutputCpp: '0',
      expectedOutputJava: '0',
      expectedOutputJavascript: '0'
    }
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
      status: 'ACCEPTED',
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
      status: 'ACCEPTED',
      score: 150,
      executionTime: 200,
      memoryUsage: 80,
      isFirstCorrect: true
    },
    {
      userId: createdUsers[1].id, // alice
      problemId: createdProblems[2].id, // Valid Parentheses
      code: 'function isValid(s) {\n    const stack = [];\n    const map = {\'(\': \')\', \'[\': \']\', \'{\': \'}\'};\n    \n    for (let char of s) {\n        if (char in map) {\n            stack.push(char);\n        } else {\n            if (stack.length === 0 || map[stack.pop()] !== char) {\n                return false;\n            }\n        }\n    }\n    \n    return stack.length === 0;\n}',
      language: 'javascript',
      status: 'ACCEPTED',
      score: 100,
      executionTime: 120,
      memoryUsage: 60,
      isFirstCorrect: true
    },
    
    // Bob's submissions
    {
      userId: createdUsers[2].id, // bob
      problemId: createdProblems[0].id, // Fibonacci
      code: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for i in range(2, n + 1):\n        a, b = b, a + b\n    return b',
      language: 'python',
      status: 'ACCEPTED',
      score: 100,
      executionTime: 100,
      memoryUsage: 50,
      isFirstCorrect: false
    },
    {
      userId: createdUsers[2].id, // bob
      problemId: createdProblems[1].id, // Two Sum
      code: 'def two_sum(nums, target):\n    num_map = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in num_map:\n            return [num_map[complement], i]\n        num_map[num] = i\n    return [0, 1]',
      language: 'python',
      status: 'ACCEPTED',
      score: 150,
      executionTime: 80,
      memoryUsage: 70,
      isFirstCorrect: false
    },
    
    // Charlie's submissions
    {
      userId: createdUsers[3].id, // charlie
      problemId: createdProblems[0].id, // Fibonacci
      code: '#include <iostream>\nusing namespace std;\n\nint fibonacci(int n) {\n    if (n <= 1) return n;\n    int a = 0, b = 1;\n    for (int i = 2; i <= n; i++) {\n        int temp = a + b;\n        a = b;\n        b = temp;\n    }\n    return b;\n}\n\nint main() {\n    int n;\n    cin >> n;\n    cout << fibonacci(n) << endl;\n    return 0;\n}',
      language: 'cpp',
      status: 'ACCEPTED',
      score: 100,
      executionTime: 90,
      memoryUsage: 45,
      isFirstCorrect: false
    },
    {
      userId: createdUsers[3].id, // charlie
      problemId: createdProblems[4].id, // LCS
      code: 'public class Main {\n    public static int longestCommonSubsequence(String text1, String text2) {\n        int m = text1.length(), n = text2.length();\n        int[][] dp = new int[m + 1][n + 1];\n        \n        for (int i = 1; i <= m; i++) {\n            for (int j = 1; j <= n; j++) {\n                if (text1.charAt(i-1) == text2.charAt(j-1)) {\n                    dp[i][j] = dp[i-1][j-1] + 1;\n                } else {\n                    dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);\n                }\n            }\n        }\n        \n        return dp[m][n];\n    }\n    \n    public static void main(String[] args) {\n        java.util.Scanner scanner = new java.util.Scanner(System.in);\n        String text1 = scanner.nextLine();\n        String text2 = scanner.nextLine();\n        System.out.println(longestCommonSubsequence(text1, text2));\n    }\n}',
      language: 'java',
      status: 'ACCEPTED',
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
      status: 'WRONG_ANSWER',
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
      status: 'WRONG_ANSWER',
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
      title: 'Multi-Language Coding Challenge',
      description: 'Test your skills with these algorithmic problems in any language!',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      duration: 180, // 3 hours
      problems: {
        create: [
          { problemId: createdProblems[0].id },
          { problemId: createdProblems[1].id },
          { problemId: createdProblems[2].id },
          { problemId: createdProblems[3].id }
        ]
      }
    }
  })
  console.log(`🏆 Created round: ${round.title}`)

  console.log('✅ Multi-language database seeding completed successfully!')
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
