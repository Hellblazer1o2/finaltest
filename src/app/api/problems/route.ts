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

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Check if user is disqualified
    if (user.isDisqualified) {
      return NextResponse.json(
        { error: 'You have been disqualified and cannot access problems' },
        { status: 403 }
      )
    }

    // Check if there's an active round
    const activeRound = await prisma.round.findFirst({
      where: {
        status: 'ACTIVE',
        startTime: { not: null },
        endTime: { gt: new Date() }, // Only show if round hasn't ended
      },
      include: {
        problems: {
          include: {
            problem: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    let problems

    if (activeRound) {
      // If there's an active round, show only round problems
      problems = activeRound.problems.map(rp => ({
        id: rp.problem.id,
        title: rp.problem.title,
        description: rp.problem.description,
        type: rp.problem.type,
        points: rp.problem.points,
        isActive: rp.problem.isActive,
        createdAt: rp.problem.createdAt,
        roundOrder: rp.order, // Include round order
      }))
    } else {
      // If no active round, show all active problems
      problems = await prisma.problem.findMany({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          points: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json({ problems })
  } catch (error) {
    console.error('Failed to fetch problems:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
