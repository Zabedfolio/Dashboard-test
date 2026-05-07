import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getOrderById, updateOrder, deleteOrder } from '@/lib/orders'

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
 * Check if user is admin
 */
async function requireAdminRole() {
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

  if (profile?.role !== 'admin') {
    return { error: 'Forbidden', status: 403 }
  }

  return { user, role: 'admin' }
}

/**
 * GET /api/orders/[id] - Fetch single order with related data
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

    const order = await getOrderById(id)

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/orders/[id] - Update order
 * Body: Any order fields (except order_id, created_by, created_at)
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

    // Remove read-only fields
    const { id: _, order_id, created_by, created_at, updated_at, ...updates } = body

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const order = await updateOrder(id, updates)

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/orders/[id] - Delete order (admin only)
 */
export async function DELETE(request, { params }) {
  try {
    const authCheck = await requireAdminRole()
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

    await deleteOrder(id)

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete order' },
      { status: 500 }
    )
  }
}
