import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getOrders, createOrder } from '@/lib/orders'
import { upsertCustomer } from '@/lib/customers'

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
 * GET /api/orders - List orders with filters
 * Query params: status, paymentMethod, search, page, limit
 */
export async function GET(request) {
  try {
    const authCheck = await requireModeratorRole()
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const result = await getOrders({
      status,
      paymentMethod,
      search,
      page,
      limit
    })

    return NextResponse.json({
      success: true,
      data: result.orders,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.count,
        totalPages: result.totalPages
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/orders - Create new order
 * Body: { customer_id?, customerId?, items, total_amount, shipping_charge, delivery_method, payment_method, payment_status, notes }
 * If customer_id is not provided but customer data is in body, upsert customer
 */
export async function POST(request) {
  try {
    const authCheck = await requireModeratorRole()
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      )
    }

    if (typeof body.total_amount !== 'number' || body.total_amount <= 0) {
      return NextResponse.json(
        { error: 'Valid total_amount is required' },
        { status: 400 }
      )
    }

    if (!body.delivery_method) {
      return NextResponse.json(
        { error: 'delivery_method is required' },
        { status: 400 }
      )
    }

    if (!body.payment_method) {
      return NextResponse.json(
        { error: 'payment_method is required' },
        { status: 400 }
      )
    }

    let customerId = body.customer_id || body.customerId

    // If customer not selected, create/update from customer data
    if (!customerId && body.phone) {
      try {
        const customer = await upsertCustomer({
          name: body.customer_name || body.name || '',
          phone: body.phone,
          email: body.email || '',
          division: body.division || '',
          district: body.district || '',
          thana: body.thana || '',
          village: body.village || '',
          full_address: body.full_address || body.address || ''
        })
        customerId = customer.id
      } catch (err) {
        return NextResponse.json(
          { error: 'Failed to create/update customer' },
          { status: 400 }
        )
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'customer_id is required' },
        { status: 400 }
      )
    }

    // Create order
    const order = await createOrder({
      customer_id: customerId,
      items: body.items,
      total_amount: body.total_amount,
      shipping_charge: body.shipping_charge || 0,
      delivery_method: body.delivery_method,
      payment_method: body.payment_method,
      payment_status: body.payment_status || 'Unpaid',
      notes: body.notes || ''
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Order created successfully',
        data: order
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}
