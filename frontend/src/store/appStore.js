/**
 * appStore.js - Global State (Zustand)
 *
 * Zustand is a lightweight state manager. Think of it as a simpler version
 * of Redux, but feels like a regular React hook.
 *
 * Why Zustand over useState?
 *   useState is local to one component.
 *   Zustand state is GLOBAL - any component can read or update it without
 *   prop drilling (passing props down 5 levels deep).
 *
 * Analogy: useState is a whiteboard in one room.
 *          Zustand is a shared Google Doc anyone can edit.
 *
 * Usage in any component:
 *   const token = useAppStore((state) => state.token)
 *   const setToken = useAppStore((state) => state.setToken)
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  // persist: automatically saves to localStorage so login survives page refresh
  // Like setting a cookie, but easier
  persist(
    (set) => ({
      // Auth state
      token: null,           // JWT token string (null = not logged in)
      user: null,            // { id, username, theme }

      // UI & Accessibility state
      theme: 'anime',        // pop culture theme: 'anime' | 'marvel' | 'harry_potter'
      dyslexicFont: false,   // toggle OpenDyslexic font
      textScale: 'normal',   // 'normal' | 'large'
      softView: false,       // low-contrast calm mode

      // Actions (functions that update state)
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user, theme: user?.theme || 'anime' }),
      setTheme: (theme) => set({ theme }),
      setDyslexicFont: (dyslexicFont) => set({ dyslexicFont }),
      toggleDyslexicFont: () => set((state) => ({ dyslexicFont: !state.dyslexicFont })),
      setTextScale: (textScale) => set({ textScale }),
      toggleTextScale: () => set((state) => ({ textScale: state.textScale === 'normal' ? 'large' : 'normal' })),
      setSoftView: (softView) => set({ softView }),
      toggleSoftView: () => set((state) => ({ softView: !state.softView })),

      // Logout: clears everything
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'sensei-ai-storage', // localStorage key
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        theme: state.theme,
        dyslexicFont: state.dyslexicFont,
        textScale: state.textScale,
        softView: state.softView
      }),
    }
  )
)
