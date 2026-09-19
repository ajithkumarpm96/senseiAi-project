import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { useAppStore } from '../../store/appStore'

export default function ResumingDashboard({ 
  projects = [], 
  activeProjectId,
  onSelectProject,
  onOpenNewModal, 
  onDeleteProject,
  onCleanWorkspace 
}) {
  const navigate = useNavigate()
  const user = useAppStore((state) => state.user)

  // Top active project selected on dashboard
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0]
  const otherProjects = projects.filter((p) => p.id !== activeProject?.id)

  const [progressData, setProgressData] = useState(null)
  const [chapters, setChapters] = useState([])
  const [loadingProgress, setLoadingProgress] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showOtherPaths, setShowOtherPaths] = useState(true)

  // Fetch progress and chapters for currently active project
  useEffect(() => {
    if (!activeProject?.id) return
    let isMounted = true
    setLoadingProgress(true)

    Promise.all([
      api.get(`/progress/${activeProject.id}`).catch(() => ({ data: null })),
      api.get(`/projects/${activeProject.id}/chapters`).catch(() => ({ data: [] })),
    ])
      .then(([progRes, chapRes]) => {
        if (!isMounted) return
        setProgressData(progRes.data)
        setChapters(Array.isArray(chapRes.data) ? chapRes.data : [])
      })
      .finally(() => {
        if (isMounted) setLoadingProgress(false)
      })

    return () => {
      isMounted = false
    }
  }, [activeProject?.id])

  // A subject is CONTINUING if it has chapters in DB or total_chapters > 0
  const hasChapters = chapters.length > 0 || (progressData && progressData.total_chapters > 0)
  const isFreshSubject = !hasChapters

  const totalChapters = chapters.length || progressData?.total_chapters || 4
  const completedChapters = progressData?.completed_chapters ?? chapters.filter((c) => c.status === 'completed').length
  const completionPercentage = progressData?.completion_percentage ?? (totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0)

  // Identify active / current chapter
  const currentChapter = 
    chapters.find((c) => c.status === 'in_progress') || 
    chapters.find((c) => c.status !== 'completed') || 
    progressData?.chapters?.find((c) => c.status === 'in_progress') || 
    chapters[0]

  const activeChapterIndex = chapters.findIndex((c) => c.id === currentChapter?.id)
  const currentStepNum = activeChapterIndex >= 0 ? activeChapterIndex + 1 : 1

  return (
    <main className="w-full min-h-screen bg-[#161920] text-[#c8cdd8]">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8 pb-16">
        
        {/* ========================================== */}
        {/* BLOCK 1: DYNAMIC HERO CARD (Continuously adapts to selected subject) */}
        {/* ========================================== */}
        <section className="w-full bg-[#16181d] border border-[#2f343d] rounded-2xl p-5 sm:p-7 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          {/* Subtle tone ambient glow */}
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[#6c8cff]/10 blur-3xl pointer-events-none" />

          {/* Reassurance banner & New Subject button */}
          <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
            {isFreshSubject ? (
              <div className="flex items-center gap-2 text-[#5fd38d] bg-[#183e28]/50 border border-[#5fd38d]/30 px-3 py-1 rounded-full text-xs font-semibold font-mono">
                <span className="w-2 h-2 rounded-full bg-[#5fd38d]" />
                <span>Clean slate • Ready to start</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#5fd38d] bg-[#183e28]/50 border border-[#5fd38d]/30 px-3 py-1 rounded-full text-xs font-semibold font-mono">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Ready whenever you are • No rush</span>
              </div>
            )}
            
            <button
              type="button"
              onClick={onOpenNewModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1f2229] hover:bg-[#282a2f] border border-[#2f343d] hover:border-[#6c8cff]/50 text-xs font-medium text-[#6c8cff] transition-all group"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:rotate-90 transition-transform">add</span>
              <span>New Subject</span>
            </button>
          </div>

          {/* Main Anchor Information */}
          <div className="flex flex-col gap-2 max-w-[65ch] relative z-10">
            <span className="text-xs font-mono text-[#9ca3af] uppercase tracking-wider font-semibold">
              {isFreshSubject 
                ? `Ready to explore fresh subject: ${activeProject?.title}`
                : `Welcome back, ${user?.username || 'Alex'}. Your current thread is waiting.`}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#e8eaed] tracking-tight">
              {activeProject?.title}
            </h1>
            <p className="text-sm sm:text-base text-[#9ca3af] leading-relaxed">
              {activeProject?.description || (isFreshSubject
                ? 'We break this topic down into bite-sized 5-minute mental models. No timers, no reset penalties, and autosave handles every keystroke.'
                : 'Continue your focused session. Intermediate mental state and context is preserved forever.')}
            </p>
          </div>

          {/* Visual Concept Illustration (Stitch Spec) */}
          <div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden bg-[#1f2229] border border-[#2f343d]">
            <div 
              className="w-full h-full bg-cover bg-center opacity-70"
              style={{
                backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCnOBSlf7-3RiURTJTrQA5XzpQJNAmJDE3H6GSaegaZMWd15sHALKM08EutrQZR7qknYK94MFA-1m7LlQCPjCv4rT9ESacbXMorytPgco6T8vy-vadamO5h8lwG4v3T7rKpvX8HcnLgbWS2TH6Dvo5yb_MslKd_Oj0MDu4sqgGFtNDrRpGkukXC7zzSHxKDoXL0leVG_QzNUOUqG7wKbaugqv722p_JsYJ0eNACA_KfgPIpOGZDoVSX")`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#16181d] via-[#16181d]/50 to-transparent" />
            <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-[#33353a]/80 backdrop-blur-sm text-xs font-mono text-[#6c8cff] border border-[#2f343d]">
                {isFreshSubject ? 'Fresh Module Sandbox' : 'Mental Concept Sandbox'}
              </span>
              <span className="text-xs text-[#5fd38d] font-mono flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">psychology</span> 
                {isFreshSubject ? 'Zero executive friction' : 'Ready to resume'}
              </span>
            </div>
          </div>

          {/* Progress Box (Continuously reflects progress or fresh step 1) */}
          <div className="bg-[#1a1b21] border border-[#2f343d] p-4 rounded-xl flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="font-semibold text-[#e8eaed]">
                {isFreshSubject 
                  ? 'Step 1 of 4: Introduction & Mental Models'
                  : `Step ${Math.min(completedChapters + 1, totalChapters)} of ${totalChapters}: ${currentChapter?.title || 'Active Concept Mechanics'}`}
              </span>
              <span className="text-[#5fd38d] font-mono font-medium">
                {isFreshSubject ? '0% complete • ~5 mins' : `${Math.round(completionPercentage)}% complete • ~6 mins`}
              </span>
            </div>

            {/* Segmented Progress Rail */}
            <div className="w-full h-2.5 bg-[#282a2f] rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-[#5fd38d] rounded-full transition-all duration-500" 
                style={{ width: `${isFreshSubject ? 8 : Math.max(15, completionPercentage)}%` }} 
              />
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              {chapters.length > 0 ? (
                chapters.slice(0, 4).map((ch, idx) => {
                  const isDone = ch.status === 'completed'
                  const isCurrent = ch.id === currentChapter?.id
                  return (
                    <div 
                      key={ch.id || idx}
                      className={`flex items-center gap-1.5 truncate ${
                        isDone 
                          ? 'text-[#5fd38d]' 
                          : isCurrent 
                            ? 'text-[#6c8cff] font-semibold' 
                            : 'text-[#9ca3af]'
                      }`}
                    >
                      {isDone ? (
                        <span className="material-symbols-outlined text-[15px]">check_circle</span>
                      ) : isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-[#6c8cff] animate-pulse shrink-0" />
                      ) : (
                        <span className="material-symbols-outlined text-[15px]">radio_button_unchecked</span>
                      )}
                      <span className="truncate">{idx + 1}. {ch.title}</span>
                    </div>
                  )
                })
              ) : (
                <>
                  <div className="flex items-center gap-1.5 truncate text-[#6c8cff] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#6c8cff] animate-pulse shrink-0" />
                    <span>1. Foundations</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate text-[#9ca3af]">
                    <span className="material-symbols-outlined text-[15px]">radio_button_unchecked</span>
                    <span>2. Core Concept</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate text-[#9ca3af]">
                    <span className="material-symbols-outlined text-[15px]">radio_button_unchecked</span>
                    <span>3. Practice</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate text-[#9ca3af]">
                    <span className="material-symbols-outlined text-[15px]">terminal</span>
                    <span>4. Sandbox</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate(`/study/${activeProject?.id}`)}
              className="h-12 px-6 bg-[#6c8cff] hover:bg-[#809cff] active:scale-[0.99] text-[#001e60] rounded-xl flex items-center justify-center gap-2 shadow-sm font-semibold text-sm sm:text-base transition-all focus:outline-none focus:ring-2 focus:ring-[#6c8cff]"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isFreshSubject ? 'check_circle' : 'play_arrow'}
              </span>
              <span>{isFreshSubject ? "✓ Ready · Let's Start" : 'Continue Session'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSummary(!showSummary)}
              className="h-12 px-4 bg-[#1f2229] hover:bg-[#282a2f] border border-[#2f343d] text-[#e8eaed] rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-[#9ca3af]">menu_book</span>
              <span>{showSummary ? 'Hide quick summary' : 'Read quick summary first'}</span>
            </button>

            {/* Minimal Delete on Active project */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete subject "${activeProject?.title}"?`)) {
                  onDeleteProject(activeProject?.id)
                }
              }}
              className="h-12 w-12 ml-auto rounded-xl bg-[#1f2229] hover:bg-[#93000a]/20 border border-[#2f343d] text-[#9ca3af] hover:text-[#ffb4ab] flex items-center justify-center transition-colors"
              title="Delete this subject"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>

          {/* Collapsible Quick Summary Panel */}
          {showSummary && (
            <div className="bg-[#1f2229] border border-[#2f343d] p-4 rounded-xl text-[#e8eaed] flex flex-col gap-2 animate-fadeIn">
              <div className="flex items-center gap-2 text-[#6c8cff] font-medium text-xs font-mono">
                <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                <span>60-Second Refresher Before You Code</span>
              </div>
              <p className="text-sm text-[#9ca3af] leading-relaxed max-w-[65ch]">
                {isFreshSubject 
                  ? 'We will approach this subject in calm, bite-sized increments. First, we anchor the high-level intuition before touching any syntax or edge cases.'
                  : 'The browser executes code line by line on the single thread. Synchronous work runs immediately. Microtasks (like resolved Promises) jump straight to the VIP line and run immediately right after the current function finishes.'}
              </p>
            </div>
          )}
        </section>

        {/* ========================================== */}
        {/* BLOCK 2: GENTLE PROGRESS & REST DAYS */}
        {/* ========================================== */}
        <section className="w-full bg-[#16181d] border border-[#2f343d] rounded-2xl p-5 sm:p-7 shadow-sm flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-mono text-[#9ca3af] uppercase tracking-wider font-semibold">
                Weekly Rhythm • Low-Pressure
              </span>
              <h2 className="text-base sm:text-lg font-semibold text-[#e8eaed]">
                This week: 4 of 5 gentle sessions completed
              </h2>
            </div>
            <div className="flex items-center gap-1.5 bg-[#1a1b21] border border-[#2f343d] px-3 py-1 rounded-full text-xs text-[#5fd38d]">
              <span className="material-symbols-outlined text-[16px]">self_improvement</span>
              <span>Recharging is counted as progress</span>
            </div>
          </div>

          {/* Encouraging microcopy card */}
          <div className="bg-[#1a1b21] border border-[#2f343d] p-4 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#183e28] text-[#5fd38d] border border-[#5fd38d]/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">favorite</span>
            </div>
            <p className="text-xs sm:text-sm text-[#e8eaed] leading-relaxed">
              <strong>Nice, 1 lesson down this morning.</strong> Rest days are an essential part of retaining technical systems concepts. Never stress over an off day.
            </p>
          </div>

          {/* 7 Day Badges (Mon to Sun) */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1">
            <div className="bg-[#1f2229] border border-[#2f343d] p-2.5 rounded-xl flex flex-col items-center justify-center text-center gap-1">
              <span className="text-[11px] text-[#9ca3af] font-medium">Mon</span>
              <div className="w-7 h-7 rounded-full bg-[#5fd38d] text-[#00391d] flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] font-bold">check</span>
              </div>
              <span className="text-[10px] text-[#5fd38d] font-mono">Done</span>
            </div>

            <div className="bg-[#1f2229] border border-[#2f343d] p-2.5 rounded-xl flex flex-col items-center justify-center text-center gap-1">
              <span className="text-[11px] text-[#9ca3af] font-medium">Tue</span>
              <div className="w-7 h-7 rounded-full bg-[#5fd38d] text-[#00391d] flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] font-bold">check</span>
              </div>
              <span className="text-[10px] text-[#5fd38d] font-mono">Done</span>
            </div>

            <div className="bg-[#1a1b21] border border-[#2f343d] p-2.5 rounded-xl flex flex-col items-center justify-center text-center gap-1">
              <span className="text-[11px] text-[#9ca3af] font-medium">Wed</span>
              <div className="w-7 h-7 rounded-full bg-[#282a2f] text-[#9ca3af] flex items-center justify-center">
                <span className="material-symbols-outlined text-[15px]">coffee</span>
              </div>
              <span className="text-[10px] text-[#9ca3af] font-mono">Rest Day</span>
            </div>

            <div className="bg-[#1f2229] border border-[#2f343d] p-2.5 rounded-xl flex flex-col items-center justify-center text-center gap-1">
              <span className="text-[11px] text-[#9ca3af] font-medium">Thu</span>
              <div className="w-7 h-7 rounded-full bg-[#5fd38d] text-[#00391d] flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] font-bold">check</span>
              </div>
              <span className="text-[10px] text-[#5fd38d] font-mono">Done</span>
            </div>

            <div className="bg-[#1f2229] border-2 border-[#6c8cff] p-2.5 rounded-xl flex flex-col items-center justify-center text-center gap-1 shadow-sm">
              <span className="text-[11px] text-[#6c8cff] font-bold">Fri (Today)</span>
              <div className="w-7 h-7 rounded-full bg-[#6c8cff] text-[#001e60] flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">flag</span>
              </div>
              <span className="text-[10px] text-[#6c8cff] font-bold font-mono">1/2 Done</span>
            </div>

            <div className="bg-[#1a1b21] border border-[#2f343d] p-2.5 rounded-xl flex flex-col items-center justify-center text-center gap-1">
              <span className="text-[11px] text-[#9ca3af] font-medium">Sat</span>
              <div className="w-7 h-7 rounded-full bg-[#282a2f] text-[#9ca3af] flex items-center justify-center">
                <span className="material-symbols-outlined text-[15px]">bedtime</span>
              </div>
              <span className="text-[10px] text-[#9ca3af] font-mono">Recharge</span>
            </div>

            <div className="bg-[#1a1b21] border border-[#2f343d] p-2.5 rounded-xl flex flex-col items-center justify-center text-center gap-1">
              <span className="text-[11px] text-[#9ca3af] font-medium">Sun</span>
              <div className="w-7 h-7 rounded-full bg-[#282a2f] text-[#9ca3af] flex items-center justify-center">
                <span className="material-symbols-outlined text-[15px]">nature</span>
              </div>
              <span className="text-[10px] text-[#9ca3af] font-mono">Free Flow</span>
            </div>
          </div>

          {/* Stepping Stone Donut Metric */}
          <div className="w-full bg-[#1a1b21] border border-[#2f343d] p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <svg className="w-12 h-12 text-[#5fd38d] shrink-0 transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-[#282a2f]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className="text-[#5fd38d]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="80, 100" strokeLinecap="round" strokeWidth="3.2" stroke="currentColor" />
              </svg>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#e8eaed]">80% Weekly Retention Zone</span>
                <span className="text-xs text-[#9ca3af]">Optimal pacing reached without cognitive fatigue.</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[#5fd38d] text-xs font-mono">
              <span className="material-symbols-outlined text-[16px]">shield</span>
              <span>Zero reset penalty active permanently</span>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* BLOCK 3: OTHER TECHNICAL PATHS (Stay in dashboard on switch) */}
        {/* ========================================== */}
        <section className="w-full bg-[#16181d] border border-[#2f343d] rounded-2xl p-5 sm:p-7 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1f2229] border border-[#2f343d] flex items-center justify-center text-[#6c8cff]">
                <span className="material-symbols-outlined text-[20px]">account_tree</span>
              </div>
              <div>
                <span className="text-xs font-mono text-[#9ca3af] uppercase tracking-wider font-semibold">
                  Explore On Your Terms
                </span>
                <h2 className="text-base sm:text-lg font-semibold text-[#e8eaed]">
                  Switch or Explore Other Technical Paths
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowOtherPaths(!showOtherPaths)}
                className="flex items-center gap-1 bg-[#1f2229] hover:bg-[#282a2f] border border-[#2f343d] px-3 py-1.5 rounded-xl text-xs text-[#e8eaed] font-medium transition-colors"
              >
                <span>{showOtherPaths ? 'Hide tracks' : `Show (${otherProjects.length})`}</span>
                <span className={`material-symbols-outlined text-[16px] transition-transform ${showOtherPaths ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
            </div>
          </div>

          {/* Tracks List */}
          {showOtherPaths && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {otherProjects.length === 0 ? (
                <div className="col-span-full py-8 text-center bg-[#1a1b21] border border-[#2f343d] rounded-xl flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-2xl text-[#9ca3af]">folder_open</span>
                  <p className="text-xs text-[#9ca3af]">No additional tracks created yet.</p>
                  <button
                    type="button"
                    onClick={onOpenNewModal}
                    className="text-xs text-[#6c8cff] font-medium hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>Add another subject</span>
                  </button>
                </div>
              ) : (
                otherProjects.map((p) => (
                  <div
                    key={p.id}
                    className="bg-[#1a1b21] border border-[#2f343d] hover:border-[#6c8cff]/40 p-4 rounded-xl flex flex-col justify-between gap-3 transition-colors group"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-[#6c8cff] font-semibold">Track</span>
                        {/* Minimal Delete Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete "${p.title}"?`)) {
                              onDeleteProject(p.id)
                            }
                          }}
                          className="opacity-40 group-hover:opacity-100 p-1 rounded text-[#9ca3af] hover:text-[#ffb4ab] hover:bg-[#93000a]/20 transition-all"
                          title="Delete track"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                      <h3 className="text-sm font-semibold text-[#e8eaed] leading-snug truncate">
                        {p.title}
                      </h3>
                      <p className="text-xs text-[#9ca3af] line-clamp-2">
                        {p.description || 'Self-contained mini-modules crafted for zero mental friction.'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-[#2f343d]">
                      {/* Clicking this switches the active subject on the dashboard without leaving! */}
                      <button
                        type="button"
                        onClick={() => onSelectProject(p.id)}
                        className="w-full py-2 bg-[#1f2229] hover:bg-[#282a2f] active:scale-[0.99] border border-[#2f343d] hover:border-[#6c8cff]/50 text-[#e8eaed] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[15px] text-[#6c8cff]">swap_horiz</span>
                        <span>Switch to this subject</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Fresh Start Assist */}
          <div className="bg-[#1a1b21] border border-[#2f343d] p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-[#9ca3af]">
              Overwhelmed by your current queue? Reset cleanly anytime with zero guilt.
            </span>
            <button
              type="button"
              onClick={onCleanWorkspace}
              className="text-xs text-[#e8eaed] hover:text-[#6c8cff] font-medium underline underline-offset-4 transition-colors font-mono"
            >
              One-click clean workspace
            </button>
          </div>
        </section>

      </div>
    </main>
  )
}
