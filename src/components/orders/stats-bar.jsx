'use client'

import { StatCard } from '@/components/stat-card'
import { TrendingUp, AlertCircle, DollarSign, Wallet } from 'lucide-react'

export function StatsBar({ stats = {} }) {
  const {
    todayOrderCount = 0,
    pendingCount = 0,
    totalRevenue = 0,
    codCount = 0,
    paidCount = 0
  } = stats

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        label="Today's Orders"
        value={todayOrderCount}
        icon={TrendingUp}
        tone="primary"
      />
      <StatCard
        label="Pending Orders"
        value={pendingCount}
        icon={AlertCircle}
        tone="warning"
      />
      <StatCard
        label="Today's Revenue"
        value={`৳${totalRevenue.toLocaleString('en-BD', { maximumFractionDigits: 0 })}`}
        icon={DollarSign}
        tone="success"
      />
      <StatCard
        label="COD Orders"
        value={codCount}
        icon={Wallet}
        tone="primary"
      />
      <StatCard
        label="Paid Orders"
        value={paidCount}
        icon={TrendingUp}
        tone="success"
      />
    </div>
  )
}
