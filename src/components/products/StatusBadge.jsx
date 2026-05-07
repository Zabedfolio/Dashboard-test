'use client'

import { Badge } from '@/components/ui/badge'

export function StatusBadge({ status, stock, threshold }) {
  const isLowStock = stock !== undefined && threshold !== undefined && stock < threshold && stock > 0

  if (isLowStock) {
    return (
      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
        Low Stock ({stock})
      </Badge>
    )
  }

  const styles = {
    'Active': 'bg-green-500/10 text-green-500 border-green-500/20',
    'Inactive': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    'Out of Stock': 'bg-red-500/10 text-red-500 border-red-500/20'
  }

  return (
    <Badge variant="outline" className={styles[status] || styles['Inactive']}>
      {status}
    </Badge>
  )
}
