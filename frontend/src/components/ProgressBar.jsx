import React from 'react'

export default function ProgressBar({ completed = 0, total = 0, percentage = 0 }) {
  const pct = Math.min(100, Math.max(0, Math.round(percentage)))
  const isMastered = total > 0 && completed === total

  return (
    <div className="px-3.5 py-2.5 border-b border-[#2f343d] bg-[#1a1b21]">
      <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
        <span className="font-semibold text-[#e8eaed] flex items-center gap-1.5">
          <span className="text-sm">{isMastered ? '🏆' : '🌱'}</span>
          <span>Syllabus Mastery</span>
        </span>
        <span className="text-[#5fd38d] font-semibold">
          {completed}/{total} ({pct}%)
        </span>
      </div>

      <div className="w-full bg-[#282a2f] rounded-full h-2 overflow-hidden border border-[#2f343d]/60">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isMastered
              ? 'bg-[#5fd38d]'
              : 'bg-[#6c8cff]'
          }`}
          style={{ width: `${Math.max(pct > 0 ? 8 : 0, pct)}%` }}
        />
      </div>
    </div>
  )
}
