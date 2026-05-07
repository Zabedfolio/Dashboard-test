import { supabase } from './supabase'

/**
 * Fetch all orders with customer details
 */
export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (name)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ order_status: status })
    .eq('id', orderId)
    .select()

  if (error) throw error
  return data
}

/**
 * Get summary stats for orders
 */
export async function getOrderStats() {
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
