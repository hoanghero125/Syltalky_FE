import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      theme: 'dark',
      language: 'vi',
      notifications: [],

      setUser: (user) => set({ user }),
      setTokens: (accessToken) => set({ accessToken }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),

      addNotification: (notification) =>
        set((state) => ({ notifications: [notification, ...state.notifications] })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, is_read: true } : n
          ),
        })),

      logout: () => set({ user: null, accessToken: null, notifications: [] }),
    }),
    {
      name: 'syltalky-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        theme: state.theme,
        language: state.language,
      }),
    }
  )
)

export default useStore
