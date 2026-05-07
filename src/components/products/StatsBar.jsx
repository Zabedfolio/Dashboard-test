import { Card, CardContent } from '@/components/ui/card'
import { Package, CheckCircle2, AlertCircle, TrendingDown } from 'lucide-react'

export function StatsBar({ stats }) {
  const items = [
    {
      label: 'Total Products',
      value: stats?.total || 0,
      icon: Package,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Active Items',
      value: stats?.active || 0,
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      label: 'Out of Stock',
      value: stats?.outOfStock || 0,
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10'
    },
    {
      label: 'Low Stock Alerts',
      value: stats?.lowStock || 0,
      icon: TrendingDown,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.label} className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-2 rounded-lg ${item.bg}`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {item.label}
              </p>
              <p className="text-xl font-bold">{item.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
