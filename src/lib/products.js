import { supabase as defaultSupabase } from './supabase'

/**
 * Fetch paginated products with filters
 */
export async function getProducts(supabase = defaultSupabase, { status, category_id, search, page = 1, limit = 20 } = {}) {
  if (supabase && !supabase.from) {
    const options = supabase
    supabase = defaultSupabase
    return getProducts(supabase, options)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('products')
    .select('*, categories(name)', { count: 'exact' })

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
export async function getProductById(supabase = defaultSupabase, id) {
  if (typeof supabase === 'string') {
    id = supabase
    supabase = defaultSupabase
  }

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
export async function createProduct(supabase = defaultSupabase, productData) {
  if (typeof supabase === 'object' && !supabase.from) {
    productData = supabase
    supabase = defaultSupabase
  }

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) throw new Error('Auth session invalid')

  const slug = productData.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .concat('-', Math.random().toString(36).substring(2, 7))

  const payload = {
    name: productData.name,
    description: productData.description || '',
    category_id: productData.category_id,
    brand: productData.brand || '',
    unit: productData.unit || 'pcs',
    unit_price: Number(productData.unit_price) || 0,
    purchase_price: Number(productData.purchase_price) || 0,
    discount: Number(productData.discount) || 0,
    stock: Number(productData.stock) || 0,
    low_stock_threshold: Number(productData.low_stock_threshold) || 10,
    status: productData.status || 'Active',
    images: productData.images || [],
    variants: productData.variants || [],
    slug: slug,
    created_by: userData.user.id
  }

  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update product
 */
export async function updateProduct(supabase = defaultSupabase, id, updates) {
  if (typeof supabase === 'string') {
    updates = id
    id = supabase
    supabase = defaultSupabase
  }

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
export async function deleteProduct(supabase = defaultSupabase, id) {
  if (typeof supabase === 'string') {
    id = supabase
    supabase = defaultSupabase
  }

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
export async function duplicateProduct(supabase = defaultSupabase, id) {
  if (typeof supabase === 'string') {
    id = supabase
    supabase = defaultSupabase
  }
  const product = await getProductById(supabase, id)
  const { id: _, sku: __, slug: ___, created_at: ____, updated_at: _____, categories: ______, ...baseData } = product
  
  return createProduct(supabase, {
    ...baseData,
    name: `${baseData.name} (Copy)`,
    stock: 0 
  })
}

/**
 * Get product stats
 */
export async function getProductStats(supabase = defaultSupabase) {
  const { data: products, error } = await supabase
    .from('products')
    .select('stock')

  if (error) {
    console.error('getProductStats error:', error)
    return { total: 0, active: 0, outOfStock: 0, lowStock: 0 }
  }

  return (products || []).reduce((acc, p) => {
    acc.total++
    if (p.stock > 0) acc.active++
    if (p.stock <= 0) acc.outOfStock++
    if (p.stock < 10 && p.stock > 0) acc.lowStock++
    return acc
  }, { total: 0, active: 0, outOfStock: 0, lowStock: 0 })
}

/**
 * Search products for orders
 */
export async function searchProducts(supabase = defaultSupabase, query) {
  if (typeof supabase === 'string') {
    query = supabase
    supabase = defaultSupabase
  }

  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name)')
    .or(`name.ilike.%${query}%,sku.ilike.%${query}%,brand.ilike.%${query}%`)
    .limit(10)

  if (error) {
    console.error('searchProducts error:', error)
    return []
  }
  return data
}

/**
 * Bulk update product status
 */
export async function bulkUpdateStatus(supabase = defaultSupabase, ids, status) {
  if (Array.isArray(supabase)) {
    status = ids
    ids = supabase
    supabase = defaultSupabase
  }
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
export async function bulkDeleteProducts(supabase = defaultSupabase, ids) {
  if (Array.isArray(supabase)) {
    ids = supabase
    supabase = defaultSupabase
  }
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
export async function exportProductsCSV(supabase = defaultSupabase, filters = {}) {
  if (supabase && !supabase.from) {
    filters = supabase
    supabase = defaultSupabase
  }
  let query = supabase
    .from('products')
    .select('*, categories(name)')

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
    'Effective Price': (p.unit_price || 0) - (p.discount || 0),
    Stock: p.stock,
    Status: p.stock > 0 ? 'In Stock' : 'Out of Stock'
  }))
}
