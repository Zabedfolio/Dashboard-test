import { supabase } from './supabase'

/**
 * Fetch all categories with product counts
 */
export async function getCategories() {
  // We fetch categories and then parents in a second step if needed,
  // but a simpler way is to fetch everything and link in JS
  const { data: categories, error } = await supabase
    .from('categories')
    .select(`
      *,
      products:products(count)
    `)
    .order('name')

  if (error) throw error

  // Flatten the count and find parent names
  return categories.map(cat => ({
    ...cat,
    product_count: cat.products?.[0]?.count || 0,
    parent_name: categories.find(p => p.id === cat.parent_id)?.name || null
  }))
}

/**
 * Create category
 */
export async function createCategory({ name, parent_id }) {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
  
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, slug, parent_id: parent_id || null })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update category
 */
export async function updateCategory(id, { name, parent_id }) {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')

  const { data, error } = await supabase
    .from('categories')
    .update({ name, slug, parent_id: parent_id || null })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete category (only if no products)
 */
export async function deleteCategory(id) {
  // Check if products exist
  const { count, error: checkError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)

  if (checkError) throw checkError
  if (count > 0) throw new Error(`Cannot delete: ${count} products are linked to this category.`)

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
