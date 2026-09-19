import React from 'react'
import { useAppStore } from '../../store/appStore'

const THEMES = [
  { id: 'anime', label: 'One Piece & Anime', icon: '👒', desc: 'Luffy, nakama spirit, shonen willpower & grit' },
  { id: 'marvel', label: 'Marvel Universe', icon: '🛡️', desc: 'Stark tech, Jarvis precision & superhero mental models' },
  { id: 'harry_potter', label: 'Hogwarts Wizardry', icon: '⚡', desc: 'Spells, potion brewing & magical logic systems' },
]

const MOODS = [
  { id: 'focused', label: '🎯 Focused', desc: 'Crisp, structured & deep' },
  { id: 'chill', label: '🧘 Chill', desc: 'Relaxed, patient & conversational' },
  { id: 'tired', label: '🥱 Fried / ADHD', desc: 'Ultra-short, zero visual crowding' },
  { id: 'hyped', label: '⚡ Hyped', desc: 'High energy & motivational encouragement' },
]

export default function VibeSettingsModal({ 
  isOpen, 
  onClose, 
  currentMood = 'focused', 
  onSelectMood,
  studyMode = 'chill',
  onSelectStudyMode
}) {
  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-[#16181d] border border-[#2f343d] rounded-2xl p-6 shadow-2xl relative flex flex-col gap-5 animate-scaleUp text-[#e8eaed]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f8bc61]/15 border border-[#f8bc61]/30 flex items-center justify-center text-xl">
              👒
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#f1f4fa]">Companion Vibe &amp; Study Mood</h2>
              <p className="text-xs text-[#9ca3af]">Tailor how Sensei coaches you without resetting your progress.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#9ca3af] hover:text-[#f1f4fa] hover:bg-[#1f2229] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Section 1: Pop-Culture Persona */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider font-mono">
              Learning Persona &amp; Metaphors
            </span>
            <div className="grid grid-cols-1 gap-2">
              {THEMES.map((t) => {
                const isActive = theme === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-[#1f2229] border-[#6c8cff] ring-1 ring-[#6c8cff]/50'
                        : 'bg-[#1a1b21] border-[#2f343d] hover:border-[#4b515d] hover:bg-[#1f2229]'
                    }`}
                  >
                    <span className="text-2xl shrink-0 mt-0.5">{t.icon}</span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isActive ? 'text-[#6c8cff]' : 'text-[#f1f4fa]'}`}>
                          {t.label}
                        </span>
                        {isActive && (
                          <span className="text-[11px] bg-[#6c8cff]/20 text-[#6c8cff] px-2 py-0.5 rounded-full font-mono font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#9ca3af] mt-0.5">{t.desc}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 2: Study Mode */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider font-mono">
              Pacing Mode
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSelectStudyMode && onSelectStudyMode('chill')}
                className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition-all ${
                  studyMode === 'chill'
                    ? 'bg-[#183e28]/40 border-[#5fd38d] text-[#5fd38d] font-semibold'
                    : 'bg-[#1a1b21] border-[#2f343d] text-[#9ca3af] hover:text-[#e8eaed] hover:bg-[#1f2229]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-sm">
                  <span>🧘</span>
                  <span>Chill Mode</span>
                </div>
                <span className="text-[11px] opacity-80">Conversational, forgiving, visual</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectStudyMode && onSelectStudyMode('serious')}
                className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition-all ${
                  studyMode === 'serious'
                    ? 'bg-[#1f2229] border-[#6c8cff] text-[#6c8cff] font-semibold'
                    : 'bg-[#1a1b21] border-[#2f343d] text-[#9ca3af] hover:text-[#e8eaed] hover:bg-[#1f2229]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-sm">
                  <span>⚔️</span>
                  <span>Serious Mode</span>
                </div>
                <span className="text-[11px] opacity-80">Direct, concise, rigorous challenges</span>
              </button>
            </div>
          </div>

          {/* Section 3: Daily Energy & Mood */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider font-mono">
              Current Energy Level
            </span>
            <div className="grid grid-cols-2 gap-2">
              {MOODS.map((m) => {
                const isActive = currentMood === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectMood && onSelectMood(m.id)}
                    className={`flex flex-col gap-1 p-2.5 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-[#6c8cff]/15 border-[#6c8cff] text-[#6c8cff] font-semibold'
                        : 'bg-[#1a1b21] border-[#2f343d] text-[#9ca3af] hover:text-[#e8eaed] hover:bg-[#1f2229]'
                    }`}
                  >
                    <span className="text-xs font-medium">{m.label}</span>
                    <span className="text-[11px] opacity-75">{m.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-[#2f343d]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#6c8cff] hover:bg-[#809cff] text-[#001e60] text-sm font-semibold shadow-sm transition-all"
          >
            Apply &amp; Continue
          </button>
        </div>
      </div>
    </div>
  )
}
