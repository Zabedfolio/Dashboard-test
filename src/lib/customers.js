import { createClient } from '@/utils/supabase/server'

/**
 * Search customers by phone or name
 */
export async function searchCustomers(query) {
  const supabase = await createClient()

  if (!query || query.trim().length < 2) {
    return []
  }

  const searchQuery = `%${query.trim()}%`

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`phone.ilike.${searchQuery},name.ilike.${searchQuery}`)
    .limit(5)

  if (error) {
    console.error('Error searching customers:', error)
    throw error
  }

  return data || []
}

/**
 * Get customer by phone number
 */
export async function getCustomerByPhone(phone) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .maybeSingle()

  if (error) {
    console.error('Error fetching customer:', error)
    throw error
  }

  return data
}

/**
 * Get customer by ID
 */
export async function getCustomer(id) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching customer:', error)
    throw error
  }

  return data
}

/**
 * Create or update customer by phone (upsert)
 */
export async function upsertCustomer(customerData) {
  const supabase = await createClient()

  try {
    // Check if customer exists
    const existing = await getCustomerByPhone(customerData.phone)

    if (existing) {
      // Update existing customer
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: customerData.name || existing.name,
          email: customerData.email || existing.email,
          division: customerData.division || existing.division,
          district: customerData.district || existing.district,
          thana: customerData.thana || existing.thana,
          village: customerData.village || existing.village,
          full_address: customerData.full_address || existing.full_address
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Create new customer
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: customerData.name || '',
          phone: customerData.phone,
          email: customerData.email || '',
          division: customerData.division || '',
          district: customerData.district || '',
          thana: customerData.thana || '',
          village: customerData.village || '',
          full_address: customerData.full_address || ''
        }])
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error('Error upserting customer:', error)
    throw error
  }
}

/**
 * Get all customers (for dropdown selects)
 */
export async function getCustomers({ limit = 100, offset = 0 } = {}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone, full_address')
    .order('name')
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching customers:', error)
    throw error
  }

  return data || []
}
