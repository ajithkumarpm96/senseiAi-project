import React, { useState } from 'react'

export default function AgentThoughtTrace({ steps = [], isStreaming = false }) {
  const [isExpanded, setIsExpanded] = useState(isStreaming)

  if (!steps || steps.length === 0) return null

  const showContent = isStreaming || isExpanded

  return (
    <div className="mb-4 text-xs rounded-xl border border-[#2f343d] bg-[#1a1b21] overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#1f2229] hover:bg-[#282a2f] text-[#9ca3af] hover:text-[#e8eaed] transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#6c8cff] text-[16px]">smart_toy</span>
          <span className="font-medium text-[#e8eaed] font-mono text-xs">Agent Decision Trail</span>
          <span className="text-[11px] bg-[#282a2f] text-[#9ca3af] px-2 py-0.5 rounded-full font-mono">
            {steps.length} {steps.length === 1 ? 'step' : 'steps'}
          </span>
        </div>

        {isStreaming ? (
          <div className="flex items-center gap-1.5 text-[#6c8cff] text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6c8cff] animate-ping" />
            <span className="animate-pulse">Thinking...</span>
          </div>
        ) : (
          <span className={`material-symbols-outlined text-[16px] transition-transform ${showContent ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        )}
      </button>

      {showContent && (
        <div className="p-3.5 space-y-2 border-t border-[#2f343d] bg-[#1a1b21]">
          {steps.map((step, idx) => {
            const isDuck = step.tool === 'duckduckgo_search'
            const isDone = step.status === 'done'

            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 text-xs text-[#9ca3af] leading-relaxed font-mono"
              >
                <div className="shrink-0 mt-0.5">
                  {isDuck ? (
                    <span className="text-sm" title="Web Search">🔍</span>
                  ) : isDone ? (
                    <span className="material-symbols-outlined text-[#5fd38d] text-[15px]">check</span>
                  ) : (
                    <span className="inline-block w-2.5 h-2.5 rounded-full border border-[#6c8cff] border-t-transparent animate-spin" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#e8eaed]">
                      {step.name || (isDuck ? 'Web Search' : 'Analysis')}
                    </span>
                    {step.duration && (
                      <span className="text-[#9ca3af]/60 text-[10px]">({step.duration})</span>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-[11px] text-[#9ca3af] mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
