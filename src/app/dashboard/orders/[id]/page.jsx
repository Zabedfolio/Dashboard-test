import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getOrderById } from '@/lib/orders'
import { OrderDetailClient } from '@/components/orders/order-detail-client'

export async function generateMetadata({ params }) {
  const { id } = await params
  return {
    title: `Order Detail | Business Command Center`,
    description: `View and edit order ${id}`
  }
}

export default async function OrderDetailPage({ params }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'moderator'].includes(profile.role)) {
    redirect('/dashboard')
  }

  let order
  try {
    order = await getOrderById(id)
  } catch {
    notFound()
  }

  if (!order) notFound()

  return (
    <OrderDetailClient
      initialOrder={order}
      userRole={profile.role}
      userName={profile.name}
    />
  )
}
