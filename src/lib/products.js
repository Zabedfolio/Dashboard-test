import { createClient } from '@/utils/supabase/server'

/**
 * Search products by name or SKU
 */
export async function searchProducts(query) {
  const supabase = await createClient()

  if (!query || query.trim().length < 1) {
    return []
  }

  const searchQuery = `%${query.trim()}%`

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.${searchQuery},sku.ilike.${searchQuery}`)
    .limit(10)

  if (error) {
    console.error('Error searching products:', error)
    throw error
  }

  return data || []
}

/**
 * Get product by ID
 */
export async function getProduct(id) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    throw error
  }

  return data
}

/**
 * Get all products
 */
export async function getProducts({ limit = 100, offset = 0 } = {}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name')
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching products:', error)
    throw error
  }

  return data || []
}

/**
 * Get product with stock info
 */
export async function getProductWithStock(id) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, unit_price, stock')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    throw error
  }

  return data
}

/**
 * Check product stock availability
 */
export async function checkProductStock(productId, requiredQty) {
  const product = await getProductWithStock(productId)

  if (!product) {
    throw new Error('Product not found')
  }

  if (product.stock < requiredQty) {
    throw new Error(
      `Insufficient stock. Available: ${product.stock}, Required: ${requiredQty}`
    )
  }

  return true
}
