import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

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
 * PATCH /api/orders/[id]/flag
 */
export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient()
    const authCheck = await requireModeratorRole(supabase)
    if (authCheck.error) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })

    const { id } = params
    const body = await request.json()

    if (typeof body.isFlagged !== 'boolean') {
      return NextResponse.json({ error: 'isFlagged must be a boolean' }, { status: 400 })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({
        is_flagged: body.isFlagged,
        flag_reason: body.isFlagged ? body.flagReason : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
