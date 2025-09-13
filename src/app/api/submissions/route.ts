import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateSession } from '@/lib/auth'
import { OnlineCodeExecutorNew } from '@/lib/onlineCodeExecutorNew'

export const runtime = 'nodejs'

// Helper function to get expected output for a specific language
function getExpectedOutput(testCase: any, language: string): string {
  const normalizedLang = language.toLowerCase()
  if (['python', 'py'].includes(normalizedLang) && testCase.expectedOutputPython) {
    return testCase.expectedOutputPython
  }
  if (['cpp', 'c++', 'cplusplus'].includes(normalizedLang) && testCase.expectedOutputCpp) {
    return testCase.expectedOutputCpp
  }
  if (['java'].includes(normalizedLang) && testCase.expectedOutputJava) {
    return testCase.expectedOutputJava
  }
  if (['nodejs', 'node.js', 'javascript', 'js'].includes(normalizedLang) && testCase.expectedOutputJavascript) {
    return testCase.expectedOutputJavascript
  }
  
  // Fallback to default expected output
  return testCase.expectedOutput
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await validateSession(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const { problemId, code, language } = await request.json()

    if (!problemId || !code || !language) {
      return NextResponse.json(
        { error: 'Problem ID, code, and language are required' },
        { status: 400 }
      )
    }

    // Get problem details
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { testCases: true },
    })

    if (!problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      )
    }

    // Check if user is disqualified
    if (user.isDisqualified) {
      return NextResponse.json(
        { error: 'You have been disqualified and cannot submit solutions' },
        { status: 403 }
      )
    }

    // Validate code length
    if (code.length > 10000) {
      return NextResponse.json(
        { error: 'Code is too long. Maximum 10,000 characters allowed.' },
        { status: 400 }
      )
    }

    // Create submission record
    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        problemId,
        code,
        language,
        status: 'PENDING',
      },
    })

    // Execute code against all test cases
    const testResults = []
    let allPassed = true
    let totalExecutionTime = 0
    let maxMemoryUsage = 0

    for (const testCase of problem.testCases) {
      try {
        const onlineExecutor = new OnlineCodeExecutorNew()
        const result = await onlineExecutor.executeCode(
          code,
          language,
          testCase.input,
          problem.timeLimit,
          problem.memoryLimit
        )

        totalExecutionTime = Math.max(totalExecutionTime, result.executionTime)
        maxMemoryUsage = Math.max(maxMemoryUsage, result.memoryUsage)

        // Get the expected output for the current language
        const expectedOutput = getExpectedOutput(testCase, language)

        // Strict output comparison - must match exactly after normalization
        const normalizedOutput = result.output.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        const normalizedExpected = expectedOutput.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        
        // Only accept if execution was successful AND output matches exactly
        const passed = result.status === 'SUCCESS' && 
                      normalizedOutput === normalizedExpected &&
                      !result.error // Ensure no errors occurred

        if (!passed) {
          allPassed = false
          console.log(`Test case ${testResults.length + 1} failed:`, {
            expected: normalizedExpected,
            actual: normalizedOutput,
            status: result.status,
            error: result.error
          })
        }

        testResults.push({
          testCase: testResults.length + 1,
          passed,
          expectedOutput: expectedOutput,
          actualOutput: result.output,
          error: result.error,
        })
      } catch (error) {
        allPassed = false
        const expectedOutput = getExpectedOutput(testCase, language)
        testResults.push({
          testCase: testResults.length + 1,
          passed: false,
          expectedOutput: expectedOutput,
          actualOutput: '',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Only accept if ALL test cases passed with no errors
    const finalStatus = allPassed ? 'ACCEPTED' : 'WRONG_ANSWER'
    const score = allPassed ? problem.points : 0

    // Log the final result for debugging
    console.log(`Submission ${submission.id} result:`, {
      allPassed,
      finalStatus,
      score,
      testResultsCount: testResults.length,
      passedCount: testResults.filter(t => t.passed).length
    })

    // Check if this is the first correct submission for this problem
    const isFirstCorrect = allPassed ? await prisma.submission.findFirst({
      where: {
        problemId,
        status: 'ACCEPTED',
        id: { not: submission.id }
      }
    }) === null : false

    // Only analyze complexity for correct answers
    let timeComplexity = null
    let spaceComplexity = null
    
    if (allPassed) {
      // TODO: Add complexity analysis here for correct answers
      // For now, we'll leave it as null
    }

    const executionResult = {
      status: finalStatus,
      executionTime: totalExecutionTime,
      memoryUsage: maxMemoryUsage,
      timeComplexity,
      spaceComplexity,
      score,
      testResults,
    }

    // Update submission with results
    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        status: executionResult.status as 'PENDING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR',
        executionTime: executionResult.executionTime,
        memoryUsage: executionResult.memoryUsage,
        timeComplexity: executionResult.timeComplexity || null,
        spaceComplexity: executionResult.spaceComplexity || null,
        score: executionResult.score || 0,
        isFirstCorrect,
      },
    })

    return NextResponse.json(executionResult)
  } catch (error) {
    console.error('Submission failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
