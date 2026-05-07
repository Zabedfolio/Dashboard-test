import { supabase } from './supabase'

/**
 * Fetch paginated products with filters
 */
export async function getProducts({ status, category_id, search, page = 1, limit = 20 }) {
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('products')
    .select('*, categories(name)', { count: 'exact' })

  // Only apply status filter if it's NOT 'All'
  // Note: if the 'status' column is completely missing from DB, 
  // any query using it will error. 
  if (status && status !== 'All') {
    if (status === 'Low Stock') {
      query = query.lt('stock', 10)
    }
  }

  if (category_id && category_id !== 'all') {
    query = query.eq('category_id', category_id)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,brand.ilike.%${search}%`)
  }

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
 * Fetch single product by ID
 */
export async function getProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Create new product
 */
export async function createProduct(productData) {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  // Slug generation helper
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .concat('-', Math.random().toString(36).substring(2, 7))
  }

  const payload = {
    ...productData,
    slug: generateSlug(productData.name),
    created_by: userData.user.id
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert(payload)
    .select()
    .single()

  if (error) throw error

  // If opening stock > 0, insert a stock movement
  if (product.stock > 0) {
    await supabase.from('stock_movements').insert({
      product_id: product.id,
      type: 'IN',
      quantity: product.stock,
      reason: 'Purchase',
      note: 'Opening stock',
      created_by: userData.user.id
    })
  }

  return product
}

/**
 * Update product
 */
export async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete product
 */
export async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

/**
 * Duplicate product
 */
export async function duplicateProduct(id) {
  const product = await getProductById(id)
  
  // Strip unique/meta fields
  const { id: _, sku: __, slug: ___, created_at: ____, updated_at: _____, categories: ______, ...baseData } = product
  
  return createProduct({
    ...baseData,
    name: `${baseData.name} (Copy)`,
    status: 'Inactive',
    stock: 0 // Duplicates should start with 0 stock
  })
}

/**
 * Get quick dashboard stats for products
 */
export async function getProductStats() {
  const { data: products, error } = await supabase
    .from('products')
    .select('stock')

  if (error) {
    console.error('getProductStats error:', error)
    return { total: 0, active: 0, outOfStock: 0, lowStock: 0 }
  }

  return (products || []).reduce((acc, p) => {
    acc.total++
    // Use stock as a proxy for activity if status column is missing
    if (p.stock > 0) acc.active++
    if (p.stock <= 0) acc.outOfStock++
    if (p.stock < (p.low_stock_threshold || 10) && p.stock > 0) acc.lowStock++
    return acc
  }, { total: 0, active: 0, outOfStock: 0, lowStock: 0 })
}

/**
 * Bulk update product status
 */
export async function bulkUpdateStatus(ids, status) {
  const { data, error } = await supabase
    .from('products')
    .update({ status })
    .in('id', ids)

  if (error) throw error
  return data
}

/**
 * Bulk delete products
 */
export async function bulkDeleteProducts(ids) {
  const { error } = await supabase
    .from('products')
    .delete()
    .in('id', ids)

  if (error) throw error
  return true
}

/**
 * Export products to CSV-friendly format
 */
export async function exportProductsCSV(filters = {}) {
  let query = supabase
    .from('products')
    .select('*, categories(name)')

  if (filters.status && filters.status !== 'All') query = query.eq('status', filters.status)
  if (filters.category_id) query = query.eq('category_id', filters.category_id)

  const { data, error } = await query.order('name')

  if (error) throw error

  return data.map(p => ({
    SKU: p.sku,
    Name: p.name,
    Category: p.categories?.name || 'N/A',
    Brand: p.brand || '-',
    Unit: p.unit,
    'Purchase Price': p.purchase_price,
    'Selling Price': p.unit_price,
    Discount: p.discount,
    'Effective Price': p.unit_price - p.discount,
    Stock: p.stock,
    Status: p.stock > 0 ? 'In Stock' : 'Out of Stock'
  }))
}
