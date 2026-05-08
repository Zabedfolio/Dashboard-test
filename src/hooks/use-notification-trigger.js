import { useCallback } from 'react'

export function useNotificationTrigger() {
  const triggerNotification = useCallback(async (action, entityType, entityId, details = {}) => {
    try {
      const response = await fetch('/api/notifications/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          entityType,
          entityId,
          details
        })
      })

      if (!response.ok) {
        console.error('Failed to trigger notification')
      }
    } catch (error) {
      console.error('Error triggering notification:', error)
      // Silently fail - don't break the main operation
    }
  }, [])

  return { triggerNotification }
}
