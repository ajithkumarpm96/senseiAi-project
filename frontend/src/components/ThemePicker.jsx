import React from 'react'
import { useAppStore } from '../store/appStore'

const THEMES = [
  { id: 'anime', label: '🍥 Anime (Naruto / One Piece)', icon: '🍥' },
  { id: 'marvel', label: '🦸 Marvel Cinematic Universe', icon: '🦸' },
  { id: 'harry_potter', label: '⚡ Harry Potter (Hogwarts)', icon: '⚡' },
]

export default function ThemePicker() {
  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 font-medium hidden md:inline">Vibe:</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="bg-gray-800 text-gray-200 text-xs rounded-lg px-2.5 py-1.5 border border-gray-700 focus:outline-none focus:border-purple-500 cursor-pointer"
      >
        {THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  )
}
