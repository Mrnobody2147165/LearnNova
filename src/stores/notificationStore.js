import { create } from 'zustand'
import { notifications as mockNotifications } from '../data/dashboard'

export const useNotificationStore = create((set) => ({
  notifications: [...mockNotifications],

  unreadCount: () => {
    return get().notifications.filter(n => !n.read).length
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
    }))
  },

  markAllRead: () => {
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

const get = () => useNotificationStore.getState()
