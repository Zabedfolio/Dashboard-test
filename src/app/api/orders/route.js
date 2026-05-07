import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getOrders, createOrder } from '@/lib/orders'
import { upsertCustomer } from '@/lib/customers'

/**
 * Check if user is authenticated and has moderator+ role
 */
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
 * GET /api/orders
 */
export async function GET(request) {
  try {
    const supabase = await createClient()
    const authCheck = await requireModeratorRole(supabase)
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const result = await getOrders(supabase)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/orders
 */
export async function POST(request) {
  try {
    const supabase = await createClient()
    const authCheck = await requireModeratorRole(supabase)
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const body = await request.json()

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }

    // 1. Handle Customer (using authenticated supabase client)
    let customerId = body.customer_id
    if (!customerId && body.phone) {
      try {
        const customer = await upsertCustomer(supabase, {
          name: body.customer_name || body.name || '',
          phone: body.phone,
          email: body.email || '',
          full_address: body.full_address || ''
        })
        customerId = customer.id
      } catch (err) {
        console.error('Customer creation failed:', err)
        return NextResponse.json({ error: `Customer Error: ${err.message}` }, { status: 400 })
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: 'Customer information is required' }, { status: 400 })
    }

    // 2. Create Order (using authenticated supabase client)
    const order = await createOrder(supabase, {
      customer_id: customerId,
      items: body.items,
      total_amount: body.total_amount,
      shipping_charge: body.shipping_charge || 0,
      delivery_method: body.delivery_method,
      payment_method: body.payment_method,
      payment_status: body.payment_status || 'Unpaid',
      notes: body.notes || ''
    })

    return NextResponse.json({
      success: true,
      data: order
    }, { status: 201 })

  } catch (error) {
    console.error('CRITICAL ORDER ERROR:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
