'use client'

import { Badge } from '@/components/ui/badge'
import { getStatusColor } from '@/lib/orders-utils'

export function StatusBadge({ status }) {
  const colorClass = getStatusColor(status)

  return (
    <Badge className={`${colorClass} font-medium px-2.5 py-1`}>
      {status}
    </Badge>
  )
}
