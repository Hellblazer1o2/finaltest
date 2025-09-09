import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateSession } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const admin = await validateSession(token)

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const userId = params.id

    // Update user to remove all warnings and disqualification
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        warnings: 0,
        isDisqualified: false,
        disqualifiedAt: null,
      },
    })

    return NextResponse.json({
      message: 'Warnings removed successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        warnings: updatedUser.warnings,
        isDisqualified: updatedUser.isDisqualified,
      }
    })
  } catch (error) {
    console.error('Failed to remove warnings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
