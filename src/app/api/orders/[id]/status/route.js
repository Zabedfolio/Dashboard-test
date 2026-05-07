import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { updateOrderStatus } from '@/lib/orders'

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

const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned']

/**
 * PATCH /api/orders/[id]/status
 */
export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient()
    const authCheck = await requireModeratorRole(supabase)
    if (authCheck.error) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })

    const { id } = params
    const body = await request.json()

    if (!body.status) return NextResponse.json({ error: 'status is required' }, { status: 400 })
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Pass the authenticated supabase client
    const order = await updateOrderStatus(supabase, id, body.status)

    // Optional: Record status history if needed
    if (body.note) {
      await supabase.from('order_status_history').insert({
        order_id: id,
        status: body.status,
        note: body.note,
        changed_by: authCheck.user.id
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    })
  } catch (error) {
    console.error('Status Update Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
