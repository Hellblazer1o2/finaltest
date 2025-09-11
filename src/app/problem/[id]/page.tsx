'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import MonacoEditor from '@monaco-editor/react'
import { TabRestriction } from '@/components/TabRestriction'
import { RoundTimer } from '@/components/RoundTimer'
import { runCodeSafe, ClientExecutionResult, clientCodeExecutorSafe } from '@/lib/clientCodeExecutorSafe'

interface Problem {
  id: string
  title: string
  description: string
  skeletonCode: string
  type: string
  timeLimit: number
  memoryLimit: number
  points: number
}


export default function ProblemPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [code, setCode] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    status?: string
    executionTime?: number
    memoryUsage?: number
    score?: number
    testResults?: Array<{
      testCase: number
      passed: boolean
      expectedOutput: string
      actualOutput: string
      error?: string
    }>
    error?: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState<'problem' | 'code' | 'test' | 'history'>('code')
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [showFailurePopup, setShowFailurePopup] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<{
    status: string
    score: number
    submittedAt?: string
    testResults?: Array<{
      testCase: number
      passed: boolean
      expectedOutput: string
      actualOutput: string
      error?: string
    }>
  } | null>(null)
  const [roundEndTime, setRoundEndTime] = useState<Date | null>(null)
  const [userStatus, setUserStatus] = useState<{
    hasPassed: boolean
    passedSubmission: {
      id: string
      code: string
      status: string
      score: number
      submittedAt: string
    } | null
    totalSubmissions: number
    isDisqualified: boolean
    warnings: number
  } | null>(null)
  const [nextProblem, setNextProblem] = useState<{
    id: string
    title: string
    points: number
  } | null>(null)
  const [isDisqualified, setIsDisqualified] = useState(false)
  const [isClientSideExecution, setIsClientSideExecution] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [submissionHistory, setSubmissionHistory] = useState<Array<{
    id: string
    status: string
    score: number
    submittedAt: string
    language: string
  }>>([])

  // Helper function to get relative time
  const getRelativeTime = (dateString: string): string => {
    const now = new Date()
    const submissionDate = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - submissionDate.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else {
      return submissionDate.toLocaleDateString()
    }
  }

  // Check if current language supports client-side execution
  const isClientSideSupported = (language: string): boolean => {
    const normalizedLang = language.toLowerCase()
    return ['python', 'py', 'cpp', 'c++', 'cplusplus', 'nodejs', 'node.js', 'javascript', 'js', 'java'].includes(normalizedLang)
  }

  // Convert language to client-side executor format
  const getClientSideLanguage = (language: string): 'python' | 'cpp' | 'nodejs' | 'java' => {
    const normalizedLang = language.toLowerCase()
    if (['python', 'py'].includes(normalizedLang)) return 'python'
    if (['cpp', 'c++', 'cplusplus'].includes(normalizedLang)) return 'cpp'
    if (['nodejs', 'node.js', 'javascript', 'js'].includes(normalizedLang)) return 'nodejs'
    if (['java'].includes(normalizedLang)) return 'java'
    return 'python' // default fallback
  }

  const fetchProblem = useCallback(async () => {
    try {
      const response = await fetch(`/api/problems/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProblem(data.problem)
        setCode(data.problem.skeletonCode)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to fetch problem:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  const fetchActiveRound = useCallback(async () => {
    try {
      const response = await fetch('/api/rounds/active')
      if (response.ok) {
        const data = await response.json()
        if (data.round && data.round.endTime) {
          setRoundEndTime(new Date(data.round.endTime))
        }
      }
    } catch (error) {
      console.error('Failed to fetch active round:', error)
    }
  }, [])

  const fetchUserStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/problems/${params.id}/user-status`)
      if (response.ok) {
        const data = await response.json()
        setUserStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch user status:', error)
    }
  }, [params.id])

  const fetchNextProblem = useCallback(async () => {
    try {
      const response = await fetch('/api/problems/next')
      if (response.ok) {
        const data = await response.json()
        setNextProblem(data.nextProblem)
      } else if (response.status === 403) {
        setIsDisqualified(true)
      }
    } catch (error) {
      console.error('Failed to fetch next problem:', error)
    }
  }, [])

  const fetchSubmissionHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/problems/${params.id}/submissions`)
      if (response.ok) {
        const data = await response.json()
        setSubmissionHistory(data.submissions || [])
      }
    } catch (error) {
      console.error('Failed to fetch submission history:', error)
    }
  }, [params.id])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchProblem()
    fetchActiveRound()
    fetchUserStatus()
    fetchNextProblem()
    fetchSubmissionHistory()
  }, [params.id, user, router, fetchProblem, fetchActiveRound, fetchUserStatus, fetchNextProblem])

  const handleWarningAdded = () => {
    // Refresh user status to check if disqualified
    fetchUserStatus()
  }

  // Check for disqualification when user status updates
  useEffect(() => {
    if (userStatus?.isDisqualified) {
      setIsDisqualified(true)
    }
  }, [userStatus])

  // Cleanup client-side executor when component unmounts
  useEffect(() => {
    return () => {
      clientCodeExecutorSafe.cleanup()
    }
  }, [])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async () => {
    if (!problem || !code.trim()) return

    setSubmitting(true)
    setResult(null)

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem.id,
          code,
          language: selectedLanguage,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
      setSubmissionResult({
        ...data,
        submittedAt: new Date().toISOString()
      })
      
      // Show appropriate animated popup based on result
      if (data.status === 'ACCEPTED') {
        setShowSuccessPopup(true)
        setTimeout(() => setShowSuccessPopup(false), 4000) // Hide after 4 seconds
      } else {
        setShowFailurePopup(true)
        setTimeout(() => setShowFailurePopup(false), 4000) // Hide after 4 seconds
      }
    } catch (error) {
      console.error('Submission failed:', error)
      setResult({ 
        error: error instanceof Error ? error.message : 'Submission failed',
        status: 'ERROR'
      })
    } finally {
      setSubmitting(false)
      // Refresh user status and submission history after submission
      fetchUserStatus()
      fetchSubmissionHistory()
    }
  }

  const runTest = async () => {
    if (!problem || !code.trim()) return

    setSubmitting(true)
    setResult(null)

    try {
      // Check if we should use client-side execution
      if (isClientSideSupported(selectedLanguage)) {
        setIsClientSideExecution(true)
        
        // Use client-side execution
        const clientLanguage = getClientSideLanguage(selectedLanguage)
        let clientResult: ClientExecutionResult
        
        try {
          clientResult = await runCodeSafe(clientLanguage, code)
        } catch (error) {
          console.error('Client-side execution failed:', error)
          clientResult = {
            status: 'ERROR',
            output: '',
            error: `Client-side execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            executionTime: 0
          }
        }
        
        // Convert client result to match expected format
        const convertedResult = {
          status: clientResult.status === 'SUCCESS' ? 'TEST_COMPLETED' : 'ERROR',
          executionTime: clientResult.executionTime,
          memoryUsage: 0, // Client-side doesn't track memory
          output: clientResult.output,
          error: clientResult.error,
          testResults: clientResult.status === 'SUCCESS' ? [{
            testCase: 1,
            passed: true,
            expectedOutput: 'Code executed successfully',
            actualOutput: clientResult.output || '(no output)',
            error: clientResult.error || undefined
          }] : [{
            testCase: 1,
            passed: false,
            expectedOutput: 'Code should execute without errors',
            actualOutput: clientResult.output || '(no output)',
            error: clientResult.error
          }]
        }
        
        setResult(convertedResult)
      } else {
        setIsClientSideExecution(false)
        
        // Use API execution for unsupported languages
        const response = await fetch('/api/submissions/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problemId: problem.id,
            code,
            language: selectedLanguage,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()
        setResult(data)
      }
      
      // Auto-forward to test results tab
      setActiveTab('test')
    } catch (error) {
      console.error('Test failed:', error)
      setResult({ error: 'Test failed' })
      setActiveTab('test')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (isDisqualified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            You Have Been Disqualified
          </h1>
          <p className="text-gray-600 mb-6">
            You have received 3 warnings and have been disqualified from the competition. 
            Please contact an administrator to request reinstatement.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Problem not found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TabRestriction onWarningAdded={handleWarningAdded} />
      
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-indigo-600 hover:text-indigo-500 mr-4"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {problem.title}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {roundEndTime && (
                <RoundTimer 
                  endTime={roundEndTime} 
                  onTimeUp={() => {
                    alert('Time is up! The round has ended.')
                    router.push('/dashboard')
                  }}
                />
              )}
              {userStatus && userStatus.warnings > 0 && (
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  userStatus.warnings >= 3 
                    ? 'bg-red-100 text-red-800' 
                    : userStatus.warnings >= 2 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  ⚠️ {userStatus.warnings}/3 Warnings
                </div>
              )}
              <div className="flex items-center space-x-4">
                <div className="text-xs text-gray-500">
                  🕐 {currentTime.toLocaleTimeString()}
                </div>
                <span className="text-sm text-gray-700">
                  {user?.username} | {problem.points} points
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Problem Description */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Problem</h2>
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {problem.type.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-gray-700">
                    {problem.description}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Constraints</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Time Limit: {problem.timeLimit}ms</div>
                    <div>Memory Limit: {problem.memoryLimit}MB</div>
                    <div>Choose your preferred programming language</div>
                  </div>
                </div>

                {/* Client-Side Execution Info */}
                {isClientSideSupported(selectedLanguage) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <span className="text-green-400 text-lg">🚀</span>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-green-800">Client-Side Execution</h4>
                          <p className="text-sm text-green-700 mt-1">
                            Your {selectedLanguage} code runs directly in your browser using WebAssembly. 
                            No server requests needed - faster and more private!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Code Editor and Results */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-md">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8 px-6">
                    <button
                      onClick={() => setActiveTab('code')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'code'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Code Editor
                    </button>
                    <button
                      onClick={() => setActiveTab('test')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'test'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Test Results
                    </button>
                    <button
                      onClick={() => setActiveTab('history')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'history'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Submission History
                    </button>
                  </nav>
                </div>

                {/* Code Editor */}
                {activeTab === 'code' && (
                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700">Programming Language:</label>
                        <select
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="cpp">C++</option>
                        </select>
                        {isClientSideSupported(selectedLanguage) && (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              🚀 Client-Side
                            </span>
                            <span className="text-xs text-gray-500">
                              Runs in your browser
                            </span>
                          </div>
                        )}
                        {!isClientSideSupported(selectedLanguage) && (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              🌐 Server-Side
                            </span>
                            <span className="text-xs text-gray-500">
                              Runs on server
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="h-[600px] mb-4 border border-gray-300 rounded-md overflow-hidden">
                      <MonacoEditor
                        height="100%"
                        language={selectedLanguage}
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: 'on',
                          roundedSelection: false,
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                        }}
                      />
                    </div>

                    <div className="flex justify-between">
                      <div className="flex space-x-3">
                        <button
                          onClick={runTest}
                          disabled={submitting || !code.trim()}
                          className={`px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 ${
                            isClientSideSupported(selectedLanguage)
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-600 text-white hover:bg-gray-700'
                          }`}
                        >
                          {submitting 
                            ? (isClientSideSupported(selectedLanguage) ? 'Running in Browser...' : 'Running on Server...') 
                            : (isClientSideSupported(selectedLanguage) ? '🚀 Run Test (Client-Side)' : 'Run Test (Server-Side)')
                          }
                        </button>
                        <div className="flex items-center space-x-2">
                          {userStatus?.hasPassed && (
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600 text-sm">✅ Problem Solved</span>
                              <span className="text-sm text-gray-500">|</span>
                            </div>
                          )}
                          <button
                            onClick={handleSubmit}
                            disabled={submitting || !code.trim()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {submitting ? 'Submitting...' : 'Submit Solution'}
                          </button>
                        </div>
                      </div>
                      {userStatus && (
                        <div className="text-sm text-gray-500">
                          Submissions: {userStatus.totalSubmissions}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Test Results */}
                {activeTab === 'test' && (
                  <div className="p-6">
                    {result ? (
                      <div className="space-y-4">
                        {result.error ? (
                          <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="text-red-800 font-medium">Error</div>
                            <div className="text-red-700 text-sm mt-1">{result.error}</div>
                          </div>
                        ) : (
                          <>
                            <div className={`border rounded-md p-4 ${
                              result.status === 'ACCEPTED' || result.status === 'TEST_COMPLETED'
                                ? 'bg-green-50 border-green-200' 
                                : result.status === 'WRONG_ANSWER'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-yellow-50 border-yellow-200'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className={`font-medium ${
                                  result.status === 'ACCEPTED' || result.status === 'TEST_COMPLETED'
                                    ? 'text-green-800' 
                                    : result.status === 'WRONG_ANSWER'
                                    ? 'text-red-800'
                                    : 'text-yellow-800'
                                }`}>Submission Result</div>
                                <div className="flex items-center space-x-2">
                                  {submissionResult?.submittedAt && (
                                    <span className="text-xs text-gray-500">
                                      📅 {new Date(submissionResult.submittedAt).toLocaleString()}
                                    </span>
                                  )}
                                  {isClientSideExecution && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      🚀 Client-Side Execution
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className={`text-sm mt-1 ${
                                result.status === 'ACCEPTED' || result.status === 'TEST_COMPLETED'
                                  ? 'text-green-700' 
                                  : 'text-red-700'
                              }`}>
                                Status: <span className="font-mono bg-white px-2 py-1 rounded border">{result.status}</span>
                              </div>
                              {result.executionTime && (
                                <div className={`text-sm ${
                                  result.status === 'ACCEPTED' || result.status === 'TEST_COMPLETED'
                                    ? 'text-green-700' 
                                    : 'text-red-700'
                                }`}>
                                  Execution Time: <span className="font-mono bg-white px-2 py-1 rounded border">{result.executionTime}ms</span>
                                </div>
                              )}
                              {result.memoryUsage && (
                                <div className={`text-sm ${
                                  result.status === 'ACCEPTED' || result.status === 'TEST_COMPLETED'
                                    ? 'text-green-700' 
                                    : 'text-red-700'
                                }`}>
                                  Memory Usage: <span className="font-mono bg-white px-2 py-1 rounded border">{result.memoryUsage}KB</span>
                                </div>
                              )}
                              {result.score && (
                                <div className={`text-sm ${
                                  result.status === 'ACCEPTED' || result.status === 'TEST_COMPLETED'
                                    ? 'text-green-700' 
                                    : 'text-red-700'
                                }`}>
                                  Score: <span className="font-mono bg-white px-2 py-1 rounded border">{result.score} points</span>
                                </div>
                              )}
                            </div>

                            {result.testResults && (
                              <div className="space-y-4">
                                {/* Test Summary */}
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                  <h4 className="font-medium text-blue-900 mb-2">Test Summary</h4>
                                  <div className="text-sm text-blue-800">
                                    {result.testResults.filter(t => t.passed).length} of {result.testResults.length} test cases passed
                                  </div>
                                </div>

                                {/* Individual Test Results */}
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-3">Test Case Details</h4>
                                <div className="space-y-3">
                                  {result.testResults.map((test, index: number) => (
                                    <div
                                      key={index}
                                      className={`border rounded-md p-4 ${
                                        test.passed
                                          ? 'border-green-200 bg-green-50'
                                          : 'border-red-200 bg-red-50'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-900">
                                          Test Case {index + 1}
                                        </span>
                                        <span
                                          className={`text-xs font-medium px-3 py-1 rounded-full ${
                                            test.passed
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-red-100 text-red-800'
                                          }`}
                                        >
                                          {test.passed ? '✅ PASSED' : '❌ FAILED'}
                                        </span>
                                      </div>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex items-start space-x-2">
                                          <span className="font-medium text-gray-700 min-w-[80px]">Expected:</span>
                                          <span className="font-mono bg-white border px-3 py-2 rounded flex-1">{test.expectedOutput}</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                          <span className="font-medium text-gray-700 min-w-[80px]">Your Output:</span>
                                          <span className="font-mono bg-white border px-3 py-2 rounded flex-1">{test.actualOutput || '(no output)'}</span>
                                        </div>
                                        {test.error && (
                                          <div className="flex items-start space-x-2">
                                            <span className="font-medium text-red-700 min-w-[80px]">Error:</span>
                                            <span className="font-mono bg-red-100 border border-red-300 px-3 py-2 rounded flex-1 text-red-800">{test.error}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-gray-400 text-4xl mb-4">🧪</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No test results yet
                        </h3>
                        <p className="text-gray-500">
                          Run your code to see test results here.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Submission History */}
                {activeTab === 'history' && (
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Submission History</h3>
                      <p className="text-sm text-gray-600">
                        View all your previous submissions for this problem with timestamps.
                      </p>
                    </div>
                    
                    {submissionHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-gray-400 text-4xl mb-4">📝</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No submissions yet
                        </h3>
                        <p className="text-gray-500">
                          Submit your first solution to see it here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {submissionHistory.map((submission, index) => (
                          <div
                            key={submission.id}
                            className={`border rounded-lg p-4 ${
                              submission.status === 'ACCEPTED'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  submission.status === 'ACCEPTED'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {submission.status}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {submission.language}
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {submission.score} points
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {new Date(submission.submittedAt).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {getRelativeTime(submission.submittedAt)}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              Submission #{submissionHistory.length - index}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center animate-scaleIn">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h3 className="text-2xl font-bold text-green-600 mb-2 animate-pulse">All Tests Passed!</h3>
            <p className="text-gray-600 mb-2">Great job! Your solution is working correctly.</p>
            {submissionResult?.submittedAt && (
              <p className="text-sm text-gray-500 mb-4">
                📅 Submitted at: {new Date(submissionResult.submittedAt).toLocaleString()}
              </p>
            )}
            <div className="text-4xl font-bold text-indigo-600 animate-pulse mb-6">
              +{submissionResult?.score || problem?.points || 100} Points
            </div>
            {nextProblem && (
              <button
                onClick={() => router.push(`/problem/${nextProblem.id}`)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors animate-pulse"
              >
                🚀 Solve Next Problem
              </button>
            )}
            {!nextProblem && (
              <p className="text-gray-500 text-sm">
                🏆 Congratulations! You&apos;ve solved all available problems!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Failure Popup */}
      {showFailurePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center animate-scaleIn">
            <div className="text-6xl mb-4 animate-shake">❌</div>
            <h3 className="text-2xl font-bold text-red-600 mb-2">Submission Failed</h3>
            <p className="text-gray-600 mb-2">
              {submissionResult?.status === 'WRONG_ANSWER' 
                ? 'Your solution didn\'t pass all test cases.' 
                : 'There was an error with your submission.'}
            </p>
            {submissionResult?.submittedAt && (
              <p className="text-sm text-gray-500 mb-4">
                📅 Submitted at: {new Date(submissionResult.submittedAt).toLocaleString()}
              </p>
            )}
            {submissionResult?.testResults && (
              <div className="text-sm text-gray-500 mb-4">
                <div className="font-semibold">Test Results:</div>
                <div>
                  {submissionResult.testResults.filter(t => t.passed).length} of {submissionResult.testResults.length} test cases passed
                </div>
              </div>
            )}
            <div className="text-2xl font-bold text-red-600 mb-6">
              0 Points
            </div>
            <button
              onClick={() => setShowFailurePopup(false)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
