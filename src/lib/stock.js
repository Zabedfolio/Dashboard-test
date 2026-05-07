import { supabase } from './supabase'

/**
 * Adjust stock for a product
 */
export async function adjustStock({ product_id, type, quantity, reason, reference_id, note }) {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  // 1. Fetch current product stock
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('stock, status, low_stock_threshold')
    .eq('id', product_id)
    .single()

  if (fetchError) throw fetchError

  // 2. Calculate new stock
  let newStock = product.stock
  if (type === 'IN') newStock += quantity
  else if (type === 'OUT') newStock = Math.max(0, newStock - quantity)
  else if (type === 'ADJUSTMENT') newStock = quantity

  // 3. Determine new status
  let newStatus = product.status
  if (newStock === 0) newStatus = 'Out of Stock'
  else if (newStock > 0 && product.status === 'Out of Stock') newStatus = 'Active'

  // 4. Update Product & Insert Movement in parallel (or sequential for safety)
  const { error: updateError } = await supabase
    .from('products')
    .update({ stock: newStock, status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', product_id)

  if (updateError) throw updateError

  const { data: movement, error: moveError } = await supabase
    .from('stock_movements')
    .insert({
      product_id,
      type,
      quantity,
      reason,
      reference_id,
      note,
      created_by: userData.user.id
    })
    .select()
    .single()

  if (moveError) throw moveError

  return { movement, newStock, newStatus }
}

/**
 * Get stock movements with filters
 */
export async function getStockMovements({ product_id, type, reason, dateFrom, dateTo, page = 1, limit = 20 }) {
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('stock_movements')
    .select(`
      *,
      products(name, sku),
      profiles:created_by(email, name)
    `, { count: 'exact' })

  if (product_id) query = query.eq('product_id', product_id)
  if (type) query = query.eq('type', type)
  if (reason) query = query.eq('reason', reason)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo)

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  return {
    data,
    count,
    totalPages: Math.ceil(count / limit)
  }
}

/**
 * Get all low stock products
 */
export async function getLowStockProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, stock, low_stock_threshold, status, categories(name)')
    // Filters: stock < threshold AND status != Out of Stock
    // Postgres doesn't allow comparing two columns directly in .lt()
    // So we use .filter() or a raw subquery if needed, but for small-mid inventories we can fetch and filter
    // Actually, we can use the .rpc() or just a raw .or()/.filter()
    .filter('stock', 'lt', 'low_stock_threshold') // This is problematic in some postgrest versions
  
  // Alternative: use a raw query if threshold varies per product
  const { data: products, error: rawError } = await supabase
    .rpc('get_low_stock_products') // We can define a function or just do a JS filter
    
  // Since threshold is per product, JS filter is safest for portability unless we add a DB function
  const { data: allProducts, error: allErr } = await supabase
    .from('products')
    .select('id, name, sku, stock, low_stock_threshold, status, categories(name)')
    .neq('status', 'Out of Stock')

  if (allErr) throw allErr

  return allProducts.filter(p => p.stock < p.low_stock_threshold)
}

/**
 * Export stock movements to CSV format
 */
export async function exportStockCSV(filters = {}) {
  const { data, error } = await getStockMovements({ ...filters, limit: 1000 })
  if (error) throw error

  return data.map(m => ({
    Date: new Date(m.created_at).toLocaleString(),
    Product: m.products?.name,
    SKU: m.products?.sku,
    Type: m.type,
    Qty: m.quantity,
    Reason: m.reason,
    Reference: m.reference_id || '-',
    Note: m.note || '-',
    By: m.profiles?.name || m.profiles?.email
  }))
}
