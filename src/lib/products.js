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
 * Create new product - THE ULTIMATE VERSION
 */
export async function createProduct(productData) {
  console.log('🚀 [createProduct] Input data:', productData);
  
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      throw new Error('Auth session invalid. Please log out and log back in.');
    }

    // Slug generation
    const slug = productData.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .concat('-', Math.random().toString(36).substring(2, 7));

    // CLEAN PAYLOAD: Only send columns that actually exist in the DB
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
    };

    console.log('📦 [createProduct] Final payload:', payload);

    // Perform Insert with a safety timeout
    const insertPromise = supabase
      .from('products')
      .insert(payload)
      .select()
      .single();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out. Please check your internet connection.')), 25000)
    );

    const { data: product, error: insertError } = await Promise.race([insertPromise, timeoutPromise]);

    if (insertError) {
      console.error('❌ [createProduct] Database Error:', insertError);
      // More user-friendly error messages
      if (insertError.code === '23503') throw new Error('Selected category is invalid or was deleted.');
      if (insertError.code === '23505') throw new Error('A product with this name or SKU already exists.');
      throw new Error(insertError.message || 'Failed to save product.');
    }

    console.log('✅ [createProduct] SUCCESS:', product);
    return product;
    
  } catch (err) {
    console.error('💥 [createProduct] CRITICAL:', err);
    throw err;
  }
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
  const { id: _, sku: __, slug: ___, created_at: ____, updated_at: _____, categories: ______, ...baseData } = product
  
  return createProduct({
    ...baseData,
    name: `${baseData.name} (Copy)`,
    stock: 0 
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
    if (p.stock > 0) acc.active++
    if (p.stock <= 0) acc.outOfStock++
    if (p.stock < 10 && p.stock > 0) acc.lowStock++
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
