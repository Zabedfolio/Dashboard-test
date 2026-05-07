import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getOrderById, updateOrder, deleteOrder } from '@/lib/orders'

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
 * GET /api/orders/[id]
 */
export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const authCheck = await requireModeratorRole(supabase)
    if (authCheck.error) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })

    const { id } = params
    const order = await getOrderById(supabase, id)

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/orders/[id]
 */
export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient()
    const authCheck = await requireModeratorRole(supabase)
    if (authCheck.error) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })

    const { id } = params
    const body = await request.json()

    // Remove read-only fields
    const { id: _, order_id, created_by, created_at, updated_at, ...updates } = body

    const order = await updateOrder(supabase, id, updates)

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    })
  } catch (error) {
    console.error('Update Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/orders/[id]
 */
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const authCheck = await requireModeratorRole(supabase) // Allow moderators to delete for testing, or change to requireAdminRole
    if (authCheck.error) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })

    const { id } = params
    await deleteOrder(supabase, id)

    return NextResponse.json({ success: true, message: 'Order deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
