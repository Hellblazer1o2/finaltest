'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { WavyBackground } from '@/components/ui/wavy-background'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <WavyBackground 
        className="min-h-screen"
        backgroundFill="white"
        colors={["#3b82f6", "#1d4ed8", "#1e40af"]}
        waveOpacity={0.3}
      >
        <div className="flex flex-col items-center justify-center px-4 text-center py-16 min-h-screen">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-gray-900 font-bold mb-6 sm:mb-8">
            Welcome to <span className="text-indigo-600">Ignium IDE</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 font-normal mb-8 sm:mb-12 max-w-4xl leading-relaxed">
            A Problem Solving Platform Created with ❤️ by Innovare Technical Club For TECHFEST@25
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-12">
            <Link
              href="/login"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-base sm:text-lg shadow-lg hover:shadow-xl"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200 text-base sm:text-lg border-2 border-indigo-600 shadow-lg hover:shadow-xl"
            >
              Create Account
            </Link>
          </div>
          
          {/* Watermark - Only visible on home page */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
            <p className="text-sm text-gray-500 mb-1">
              @VCETECHFEST25
            </p>
            <p className="text-xs text-gray-400">
              Created with ❤️ by Innovare Technical Club
            </p>
          </div>
        </div>
      </WavyBackground>
    </div>
  )
}
