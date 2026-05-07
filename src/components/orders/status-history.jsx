'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from './status-badge'
import { formatDate } from '@/lib/orders-utils'

export function StatusHistory({ history = [] }) {
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No status changes recorded</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div key={entry.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
                {index < history.length - 1 && (
                  <div className="w-0.5 h-12 bg-muted mt-2" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2">
                  <StatusBadge status={entry.status} />
                  <span className="text-sm text-muted-foreground">
                    by {entry.changed_by_profile?.name || 'System'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(entry.changed_at)}
                </p>
                {entry.note && (
                  <p className="text-sm mt-2 text-foreground">{entry.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
