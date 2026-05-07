import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getOrderComments, addOrderComment } from '@/lib/orders'

/**
 * Check if user is authenticated and has moderator+ role
 */
async function requireModeratorRole(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }

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
 * GET /api/orders/[id]/comments
 */
export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const authCheck = await requireModeratorRole(supabase)
    if (authCheck.error) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })

    const { id } = params
    const comments = await getOrderComments(supabase, id)

    return NextResponse.json({ success: true, data: comments })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/orders/[id]/comments
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createClient()
    const authCheck = await requireModeratorRole(supabase)
    if (authCheck.error) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })

    const { id } = params
    const body = await request.json()

    if (!body.comment) return NextResponse.json({ error: 'comment is required' }, { status: 400 })

    const comment = await addOrderComment(supabase, id, body.comment.trim())

    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
