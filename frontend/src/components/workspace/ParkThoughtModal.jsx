import React, { useState } from 'react'

export default function ParkThoughtModal({ isOpen, onClose, onSaveThought }) {
  const [thought, setThought] = useState('')

  if (!isOpen) return null

  const handleSave = (e) => {
    e.preventDefault()
    if (!thought.trim()) return
    onSaveThought(thought.trim())
    setThought('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-[#16181d] border border-[#2f343d] rounded-2xl p-6 shadow-2xl relative flex flex-col gap-4 animate-scaleUp text-[#e8eaed]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#183e28] text-[#5fd38d] border border-[#5fd38d]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">bookmark_add</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#f1f4fa]">Park a thought</h3>
              <p className="text-xs text-[#9ca3af]">Offload side tangents immediately so they don't crowd your working memory.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#9ca3af] hover:text-[#f1f4fa] hover:bg-[#1f2229] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <textarea
            autoFocus
            rows={3}
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            placeholder="e.g. Does useEffect run on initial SSR render too? Check later..."
            className="w-full bg-[#1a1b21] border border-[#2f343d] focus:border-[#6c8cff] focus:ring-1 focus:ring-[#6c8cff] rounded-xl p-3.5 text-sm text-[#e8eaed] placeholder-[#9ca3af]/50 outline-none resize-none transition-colors"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#9ca3af] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#5fd38d]">lock</span>
              <span>Saved safely to this session</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#9ca3af] hover:text-[#e8eaed] hover:bg-[#1f2229] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!thought.trim()}
                className="px-4 py-2 rounded-xl bg-[#5fd38d] hover:bg-[#86fab0] disabled:opacity-50 text-[#00391d] text-xs font-semibold shadow-sm transition-all"
              >
                Save for later
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
