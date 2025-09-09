import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateSession } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await validateSession(token)

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const problemId = searchParams.get('problemId')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {}
    if (problemId) where.problemId = problemId
    if (userId) where.userId = userId
    if (status) where.status = status

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        },
        problem: {
          select: {
            id: true,
            title: true,
            points: true,
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Failed to fetch submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
