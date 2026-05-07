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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-2">Manage and track all customer orders</p>
        </div>
        <Link href="/dashboard/orders/new">
          <Button>
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
