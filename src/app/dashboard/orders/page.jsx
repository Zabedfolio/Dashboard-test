import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getOrderStats } from '@/lib/orders'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { StatsBar } from '@/components/orders/stats-bar'
import { OrdersListClient } from '@/components/orders/orders-list-client'

export const metadata = {
  title: 'Orders',
  description: 'Manage orders'
}

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch stats for today
  const stats = await getOrderStats(supabase)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track all customer orders</p>
        </div>
        <Link href="/dashboard/orders/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </Link>
      </div>

      <StatsBar stats={stats} />

      <OrdersListClient />
    </div>
  )
}
