import { supabase as defaultSupabase } from './supabase'

/**
 * Fetch high-level dashboard statistics combined with reports
 */
export async function getDashboardStats(supabase = defaultSupabase) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    // 1. Fetch Today's Sales
    const { data: todayOrders, error: todayError } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', today.toISOString())
      .not('order_status', 'eq', 'Cancelled')

    if (todayError) console.warn('Today orders fetch error:', todayError)
    const todaySales = (todayOrders || []).reduce((sum, o) => sum + Number(o.total_amount), 0)

    // 2. Fetch Monthly Revenue
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const { data: monthlyOrders, error: monthlyError } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', startOfMonth.toISOString())
      .not('order_status', 'eq', 'Cancelled')

    if (monthlyError) console.warn('Monthly orders fetch error:', monthlyError)
    const monthlyRevenue = (monthlyOrders || []).reduce((sum, o) => sum + Number(o.total_amount), 0)

    // 3. Fetch Low Stock Products
    const { data: lowStockProds, error: stockError } = await supabase
      .from('products')
      .select('name, sku, stock')
      .lt('stock', 10) 
      .limit(10)

    if (stockError) console.warn('Stock fetch error:', stockError)

    // 4. Fetch Recent Orders
    const { data: recentOrders, error: recentError } = await supabase
      .from('orders')
      .select(`
        id,
        order_id,
        total_amount,
        order_status,
        payment_status,
        created_at,
        customers (name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) console.warn('Recent orders fetch error:', recentError)

    // 5. Fetch Top Customers for Report
    const { data: topCustomers, error: customerError } = await supabase
      .from('customers')
      .select(`
        name,
        orders (total_amount)
      `)
      .limit(10)

    if (customerError) console.warn('Customer report fetch error:', customerError)
    
    const customerReport = (topCustomers || [])
      .map(c => ({
        name: c.name,
        purchases: c.orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0
      }))
      .sort((a, b) => b.purchases - a.purchases)
      .slice(0, 5)

    return {
      todaySales,
      monthlyRevenue,
      lowStock: lowStockProds || [],
      recentOrders: recentOrders || [],
      customerReport,
      totalOrdersCount: (monthlyOrders || []).length,
      netProfit: monthlyRevenue * 0.25, 
      pendingDue: 0
    }
  } catch (err) {
    console.error('getDashboardStats CRITICAL ERROR:', err)
    throw err
  }
}

/**
 * Fetch sales trend for charts
 */
export async function getSalesTrend(supabase = defaultSupabase) {
  const { data, error } = await supabase
    .from('orders')
    .select('total_amount, created_at')
    .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
    .not('order_status', 'eq', 'Cancelled')

  if (error) {
    console.error('getSalesTrend error:', error)
    return []
  }

  // Group by date
  const trend = (data || []).reduce((acc, order) => {
    const date = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
    acc[date] = (acc[date] || 0) + Number(order.total_amount)
    return acc
  }, {})

  return Object.entries(trend).map(([date, sales]) => ({
    date,
    sales,
    profit: sales * 0.25 
  }))
}

export async function getOrderStats(supabase = defaultSupabase) {
  return getDashboardStats(supabase);
}
