import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getOrderComments, addOrderComment } from '@/lib/orders'

/**
 * Check if user is authenticated and has moderator+ role
 */
async function requireModeratorRole() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'moderator'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 }
  }

  return { user, role: profile.role }
}

/**
 * GET /api/orders/[id]/comments - Get order comments
 */
export async function GET(request, { params }) {
  try {
    const authCheck = await requireModeratorRole()
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const comments = await getOrderComments(id)

    return NextResponse.json({
      success: true,
      data: comments
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/orders/[id]/comments - Add comment to order
 * Body: { comment }
 */
export async function POST(request, { params }) {
  try {
    const authCheck = await requireModeratorRole()
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    if (!body.comment || typeof body.comment !== 'string' || body.comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'comment is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const comment = await addOrderComment(id, body.comment.trim())

    return NextResponse.json(
      {
        success: true,
        message: 'Comment added successfully',
        data: comment
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add comment' },
      { status: 500 }
    )
  }
}
