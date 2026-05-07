import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

/**
 * Fetch orders with filtering, searching, and pagination
 */
export async function getOrders({
  status,
  paymentMethod,
  search,
  page = 1,
  limit = 20
}) {
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select(`
      id,
      order_id,
      customer_id,
      customers(id, name, phone),
      items,
      total_amount,
      payment_status,
      order_status,
      created_by,
      profiles!orders_created_by_fkey(id, name),
      created_at
    `)
    .order('created_at', { ascending: false })

  if (status && status !== 'All') {
    query = query.eq('order_status', status)
  }

  if (paymentMethod) {
    query = query.eq('payment_method', paymentMethod)
  }

  if (search) {
    // Search by order_id, customer name, or phone
    query = query.or(
      `order_id.ilike.%${search}%,customers.name.ilike.%${search}%,customers.phone.ilike.%${search}%`
    )
  }

  // Apply pagination
  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching orders:', error)
    throw error
  }

  return {
    orders: data || [],
    count: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

/**
 * Fetch single order with all related data
 */
export async function getOrderById(orderId) {
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers(*),
      created_by_profile:profiles!orders_created_by_fkey(id, name, email)
    `)
    .eq('id', orderId)
    .single()

  if (error) {
    console.error('Error fetching order:', error)
    throw error
  }

  // Fetch status history
  const { data: statusHistory } = await supabase
    .from('order_status_history')
    .select(`
      *,
      changed_by_profile:profiles!order_status_history_changed_by_fkey(id, name, email)
    `)
    .eq('order_id', orderId)
    .order('changed_at', { ascending: false })

  // Fetch comments
  const { data: comments } = await supabase
    .from('order_comments')
    .select(`
      *,
      created_by_profile:profiles!order_comments_created_by_fkey(id, name, email)
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  return {
    ...order,
    statusHistory: statusHistory || [],
    comments: comments || []
  }
}

/**
 * Generate next order ID for the day (HB{DD}{MM}{YY}{sequence})
 */
export async function generateOrderId(date = new Date()) {
  const admin = createAdminClient()

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  const dateKey = `${day}${month}${year}`

  try {
    // Try to update counter
    const { data: updated, error: updateError } = await admin
      .from('order_id_counter')
      .update({ counter: (await getCounter(dateKey)) + 1 })
      .eq('date_key', dateKey)
      .select()
      .single()

    if (!updateError && updated) {
      const sequence = String(updated.counter).padStart(2, '0')
      return `HB${dateKey}${sequence}`
    }

    // If doesn't exist, create it
    const { data: created, error: insertError } = await admin
      .from('order_id_counter')
      .insert([{ date_key: dateKey, counter: 1 }])
      .select()
      .single()

    if (insertError) throw insertError

    return `HB${dateKey}01`
  } catch (error) {
    console.error('Error generating order ID:', error)
    throw error
  }
}

/**
 * Get current counter for date
 */
async function getCounter(dateKey) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('order_id_counter')
    .select('counter')
    .eq('date_key', dateKey)
    .maybeSingle()

  if (error) throw error
  return data?.counter || 0
}

/**
 * Create new order with customer upsert and initial status
 */
export async function createOrder(orderData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Generate order ID
    const orderId = await generateOrderId()

    // Prepare order record
    const orderRecord = {
      order_id: orderId,
      customer_id: orderData.customer_id,
      items: orderData.items || [],
      total_amount: orderData.total_amount || 0,
      shipping_charge: orderData.shipping_charge || 0,
      delivery_method: orderData.delivery_method,
      payment_method: orderData.payment_method,
      payment_status: orderData.payment_status || 'Unpaid',
      order_status: 'Pending',
      notes: orderData.notes || '',
      created_by: user.id
    }

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderRecord])
      .select()
      .single()

    if (orderError) throw orderError

    // Insert initial status history
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert([{
        order_id: order.id,
        status: 'Pending',
        changed_by: user.id,
        note: 'Order created'
      }])

    if (historyError) throw historyError

    return order
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

/**
 * Update order fields
 */
export async function updateOrder(orderId, updates) {
  const supabase = await createClient()

  // Remove read-only fields
  const { id, order_id, created_by, created_at, updated_at, ...safeUpdates } = updates

  const { data, error } = await supabase
    .from('orders')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single()

  if (error) {
    console.error('Error updating order:', error)
    throw error
  }

  return data
}

/**
 * Delete order (admin only - enforced at API level)
 */
export async function deleteOrder(orderId) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)

  if (error) {
    console.error('Error deleting order:', error)
    throw error
  }
}

/**
 * Update order status with history entry
 */
export async function updateOrderStatus(orderId, newStatus, note = '') {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Update order status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        order_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (orderError) throw orderError

    // Insert status history entry
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert([{
        order_id: orderId,
        status: newStatus,
        changed_by: user.id,
        note: note || ''
      }])

    if (historyError) throw historyError

    return order
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error
  }
}

/**
 * Flag order with reason
 */
export async function flagOrder(orderId, flagReason) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .update({
      is_flagged: true,
      flag_reason: flagReason,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error) {
    console.error('Error flagging order:', error)
    throw error
  }

  return data
}

/**
 * Get order stats for today
 */
export async function getOrderStats(date = new Date()) {
  const supabase = await createClient()

  const dateStr = date.toISOString().split('T')[0]
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + 1)
  const nextDateStr = nextDate.toISOString().split('T')[0]

  try {
    const { data: todayOrders, error } = await supabase
      .from('orders')
      .select('total_amount, order_status, payment_method, payment_status')
      .gte('created_at', `${dateStr}T00:00:00`)
      .lt('created_at', `${nextDateStr}T00:00:00`)

    if (error) {
      console.error('Database error in getOrderStats:', error.message, error.details)
      // Return zeroed stats instead of throwing to prevent page crash
      return {
        todayOrderCount: 0,
        pendingCount: 0,
        totalRevenue: 0,
        codCount: 0,
        paidCount: 0
      }
    }

    const orders = todayOrders || []

    return {
      todayOrderCount: orders.length,
      pendingCount: orders.filter(o => o.order_status === 'Pending').length,
      totalRevenue: orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
      codCount: orders.filter(o => o.payment_method === 'COD').length,
      paidCount: orders.filter(o => o.payment_status === 'Paid').length
    }
  } catch (err) {
    console.error('System error in getOrderStats:', err)
    return {
      todayOrderCount: 0,
      pendingCount: 0,
      totalRevenue: 0,
      codCount: 0,
      paidCount: 0
    }
  }
}

/**
 * Add comment to order
 */
export async function addOrderComment(orderId, comment) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('order_comments')
      .insert([{
        order_id: orderId,
        comment,
        created_by: user.id
      }])
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error adding comment:', error)
    throw error
  }
}

/**
 * Get order comments
 */
export async function getOrderComments(orderId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('order_comments')
    .select(`
      *,
      created_by_profile:profiles!order_comments_created_by_fkey(id, name, email)
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching comments:', error)
    throw error
  }

  return data || []
}
