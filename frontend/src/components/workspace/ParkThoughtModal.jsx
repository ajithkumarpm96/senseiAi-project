import React, { useState } from 'react'
import { useAppStore } from '../../store/appStore'

export default function ParkThoughtModal({ 
  isOpen, 
  onClose, 
  onSaveThought,
  onAskSensei,
  currentTopic = 'Current Lesson'
}) {
  const [thought, setThought] = useState('')
  const parkedThoughts = useAppStore((state) => state.parkedThoughts || [])
  const addParkedThought = useAppStore((state) => state.addParkedThought)
  const removeParkedThought = useAppStore((state) => state.removeParkedThought)
  const clearParkedThoughts = useAppStore((state) => state.clearParkedThoughts)

  if (!isOpen) return null

  const handleSave = (e) => {
    e.preventDefault()
    if (!thought.trim()) return
    const text = thought.trim()
    addParkedThought(text, currentTopic)
    if (onSaveThought) {
      onSaveThought(text)
    }
    setThought('')
  }

  const handleAskSensei = (item) => {
    if (onAskSensei) {
      onAskSensei(`Earlier I parked this thought while studying ${item.topic}: "${item.text}". Can we explore this now?`)
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/70 sm:backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:max-w-xl bg-[#16181d] sm:border border-[#2f343d] rounded-none sm:rounded-2xl p-4 sm:p-6 shadow-2xl relative flex flex-col gap-3.5 sm:gap-4 animate-fadeIn sm:animate-scaleUp text-[#e8eaed] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pt-1 sm:pt-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#183e28] text-[#5fd38d] border border-[#5fd38d]/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">bookmark_add</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-semibold text-[#f1f4fa]">Park a Thought</h3>
                {parkedThoughts.length > 0 && (
                  <span className="text-[10px] sm:text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#5fd38d]/20 text-[#5fd38d] border border-[#5fd38d]/40">
                    {parkedThoughts.length} active
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-[#9ca3af]">Offload side tangents so they don't crowd your memory.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#9ca3af] hover:text-[#f1f4fa] hover:bg-[#1f2229] flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* New Thought Input */}
        <form onSubmit={handleSave} className="flex flex-col gap-2.5 shrink-0">
          <div className="relative">
            <textarea
              autoFocus
              rows={2}
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSave(e)
                }
              }}
              placeholder="e.g. Does useEffect run on initial SSR render too? Check later..."
              className="w-full bg-[#1a1b21] border border-[#2f343d] focus:border-[#6c8cff] focus:ring-1 focus:ring-[#6c8cff] rounded-xl p-3 text-xs sm:text-sm text-[#e8eaed] placeholder-[#9ca3af]/50 outline-none resize-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9ca3af] flex items-center gap-1 font-mono">
              <span className="material-symbols-outlined text-[13px] text-[#5fd38d]">lock</span>
              <span>Saved locally &amp; persists</span>
            </span>
            <button
              type="submit"
              disabled={!thought.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-[#5fd38d] hover:bg-[#86fab0] disabled:opacity-40 text-[#00391d] text-xs font-semibold shadow-sm transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Park it</span>
              <span className="material-symbols-outlined text-[14px]">south_east</span>
            </button>
          </div>
        </form>

        <div className="h-px bg-[#2f343d]/60 my-0.5 shrink-0" />

        {/* Parked Thoughts List Section */}
        <div className="flex flex-col gap-2 overflow-hidden flex-1 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#9ca3af]">
              Saved Thoughts ({parkedThoughts.length})
            </span>
            {parkedThoughts.length > 0 && (
              <button
                type="button"
                onClick={clearParkedThoughts}
                className="text-[11px] font-mono text-[#ffb4ab]/80 hover:text-[#ffb4ab] hover:underline cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 min-h-0 pr-1 space-y-2.5">
            {parkedThoughts.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#1a1b21]/60 border border-[#2f343d]/60 text-center flex flex-col items-center gap-1.5 text-xs text-[#9ca3af]">
                <span className="material-symbols-outlined text-[24px] text-[#5fd38d]/60">task_alt</span>
                <p className="text-[#f1f4fa] font-medium">No parked thoughts right now</p>
                <p className="text-[11px] text-[#9ca3af]/80 max-w-sm">
                  Whenever a curious distraction or side question pops into your head, park it here (or double-tap any lesson response) to keep your focus intact.
                </p>
              </div>
            ) : (
              parkedThoughts.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#1a1b21] border border-[#2f343d] hover:border-[#4b515d] transition-all flex flex-col gap-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs sm:text-sm text-[#e8eaed] leading-relaxed break-words flex-1">
                      {item.text}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeParkedThought(item.id)}
                      className="text-[#9ca3af] hover:text-[#ffb4ab] p-1 rounded-lg hover:bg-[#282a2f] transition-colors shrink-0 cursor-pointer"
                      title="Delete thought"
                    >
                      <span className="material-symbols-outlined text-[15px]">close</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#2f343d]/40 text-[11px]">
                    <div className="flex items-center gap-2 text-[#9ca3af] font-mono">
                      <span className="px-2 py-0.5 rounded bg-[#282a2f] text-[#6c8cff]">
                        {item.topic || 'General'}
                      </span>
                      <span>{item.createdAt}</span>
                    </div>

                    {onAskSensei && (
                      <button
                        type="button"
                        onClick={() => handleAskSensei(item)}
                        className="text-xs font-semibold text-[#5fd38d] hover:text-[#86fab0] hover:underline flex items-center gap-1 font-mono cursor-pointer"
                      >
                        <span>Ask Sensei</span>
                        <span className="material-symbols-outlined text-[13px]">north_east</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
