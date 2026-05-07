import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { updateOrderStatus } from '@/lib/orders'

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

const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned']

/**
 * PATCH /api/orders/[id]/status - Update order status
 * Body: { status, note }
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

    if (!body.status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      )
    }

    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const order = await updateOrderStatus(id, body.status, body.note || '')

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    )
  }
}
