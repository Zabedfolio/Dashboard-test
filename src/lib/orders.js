import { supabase as defaultSupabase } from './supabase'
import { generateOrderIdFormat } from './orders-utils'

/**
 * Fetch all orders with customer details
 */
export async function getOrders(supabase = defaultSupabase) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (name, phone)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Fetch single order by ID
 */
export async function getOrderById(supabase = defaultSupabase, id) {
  if (typeof supabase === 'string') {
    id = supabase
    supabase = defaultSupabase
  }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (*),
      items:order_items (*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Create new order
 */
export async function createOrder(supabase = defaultSupabase, orderData) {
  if (typeof supabase === 'object' && !supabase.from) {
    orderData = supabase
    supabase = defaultSupabase
  }

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError

  // 1. Get next sequence for order ID
  const { data: countData, error: countError } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
  
  if (countError) throw countError
  const sequence = (countData?.count || 0) + 1
  const orderId = generateOrderIdFormat(new Date(), sequence)

  // 2. Create the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_id: orderId,
      customer_id: orderData.customer_id,
      total_amount: orderData.total_amount,
      shipping_charge: orderData.shipping_charge,
      delivery_method: orderData.delivery_method,
      payment_method: orderData.payment_method,
      payment_status: orderData.payment_status,
      order_status: 'Pending',
      notes: orderData.notes,
      created_by: userData.user.id
    })
    .select()
    .single()

  if (orderError) throw orderError

  // 3. Create line items
  const lineItems = (orderData.items || []).map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    name: item.name,
    quantity: item.qty,
    unit_price: item.unit_price,
    discount: item.discount || 0,
    subtotal: item.subtotal
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(lineItems)

  if (itemsError) throw itemsError

  return order
}

/**
 * Update order
 */
export async function updateOrder(supabase = defaultSupabase, id, updates) {
  if (typeof supabase === 'string') {
    updates = id
    id = supabase
    supabase = defaultSupabase
  }

  const { data, error } = await supabase
    .from('orders')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update order status
 */
export async function updateOrderStatus(supabase = defaultSupabase, orderId, status) {
  if (typeof supabase === 'string') {
    status = orderId
    orderId = supabase
    supabase = defaultSupabase
  }

  return updateOrder(supabase, orderId, { order_status: status })
}

/**
 * Delete order
 */
export async function deleteOrder(supabase = defaultSupabase, id) {
  if (typeof supabase === 'string') {
    id = supabase
    supabase = defaultSupabase
  }

  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

/**
 * Fetch order comments
 */
export async function getOrderComments(supabase = defaultSupabase, orderId) {
  if (typeof supabase === 'string') {
    orderId = supabase
    supabase = defaultSupabase
  }

  const { data, error } = await supabase
    .from('order_comments')
    .select(`
      *,
      profiles (name, avatar)
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Add order comment
 */
export async function addOrderComment(supabase = defaultSupabase, orderId, comment) {
  if (typeof supabase === 'string') {
    comment = orderId
    orderId = supabase
    supabase = defaultSupabase
  }

  const { data: userData } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('order_comments')
    .insert({
      order_id: orderId,
      comment: comment,
      created_by: userData.user.id
    })
    .select(`
      *,
      profiles (name, avatar)
    `)
    .single()

  if (error) throw error
  return data
}

/**
 * Get summary stats for orders
 */
export async function getOrderStats(supabase = defaultSupabase) {
  const { data, error } = await supabase
    .from('orders')
    .select('total_amount, order_status')

  if (error) {
    console.error('getOrderStats error:', error)
    return { total: 0, revenue: 0, pending: 0, processing: 0 }
  }

  return (data || []).reduce((acc, o) => {
    acc.total++
    acc.revenue += Number(o.total_amount)
    if (o.order_status === 'Pending') acc.pending++
    if (o.order_status === 'Processing') acc.processing++
    return acc
  }, { total: 0, revenue: 0, pending: 0, processing: 0 })
}
