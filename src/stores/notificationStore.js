import { create } from 'zustand'
import notificationService from '../services/notifications'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  loaded: false,

  fetchNotifications: async () => {
    const data = await notificationService.getAll({ role: 'admin' })
    set({ notifications: data || [], loaded: true })
  },

  unreadCount: () => {
    return get().notifications.filter(n => !n.read).length
  },

  markAsRead: async (id) => {
    await notificationService.markAsRead(id)
    set((state) => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
    }))
  },

  markAllRead: async () => {
    await notificationService.markAllAsRead()
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
    }))
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [
        {
          id: 'N' + Date.now(),
          time: 'Just now',
          read: false,
          ...notification,
        },
        ...state.notifications,
      ],
    }))
  },
}))
