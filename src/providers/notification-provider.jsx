'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: true,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  createNotification: async () => {}
})

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const channelRef = useRef(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.is_read).length || 0)
    } catch (error) {
      console.error('Fetch notifications error:', error.message || error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchNotifications()

    // Subscribe to real-time notifications
    // Ensure we don't subscribe multiple times even if the component re-renders
    if (!channelRef.current) {
      const channel = supabase
        .channel('public:notifications_global')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            console.log('New notification:', payload.new)
            setNotifications(prev => [payload.new, ...prev].slice(0, 20))
            setUnreadCount(c => c + 1)
            
            // Show toast for new notification
            toast(payload.new.title, {
              description: payload.new.message,
            })
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
             console.log('Successfully subscribed to notifications')
          }
        })
      
      channelRef.current = channel
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [supabase, fetchNotifications])

  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(c => Math.max(0, c - 1))
    } catch (error) {
      console.error('Mark as read error:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .eq('is_read', false)

      if (error) throw error
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Mark all as read error:', error)
    }
  }

  const createNotification = async ({ type, title, message, payload = {}, targetRole = 'moderator' }) => {
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .or(`role.eq.admin,role.eq.moderator`)

      if (profileError) throw profileError

      const { data: { user: currentUser } } = await supabase.auth.getUser()

      const notificationsToInsert = profiles
        .filter(p => p.id !== currentUser?.id)
        .map(p => ({
          user_id: p.id,
          type,
          title,
          message,
          payload,
        }))

      if (notificationsToInsert.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .insert(notificationsToInsert)

      if (error) throw error
    } catch (error) {
      console.error('Create notification error:', error)
    }
  }

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      loading, 
      markAsRead, 
      markAllAsRead, 
      createNotification 
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
