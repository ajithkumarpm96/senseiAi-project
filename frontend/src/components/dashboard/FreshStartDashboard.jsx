import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'

export default function FreshStartDashboard({ 
  projects = [], 
  activeProjectId,
  onSelectActiveProject,
  onOpenNewModal, 
  onDeleteProject,
  onStartProject 
}) {
  const navigate = useNavigate()
  const user = useAppStore((state) => state.user)

  // Default preset starter paths if no user projects exist yet
  const defaultStarterPaths = [
    {
      id: 'preset-js',
      title: 'JavaScript: How the Event Loop Thinks',
      tag: 'Most gentle start',
      description: '5 min intro • Visual micro-tasks • Zero setup required',
      steps: '0/3 micro-steps',
      isPreset: true,
      initialTopic: 'JavaScript: How the Event Loop Thinks',
    },
    {
      id: 'preset-py',
      title: 'Python: Memory & Pointers Demystified',
      tag: 'Spatial logic',
      description: '6 min intro • Interactive spatial boxes • No code typing',
      steps: '0/4 micro-steps',
      isPreset: true,
      initialTopic: 'Python: Memory & Pointers Demystified',
    },
    {
      id: 'preset-cpp',
      title: 'C++ & Systems: Understanding What the CPU Does',
      tag: 'Hardware clarity',
      description: '7 min intro • Plain language breakdown • Hardware clarity',
      steps: '0/3 micro-steps',
      isPreset: true,
      initialTopic: 'C++ & Systems: Understanding What the CPU Does',
    },
  ]

  // Combine user projects and default starter paths
  const displayPaths = projects.length > 0
    ? projects.map((p, idx) => ({
        id: p.id,
        title: p.title,
        tag: idx === 0 ? 'Recently added' : 'Explore',
        description: p.description || '5 min intro • Visual micro-tasks • Bite-sized models',
        steps: '0/3 micro-steps',
        isPreset: false,
        rawProject: p,
      }))
    : defaultStarterPaths

  const [selectedId, setSelectedId] = useState(activeProjectId || displayPaths[0]?.id || '')
  const [starting, setStarting] = useState(false)

  // Synchronize when activeProjectId changes
  useEffect(() => {
    if (activeProjectId) {
      setSelectedId(activeProjectId)
    }
  }, [activeProjectId])

  const selectedPath = displayPaths.find((p) => p.id === selectedId) || displayPaths[0]

  const handleStart = async () => {
    if (!selectedPath) return
    setStarting(true)

    if (selectedPath.isPreset) {
      if (onStartProject) {
        await onStartProject(selectedPath.initialTopic)
      }
    } else {
      navigate(`/study/${selectedPath.id}`)
    }
  }

  // Generate concise button label like in Stitch designs
  const buttonLabel = selectedPath?.title
    ? `✓ Ready · Open ${selectedPath.title.split(':')[0].split('•')[0].trim()}`
    : "✓ Ready · Let's Start"

  return (
    <main className="w-full min-h-screen bg-[#13151b] text-[#c8cdd8]">
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
        
        {/* BLOCK 1: Gentle Invitation Hero */}
        <section className="relative bg-[#1b1e27] rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/25 overflow-hidden flex flex-col gap-4">
          {/* Ambient gentle tone gradient blob */}
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[#6c8cff]/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col items-start gap-3 relative z-10">
            {/* Reassuring Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#282a2f] border border-[#2f343d] text-xs">
              <span className="w-2 h-2 rounded-full bg-[#5fd38d]" />
              <span className="text-[#5fd38d] font-medium font-mono">Clean slate • No pressure, start anytime</span>
            </div>

            {/* Greeting & Header */}
            <div className="flex flex-col gap-1">
              <span className="text-xs sm:text-sm text-[#9ca3af]">
                Welcome to Sensei AI, {user?.username || 'Learner'}
              </span>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#f1f4fa] tracking-tight">
                Choose one small path to explore today
              </h1>
            </div>

            {/* Supportive Reassurance Copy */}
            <p className="text-sm sm:text-base text-[#9ca3af] leading-relaxed max-w-[620px]">
              We break complex programming and systems concepts into bite-sized 5-minute mental models. 
              No timers, no reset penalties, and autosave handles every single keystroke.
            </p>

            {/* Primary Action Button */}
            <div className="pt-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleStart}
                disabled={starting}
                className="w-full sm:w-auto h-12 px-7 rounded-xl bg-[#6c8cff] hover:bg-[#809cff] active:scale-[0.99] text-[#001e60] font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-[#6c8cff]/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#6c8cff]"
              >
                {starting ? (
                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px] font-bold">check_circle</span>
                    <span>{buttonLabel}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* BLOCK 2: Starter Paths & Subject Stack */}
        <section className="flex flex-col gap-3">
          {/* Section Header with + New Subject Button */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af] font-mono">
              RECOMMENDED STARTER PATHS (PICK ONE)
            </span>
            
            {/* Sleek New Subject Button */}
            <button
              type="button"
              onClick={onOpenNewModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1f2229] hover:bg-[#282a2f] border border-[#2f343d] hover:border-[#6c8cff]/50 text-xs font-medium text-[#6c8cff] transition-all shadow-sm group"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:rotate-90 transition-transform">add</span>
              <span>New Subject</span>
            </button>
          </div>

          {/* Cards Stack */}
          <div className="grid grid-cols-1 gap-3">
            {displayPaths.map((path) => {
              const isSelected = selectedId === path.id
              return (
                <div
                  key={path.id}
                  onClick={() => {
                    setSelectedId(path.id)
                    if (onSelectActiveProject && !path.isPreset) {
                      onSelectActiveProject(path.id)
                    }
                  }}
                  className={`group relative rounded-xl p-4 transition-all cursor-pointer flex flex-col gap-2 border shadow-sm ${
                    isSelected
                      ? 'bg-[#1f2229] border-[#6c8cff]/60 ring-1 ring-[#6c8cff]/40'
                      : 'bg-[#1a1b21] border-[#2f343d] hover:border-[#4b515d] hover:bg-[#1f2229]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Radio Target Indicator */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected 
                          ? 'bg-[#6c8cff] text-[#001e60]' 
                          : 'bg-[#282a2f] text-[#9ca3af] border border-[#2f343d]'
                      }`}>
                        {isSelected ? (
                          <span className="material-symbols-outlined text-[15px] font-bold">check</span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-[#4b515d]" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`text-sm sm:text-base font-semibold leading-snug truncate ${
                            isSelected ? 'text-[#f1f4fa]' : 'text-[#e8eaed]'
                          }`}>
                            {path.title}
                          </h3>
                          {path.tag && (
                            <span className="px-2 py-0.5 rounded-md bg-[#183e28] text-[#5fd38d] border border-[#5fd38d]/30 text-[11px] font-medium font-mono">
                              {path.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#9ca3af] mt-1 leading-normal">
                          {path.description}
                        </p>
                      </div>
                    </div>

                    {/* Right side: Status and Minimal Delete button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium font-mono hidden sm:inline ${
                        isSelected ? 'text-[#6c8cff]' : 'text-[#9ca3af]'
                      }`}>
                        {isSelected ? 'Selected' : 'Select'}
                      </span>

                      {/* Minimal Delete Button (only for user created projects, not presets) */}
                      {!path.isPreset && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm(`Delete "${path.title}"?`)) {
                              onDeleteProject(path.id)
                            }
                          }}
                          className="opacity-60 hover:opacity-100 p-1 rounded-lg text-[#9ca3af] hover:text-[#ffb4ab] hover:bg-[#93000a]/20 transition-all"
                          title="Delete subject"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Micro Progress Line */}
                  <div className="pl-9 pr-1 pt-1">
                    <div className="w-full bg-[#161920] rounded-full h-1.5 overflow-hidden border border-[#2f343d]">
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${
                        isSelected ? 'bg-[#5fd38d] w-3' : 'bg-[#282a2f] w-0'
                      }`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* BLOCK 3: Peace of Mind & Neurodivergent Accommodations */}
        <section className="bg-[#1b1e27] rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-xl shadow-black/25">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#5fd38d] text-[20px]">verified_user</span>
            <h2 className="text-sm sm:text-base font-semibold text-[#f1f4fa]">
              Built for Executive Ease &amp; Focus
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Pillar 1 */}
            <div className="flex flex-col gap-1.5 bg-[#1a1b21] border border-[#2f343d] p-3.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-[#f1f4fa] text-sm font-medium">
                <span>🌱</span>
                <span>100% Forgiving</span>
              </div>
              <p className="text-xs text-[#9ca3af] leading-relaxed">
                Step away mid-sentence anytime. Your exact state is preserved forever with zero manual saves needed.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="flex flex-col gap-1.5 bg-[#1a1b21] border border-[#2f343d] p-3.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-[#f1f4fa] text-sm font-medium">
                <span>🧠</span>
                <span>Cognitive Ease</span>
              </div>
              <p className="text-xs text-[#9ca3af] leading-relaxed">
                Dyslexia-tested font choices and loose line-height prevent eye drift and reduce visual crowding.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="flex flex-col gap-1.5 bg-[#1a1b21] border border-[#2f343d] p-3.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-[#f1f4fa] text-sm font-medium">
                <span>🎯</span>
                <span>Zero Guilt</span>
              </div>
              <p className="text-xs text-[#9ca3af] leading-relaxed">
                No broken streaks, no shaming emails. Rest days nourish mental synthesis and are celebrated.
              </p>
            </div>
          </div>
        </section>

        {/* Quiet Reassuring Footnote */}
        <footer className="p-4 rounded-xl bg-[#1a1b21] border border-[#2f343d] flex items-center gap-3">
          <span className="material-symbols-outlined text-[#5fd38d] text-[22px] shrink-0">self_improvement</span>
          <p className="text-xs text-[#9ca3af]">
            <strong className="text-[#e8eaed]">No Pressure Pace:</strong> Take breaks when needed. Your mental clarity comes first.
          </p>
        </footer>

      </div>
    </main>
  )
}
