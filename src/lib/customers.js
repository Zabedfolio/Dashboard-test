import { supabase } from './supabase'

/**
 * Fetch all customers with their total purchase stats
 */
export async function getCustomers() {
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
