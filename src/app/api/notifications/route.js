import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

async function requireModeratorRole(supabase) {
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
 * POST /api/notifications/trigger
 * Triggers notifications to admins and moderators
 */
export async function POST(request) {
  try {
    const supabase = await createClient()
    const authCheck = await requireModeratorRole(supabase)
    
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const body = await request.json()
    const { action, entityType, entityId, details } = body

    if (!action || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'action, entityType, and entityId are required' },
        { status: 400 }
      )
    }

    // Call the RLS-bypassing function via service role or direct SQL
    const { data, error } = await supabase.rpc('notify_admins_and_moderators', {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_details: details || {}
    })

    if (error) {
      console.error('Notification trigger error:', error)
      // Don't fail the request if notification fails
      return NextResponse.json({ 
        success: true, 
        warning: 'Change saved but notification failed'
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error triggering notifications:', error)
    // Don't fail the request if notification fails
    return NextResponse.json({ success: true })
  }
}

/**
 * GET /api/notifications
 */
export async function GET(request) {
  try {
    const supabase = await createClient()
    const authCheck = await requireModeratorRole(supabase)
    
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', authCheck.user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      data: notifications 
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
