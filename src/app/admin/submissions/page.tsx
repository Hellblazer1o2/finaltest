'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Submission {
  id: string
  code: string
  language: string
  status: string
  executionTime: number | null
  memoryUsage: number | null
  timeComplexity: string | null
  spaceComplexity: string | null
  score: number | null
  isFirstCorrect: boolean
  submittedAt: string
  user: {
    id: string
    username: string
    email: string
  }
  problem: {
    id: string
    title: string
    points: number
    complexity: string | null
  }
}

export default function AdminSubmissionsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    problemId: '',
    userId: '',
    status: '',
  })
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

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

  const getDisplayStatus = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'Correct'
      case 'WRONG_ANSWER':
      case 'TIME_LIMIT_EXCEEDED':
      case 'MEMORY_LIMIT_EXCEEDED':
      case 'RUNTIME_ERROR':
      case 'COMPILATION_ERROR':
        return 'Incorrect'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    const displayStatus = getDisplayStatus(status)
    if (displayStatus === 'Correct') {
      return 'bg-green-100 text-green-800'
    } else {
      return 'bg-red-100 text-red-800'
    }
  }

  const fetchSubmissions = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.problemId) params.append('problemId', filters.problemId)
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.status) params.append('status', filters.status)

      const response = await fetch(`/api/admin/submissions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.submissions)
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchSubmissions()
    }
  }, [user, fetchSubmissions])

  // Redirect if not admin
  if (user && user.role !== 'ADMIN') {
    router.push('/dashboard')
    return null
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-indigo-600 hover:text-indigo-500 mr-4">
                ← Back to Admin Panel
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Submissions Management
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.username} (Admin)
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Problem ID</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.problemId}
                  onChange={(e) => setFilters({ ...filters, problemId: e.target.value })}
                  placeholder="Filter by problem ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                  placeholder="Filter by user ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="ACCEPTED">Correct</option>
                  <option value="WRONG_ANSWER">Incorrect</option>
                  <option value="TIME_LIMIT_EXCEEDED">Incorrect</option>
                  <option value="MEMORY_LIMIT_EXCEEDED">Incorrect</option>
                  <option value="RUNTIME_ERROR">Incorrect</option>
                  <option value="COMPILATION_ERROR">Incorrect</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchSubmissions}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                All Submissions ({submissions.length})
              </h3>
            </div>
            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No submissions found
                </h3>
                <p className="text-gray-500">
                  No submissions match your current filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Problem
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Language
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Complexity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        First Correct
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {submission.user.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {submission.user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {submission.problem.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {submission.problem.id} • {submission.problem.points} pts
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {submission.language}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                            {getDisplayStatus(submission.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            submission.problem.complexity === 'Easy' ? 'bg-green-100 text-green-800' :
                            submission.problem.complexity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            submission.problem.complexity === 'Hard' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {submission.problem.complexity || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div>{submission.executionTime || 0}ms</div>
                            <div>{submission.memoryUsage || 0}KB</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {submission.score || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {submission.isFirstCorrect ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              🥇 First
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col">
                            <div className="font-medium">
                              {new Date(submission.submittedAt).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {getRelativeTime(submission.submittedAt)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedSubmission(submission)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Code
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Code Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Code Submission - {selectedSubmission.user.username}
              </h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="mb-4 text-sm text-gray-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold text-gray-800 mb-2">Submission Details</div>
                  <div>Problem: {selectedSubmission.problem.title}</div>
                  <div>Language: {selectedSubmission.language}</div>
                  <div>Status: <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedSubmission.status)}`}>{selectedSubmission.status}</span></div>
                  <div>Score: {selectedSubmission.score || 0} points</div>
                  <div>First Correct: {selectedSubmission.isFirstCorrect ? '🥇 Yes' : 'No'}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 mb-2">Performance & Time</div>
                  <div>Time Complexity: {selectedSubmission.timeComplexity || 'N/A'}</div>
                  <div>Space Complexity: {selectedSubmission.spaceComplexity || 'N/A'}</div>
                  <div>Execution Time: {selectedSubmission.executionTime || 0}ms</div>
                  <div>Memory Usage: {selectedSubmission.memoryUsage || 0}KB</div>
                  <div className="mt-2 p-2 bg-blue-50 rounded border">
                    <div className="font-medium text-blue-800">📅 Submission Time</div>
                    <div className="text-blue-700">{new Date(selectedSubmission.submittedAt).toLocaleString()}</div>
                    <div className="text-xs text-blue-600">{getRelativeTime(selectedSubmission.submittedAt)}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border rounded-md p-4 bg-gray-50 max-h-96 overflow-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {selectedSubmission.code}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
