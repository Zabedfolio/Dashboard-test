import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { flagOrder } from '@/lib/orders'

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
 * PATCH /api/orders/[id]/flag - Flag order
 * Body: { isFlagged, flagReason }
 */
export async function PATCH(request, { params }) {
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

    if (typeof body.isFlagged !== 'boolean') {
      return NextResponse.json(
        { error: 'isFlagged must be a boolean' },
        { status: 400 }
      )
    }

    if (body.isFlagged && !body.flagReason) {
      return NextResponse.json(
        { error: 'flagReason is required when flagging an order' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const updates = {
      is_flagged: body.isFlagged,
      flag_reason: body.isFlagged ? body.flagReason : null
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Order flagged successfully',
      data: order
    })
  } catch (error) {
    console.error('Error flagging order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to flag order' },
      { status: 500 }
    )
  }
}
