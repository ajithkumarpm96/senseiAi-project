import React from 'react'

const MOODS = [
  { id: 'focused', label: '🎯 Focused', desc: 'Crisp & deep' },
  { id: 'chill', label: '🧘 Chill', desc: 'Relaxed & easy' },
  { id: 'tired', label: '🥱 Fried / ADHD', desc: 'Ultra-short & punchy' },
  { id: 'hyped', label: '⚡ Hyped', desc: 'High shonen energy' },
]

export default function MoodSelector({ currentMood, onSelectMood }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
      <span className="text-xs text-gray-500 font-medium mr-1 uppercase tracking-wider hidden sm:inline">
        Mood:
      </span>
      {MOODS.map((m) => {
        const active = currentMood === m.id
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelectMood(m.id)}
            title={m.desc}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer whitespace-nowrap ${
              active
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/50 scale-105'
                : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
