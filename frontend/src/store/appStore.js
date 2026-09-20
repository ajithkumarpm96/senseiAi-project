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
      dyslexicFont: true,    // toggle OpenDyslexic font (default ON)
      textScale: 'normal',   // 'normal' | 'large'
      softView: false,       // low-contrast calm mode
      bionicReading: false,  // Bionic reading (bold first half of words)
      focusedParagraphId: null, // ID of currently focused paragraph for focus dimmer
      parkedThoughts: [],    // Array of { id, text, topic, createdAt }

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
      setBionicReading: (bionicReading) => set({ bionicReading }),
      toggleBionicReading: () => set((state) => ({ bionicReading: !state.bionicReading })),
      setFocusedParagraphId: (focusedParagraphId) => set({ focusedParagraphId }),

      // Parked thoughts actions
      addParkedThought: (text, topic = 'General') => {
        const item = {
          id: 'thought_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          text: (text || '').trim(),
          topic: topic || 'General',
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        set((state) => ({
          parkedThoughts: [item, ...(state.parkedThoughts || [])]
        }))
        return item
      },
      removeParkedThought: (id) => set((state) => ({
        parkedThoughts: (state.parkedThoughts || []).filter((t) => t.id !== id)
      })),
      clearParkedThoughts: () => set({ parkedThoughts: [] }),

      // Logout: clears everything
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'sensei-ai-storage', // localStorage key
      version: 4,
      migrate: (persistedState, version) => {
        let state = { ...persistedState }
        if (!version || version < 2) {
          state.dyslexicFont = true
        }
        if (!version || version < 3) {
          state.bionicReading = false
        }
        if (!version || version < 4) {
          state.parkedThoughts = state.parkedThoughts || []
        }
        return state
      },
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        theme: state.theme,
        dyslexicFont: state.dyslexicFont,
        textScale: state.textScale,
        softView: state.softView,
        bionicReading: state.bionicReading,
        parkedThoughts: state.parkedThoughts
      }),
    }
  )
)
