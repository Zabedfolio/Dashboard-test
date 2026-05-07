import { supabase } from './supabase'

/**
 * Fetch all categories
 */
export async function getCategories() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) {
    console.error('getCategories error:', error)
    return []
  }

  // Find parent names locally
  return (categories || []).map(cat => ({
    ...cat,
    product_count: 0, // Simplified to avoid 400 errors until DB is fixed
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
 * Delete category
 */
export async function deleteCategory(id) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
