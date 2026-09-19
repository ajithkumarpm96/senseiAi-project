import React, { useState } from 'react'

export default function NewSubjectModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const suggestions = [
    'JavaScript: How the Event Loop Thinks',
    'Python: Memory & Pointers Demystified',
    'C++ & Systems: Understanding What the CPU Does',
    'React 19 Server Components & Actions',
    'Database Indexing & Query Optimizations',
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onCreate(title.trim())
      setTitle('')
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-[#16181d] border border-[#2f343d] rounded-2xl p-6 shadow-2xl relative flex flex-col gap-5 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6c8cff]/15 border border-[#6c8cff]/30 flex items-center justify-center text-[#6c8cff]">
              <span className="material-symbols-outlined text-[22px]">add_circle</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#f1f4fa]">Explore New Subject</h2>
              <p className="text-xs text-[#9ca3af]">Create a zero-pressure topic stack to learn at your pace.</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider font-mono">
              Subject or Topic Name
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Systems, Rust Borrow Checker, Next.js..."
              className="w-full h-12 bg-[#1a1b21] border border-[#2f343d] focus:border-[#6c8cff] focus:ring-1 focus:ring-[#6c8cff] rounded-xl px-4 text-sm text-[#e8eaed] placeholder-[#9ca3af]/50 outline-none transition-colors"
            />
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-mono text-[#9ca3af] uppercase">Quick Suggestions</span>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setTitle(suggestion)}
                  className="px-2.5 py-1 rounded-lg bg-[#1f2229] hover:bg-[#282a2f] border border-[#2f343d] text-xs text-[#9ca3af] hover:text-[#e8eaed] transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2f343d]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#9ca3af] hover:text-[#e8eaed] hover:bg-[#1f2229] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#6c8cff] hover:bg-[#809cff] disabled:opacity-50 text-[#001e60] text-sm font-semibold flex items-center gap-2 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#6c8cff]"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  <span>Add Subject</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
