import { supabase as defaultSupabase } from './supabase'

/**
 * Fetch all customers with their total purchase stats
 */
export async function getCustomers(supabase = defaultSupabase) {
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      orders:orders(total_amount)
    `)
    .order('name')

  if (error) throw error

  // Calculate totals for each customer
  return data.map(c => {
    const totalPurchases = c.orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0
    return {
      ...c,
      totalPurchases,
      due: 0, // Placeholder until payments table is implemented
      type: totalPurchases > 50000 ? 'Wholesale' : 'Retail' // Dynamic type
    }
  })
}

/**
 * Search customers by name or phone
 */
export async function searchCustomers(supabase = defaultSupabase, query) {
  // If first arg is string, it means caller used searchCustomers(query)
  if (typeof supabase === 'string') {
    query = supabase
    supabase = defaultSupabase
  }

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(10)

  if (error) throw error
  return data
}

/**
 * Create or update customer by phone
 */
export async function upsertCustomer(supabase = defaultSupabase, customerData) {
  if (typeof supabase === 'object' && !supabase.from) {
    customerData = supabase
    supabase = defaultSupabase
  }

  // First, check if customer with this phone already exists
  const { data: existing, error: findError } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', customerData.phone)
    .maybeSingle()

  if (findError) {
    console.error('Error finding customer:', findError)
    throw findError
  }

  if (existing) {
    // Update existing customer
    const { data: updated, error: updateError } = await supabase
      .from('customers')
      .update({
        ...customerData,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating customer:', updateError)
      throw updateError
    }
    return updated
  } else {
    // Create new customer
    const { data: created, error: createError } = await supabase
      .from('customers')
      .insert({
        ...customerData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating customer:', createError)
      throw createError
    }
    return created
  }
}
