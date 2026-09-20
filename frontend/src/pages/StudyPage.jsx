import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAppStore } from '../store/appStore'
import { useChat } from '../hooks/useChat'
import ChatWindow from '../components/ChatWindow'
import ProgressBar from '../components/ProgressBar'
import VibeSettingsModal from '../components/workspace/VibeSettingsModal'
import ParkThoughtModal from '../components/workspace/ParkThoughtModal'
import SenseiLoader from '../components/common/SenseiLoader'

const cleanChapterTitle = (title) => {
  if (!title) return ''
  let t = title.trim()
  if (t.includes(':')) {
    const parts = t.split(':')
    if (parts[1]?.trim().length >= 4) t = parts[1].trim()
  }
  return t.replace(/^(?:Chapter\s*\d+[\s:.-]*|\d+[\s:.-]+)\s*/i, '').trim()
}

export default function StudyPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { 
    user,
    dyslexicFont, 
    toggleDyslexicFont, 
    textScale, 
    toggleTextScale, 
    softView, 
    toggleSoftView 
  } = useAppStore()

  const [project, setProject] = useState(null)
  const [chapters, setChapters] = useState([])
  const [optionalChapters, setOptionalChapters] = useState([])
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [mood, setMood] = useState('focused')
  const [studyMode, setStudyMode] = useState('chill') // 'chill' | 'serious'
  const [difficultyLevel, setDifficultyLevel] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem(`sensei_difficulty_${projectId}`)) || 'beginner'
  })
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [showAddInline, setShowAddInline] = useState(false)
  const [isGeneratingChapters, setIsGeneratingChapters] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 768 : false))
  const [isVibeModalOpen, setIsVibeModalOpen] = useState(false)
  const [isParkModalOpen, setIsParkModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [isChatScrolled, setIsChatScrolled] = useState(false)
  const [isLoadingProject, setIsLoadingProject] = useState(true)
  const [initialMessages, setInitialMessages] = useState(null)

  const handleSelectDifficultyLevel = (lvl) => {
    const validLevel = lvl || 'beginner'
    setDifficultyLevel(validLevel)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`sensei_difficulty_${projectId}`, validLevel)
    }
    if (projectId) {
      api.put(`/projects/${projectId}`, { difficulty_level: validLevel }).catch(() => {})
    }
  }

  // Callback triggered when SSE stream automatically synthesizes a syllabus on the first chat
  const handleSyllabusGenerated = ({ coreChapters, optionalChapters: optChaps, selectedChapterId }) => {
    if (coreChapters && coreChapters.length > 0) {
      setChapters(coreChapters)
      setOptionalChapters(optChaps || [])
      const found = coreChapters.find((c) => c.id === selectedChapterId) || coreChapters[0]
      setSelectedChapter(found)
      if (found?.id) {
        localStorage.setItem(`sensei_active_chapter_${projectId}`, String(found.id))
      }
    }
  }

  const {
    messages,
    isStreaming,
    isLoadingHistory,
    error,
    sendMessage,
    requestChallenge,
    stopStreaming
  } = useChat(
    projectId,
    selectedChapter?.id,
    initialMessages,
    !isLoadingProject,
    handleSyllabusGenerated
  )

  const addParkedThought = useAppStore((state) => state.addParkedThought)
  const parkedThoughts = useAppStore((state) => state.parkedThoughts || [])

  const handleSaveThought = (thought) => {
    addParkedThought(thought, selectedChapter?.title || 'General')
    setToastMessage(`Thought parked: "${thought.slice(0, 32)}..."`)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleTooMuch = () => {
    sendMessage('Too much! Please re-explain this shorter, simpler, and with zero jargon.', mood, studyMode, null, difficultyLevel)
  }

  // Edge swipe-right to return to dashboard on mobile
  useEffect(() => {
    let touchStartX = 0
    let touchStartY = 0

    const handleTouchStart = (e) => {
      if (e.touches && e.touches.length > 0) {
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
      }
    }

    const handleTouchEnd = (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        const touchEndX = e.changedTouches[0].clientX
        const touchEndY = e.changedTouches[0].clientY
        const deltaX = touchEndX - touchStartX
        const deltaY = touchEndY - touchStartY

        // If swipe starts near left edge (< 45px) and swipes right > 70px with low vertical angle
        if (touchStartX < 45 && deltaX > 70 && Math.abs(deltaY) < 60) {
          navigate('/')
        }
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [navigate])

  useEffect(() => {
    loadProjectAndChapters()
  }, [projectId])

  const loadProjectAndChapters = async () => {
    setIsLoadingProject(true)
    try {
      const [projRes, chapRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/chapters`)
      ])
      const projData = projRes.data
      const chapList = chapRes.data || []
      setProject(projData)
      setChapters(chapList)
      if (projData.difficulty_level) {
        setDifficultyLevel(projData.difficulty_level)
      }

      // Restore previously selected chapter from localStorage or active in-progress chapter
      const savedChapId = localStorage.getItem(`sensei_active_chapter_${projectId}`)
      const found = savedChapId ? chapList.find((c) => String(c.id) === String(savedChapId)) : null
      const toSelect = 
        found || 
        chapList.find((c) => c.status === 'in_progress') || 
        chapList.find((c) => c.status !== 'completed') || 
        (chapList.length > 0 ? chapList[0] : null)
      setSelectedChapter(toSelect)

      // Pre-load initial chat history for this active chapter
      try {
        const historyUrl = toSelect?.id
          ? `/chat/history/${projectId}?chapter_id=${toSelect.id}`
          : `/chat/history/${projectId}`
        const histRes = await api.get(historyUrl)
        setInitialMessages(histRes.data || [])
      } catch (hErr) {
        console.error('Error pre-loading initial chat history', hErr)
        setInitialMessages([])
      }
    } catch (err) {
      console.error('Error loading project details', err)
    } finally {
      setIsLoadingProject(false)
    }
  }

  const handleSelectChapter = (ch) => {
    setSelectedChapter(ch)
    if (ch?.id) {
      localStorage.setItem(`sensei_active_chapter_${projectId}`, String(ch.id))
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  // 1. AI Syllabus Generation
  const handleGenerateSyllabus = async () => {
    if (isGeneratingChapters || !project) return
    setIsGeneratingChapters(true)
    try {
      const res = await api.post(`/projects/${projectId}/generate-chapters`)
      const optional = res.data.optional_chapters || []
      setOptionalChapters(optional)

      const chapRes = await api.get(`/projects/${projectId}/chapters`)
      setChapters(chapRes.data)
      if (chapRes.data.length > 0 && (!selectedChapter || !chapRes.data.find((c) => c.id === selectedChapter.id))) {
        setSelectedChapter(chapRes.data[0])
      }
    } catch (err) {
      console.error('Failed to generate chapters via AI', err)
    } finally {
      setIsGeneratingChapters(false)
    }
  }

  // 2. Add custom chapter manually
  const handleAddChapter = async (titleToAdd) => {
    const rawTitle = titleToAdd || newChapterTitle
    const title = cleanChapterTitle(rawTitle)
    if (!title.trim()) return

    try {
      const res = await api.post(`/projects/${projectId}/chapters`, {
        title: title.trim(),
        order_num: chapters.length + 1
      })
      const chapRes = await api.get(`/projects/${projectId}/chapters`)
      setChapters(chapRes.data)
      const added = chapRes.data.find((c) => c.id === res.data.id) || res.data
      setSelectedChapter(added)
      setNewChapterTitle('')
      setShowAddInline(false)

      setOptionalChapters((prev) =>
        prev.filter((t) => cleanChapterTitle(t).toLowerCase() !== title.toLowerCase())
      )
    } catch (err) {
      console.error('Failed to create chapter', err)
    }
  }

  // 3. Delete chapter
  const handleDeleteChapter = async (chapterId, e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this chapter and its messages?')) return
    try {
      await api.delete(`/projects/${projectId}/chapters/${chapterId}`)
      const chapRes = await api.get(`/projects/${projectId}/chapters`)
      setChapters(chapRes.data)
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter(chapRes.data.length > 0 ? chapRes.data[0] : null)
      }
    } catch (err) {
      console.error('Failed to delete chapter', err)
    }
  }

  const completedCount = chapters.filter((c) => c.status === 'completed').length
  const progressPercentage = chapters.length > 0 ? (completedCount / chapters.length) * 100 : 0
  const selectedIndex = chapters.findIndex((c) => c.id === selectedChapter?.id)

  if (isLoadingProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#161920]">
        <SenseiLoader size={130} />
      </div>
    )
  }

  return (
    <div className={`h-screen flex flex-col bg-[#161920] text-[#c8cdd8] overflow-hidden ${softView ? 'soft-view-mode' : ''} ${textScale === 'large' ? 'text-scale-large' : ''}`}>
      
      {/* Toast Notification for Parked Thoughts */}
      {toastMessage && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 bg-[#1f2229] border border-[#5fd38d] text-[#e8eaed] px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-2xl animate-slideDown">
          <span className="material-symbols-outlined text-[#5fd38d] text-[18px]">check_circle</span>
          <span className="text-xs font-mono">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* TOP WORKSPACE HEADER (Responsive Mobile / Desktop) */}
      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* TOP WORKSPACE HEADER (Responsive Mobile / Desktop) */}
      {/* ========================================================= */}
      <header className={`
        transition-all duration-300 ease-in-out z-30 shrink-0
        ${isChatScrolled
          ? 'max-md:fixed max-md:top-0 max-md:left-0 max-md:right-0 max-md:h-0 max-md:bg-transparent max-md:border-b-0 max-md:pointer-events-none md:h-16 md:bg-[#16181d] md:border-b md:border-[#2f343d] flex items-center justify-between px-3 sm:px-6'
          : 'h-13 sm:h-14 md:h-16 bg-[#16181d] border-b border-[#2f343d] flex items-center justify-between px-3 sm:px-6'
        }
      `}>
        
        {/* Desktop Left: Back Link & Breadcrumbs */}
        <div className="hidden md:flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-[#9ca3af] hover:text-[#f1f4fa] transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="h-4 w-px bg-[#2f343d] shrink-0" />

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-mono truncate">
            <span className="w-2 h-2 rounded-full bg-[#5fd38d] shrink-0" />
            <span className="text-[#9ca3af] truncate">{project?.title || 'Study Project'}</span>
            <span className="text-[#4b515d]">/</span>
            <span className="text-[#f1f4fa] font-semibold truncate">
              {selectedChapter ? cleanChapterTitle(selectedChapter.title) : 'Overview'}
            </span>
          </div>
        </div>

        {/* Mobile Left: Hamburger Menu Button (Vanishes when scrolled) */}
        <div className={`flex md:hidden items-center transition-all duration-300 ${isChatScrolled ? 'opacity-0 -translate-x-8 pointer-events-none w-0 overflow-hidden' : 'opacity-100 pointer-events-auto'}`}>
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="p-1.5 -ml-1 rounded-xl text-[#9ca3af] hover:text-[#f1f4fa] hover:bg-[#1f2229] transition-colors flex items-center justify-center"
            title="Toggle Syllabus Navigation"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        </div>

        {/* Desktop Right: Straw Hat Vibe Button, Quiz & Sensory Controls */}
        <div className="hidden md:flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Straw Hat 👒 Vibe & Mood Pop-Up Trigger */}
          <button
            type="button"
            onClick={() => setIsVibeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1f2229] hover:bg-[#282a2f] border border-[#2f343d] hover:border-[#f8bc61]/60 text-xs text-[#e8eaed] transition-all shadow-sm group"
            title="Companion Vibe, Study Mood & Persona"
          >
            <span className="text-base group-hover:scale-110 transition-transform select-none">👒</span>
            <span className="font-mono text-[#f8bc61]">Vibe</span>
          </button>

          {/* Quiz Checkpoint Button */}
          <button
            type="button"
            onClick={() => requestChallenge(mood, studyMode)}
            disabled={isStreaming}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1f2229] hover:bg-[#282a2f] border border-[#f8bc61]/40 hover:border-[#f8bc61] text-xs text-[#f8bc61] transition-all shadow-sm group disabled:opacity-50"
            title="Trigger an interview checkpoint challenge"
          >
            <span className="material-symbols-outlined text-[16px] group-hover:rotate-12 transition-transform">swords</span>
            <span className="font-mono">Quiz</span>
          </button>

          {/* Accessibility Toolbar */}
          <div className="hidden lg:flex items-center bg-[#1a1b21] border border-[#2f343d] px-1.5 py-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={toggleDyslexicFont}
              className={`px-2 py-1 rounded-lg text-xs font-mono transition-colors ${
                dyslexicFont ? 'bg-[#6c8cff] text-[#001e60] font-semibold' : 'text-[#9ca3af] hover:text-[#f1f4fa]'
              }`}
              title="Toggle OpenDyslexic accessible font"
            >
              Dyslexia
            </button>
            <button
              type="button"
              onClick={toggleTextScale}
              className={`px-2 py-1 rounded-lg text-xs font-mono transition-colors ${
                textScale === 'large' ? 'bg-[#6c8cff]/20 text-[#6c8cff]' : 'text-[#9ca3af] hover:text-[#f1f4fa]'
              }`}
              title="Scale text"
            >
              Scale
            </button>
            <button
              type="button"
              onClick={toggleSoftView}
              className={`px-2 py-1 rounded-lg text-xs font-mono transition-colors ${
                softView ? 'bg-[#f8bc61]/20 text-[#f8bc61]' : 'text-[#9ca3af] hover:text-[#f1f4fa]'
              }`}
              title="Soft view"
            >
              Soft
            </button>
          </div>

          {/* User Avatar */}
          <div 
            className="w-8 h-8 rounded-full bg-[#6c8cff] text-[#001e60] font-semibold text-xs flex items-center justify-center shadow-sm select-none"
            title={`Logged in as ${user?.username || 'User'}`}
          >
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>

        {/* Mobile Right: Floated Action Icons (Too much, Park a thought, Quiz, Vibe) */}
        <div className={`
          flex md:hidden items-center gap-1.5 transition-all duration-300 pointer-events-auto
          ${isChatScrolled 
            ? 'fixed top-2.5 right-3 bg-[#16181d]/85 backdrop-blur-xl border border-[#2f343d]/80 shadow-2xl rounded-full p-1.5' 
            : ''
          }
        `}>
          {/* Too Much / Simplify */}
          <button
            type="button"
            onClick={handleTooMuch}
            disabled={isStreaming}
            className="p-1.5 rounded-xl bg-[#1f2229] hover:bg-[#282a2f] border border-[#2f343d] text-[#f8bc61] transition-colors flex items-center justify-center disabled:opacity-50"
            title="Too much! Re-explain shorter & simpler"
          >
            <span className="material-symbols-outlined text-[17px]">energy_savings_leaf</span>
          </button>

          {/* Park a Thought */}
          <button
            type="button"
            onClick={() => setIsParkModalOpen(true)}
            className="p-1.5 rounded-xl bg-[#1f2229] hover:bg-[#282a2f] border border-[#2f343d] text-[#5fd38d] transition-colors flex items-center justify-center relative cursor-pointer"
            title="Park a thought"
          >
            <span className="material-symbols-outlined text-[17px]">bookmark_add</span>
            {parkedThoughts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#5fd38d] text-[#00391d] text-[10px] font-bold flex items-center justify-center font-mono shadow-sm">
                {parkedThoughts.length}
              </span>
            )}
          </button>

          {/* Quiz Checkpoint Button */}
          <button
            type="button"
            onClick={() => requestChallenge(mood, studyMode)}
            disabled={isStreaming}
            className="p-1.5 rounded-xl bg-[#1f2229] hover:bg-[#282a2f] border border-[#f8bc61]/40 text-[#f8bc61] transition-colors flex items-center justify-center disabled:opacity-50"
            title="Trigger an interview checkpoint challenge"
          >
            <span className="material-symbols-outlined text-[17px]">swords</span>
          </button>

          {/* Straw Hat 👒 Vibe & Mood Pop-Up Trigger */}
          <button
            type="button"
            onClick={() => setIsVibeModalOpen(true)}
            className="p-1.5 rounded-xl bg-[#1f2229] hover:bg-[#282a2f] border border-[#2f343d] hover:border-[#f8bc61]/60 transition-colors flex items-center justify-center text-[15px]"
            title="Companion Vibe, Study Mood & Persona"
          >
            <span>👒</span>
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN WORKSPACE BODY */}
      {/* ========================================================= */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Floating Expand Syllabus Button (Shown when collapsed on desktop) */}
        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="hidden md:flex absolute left-0 top-3 z-30 items-center gap-1.5 bg-[#16181d] hover:bg-[#1f2229] border-y border-r border-[#2f343d] hover:border-[#6c8cff]/50 text-[#9ca3af] hover:text-[#6c8cff] py-2 px-2.5 rounded-r-xl shadow-lg transition-all font-mono text-xs"
            title="Expand Syllabus"
          >
            <span className="material-symbols-outlined text-[18px]">last_page</span>
            <span className="hidden sm:inline">Syllabus</span>
          </button>
        )}

        {/* Mobile Drawer Backdrop with smooth fade */}
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300 ease-in-out ${
            sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* SYLLABUS SIDEBAR (Smooth sliding drawer on mobile, collapsible side panel on desktop) */}
        <aside
          className={`
            fixed md:relative inset-y-0 left-0 z-50 md:z-20
            w-72 max-w-[85vw] bg-[#16181d] border-r border-[#2f343d] flex flex-col shrink-0 select-none shadow-2xl md:shadow-none h-full
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}
          `}
        >
            
            {/* Sidebar Header with Collapse Button */}
            <div className="p-3.5 border-b border-[#2f343d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6c8cff] text-[18px]">menu_book</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af] font-mono">
                  Syllabus
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowAddInline(!showAddInline)}
                  className="text-[11px] bg-[#1f2229] hover:bg-[#282a2f] text-[#e8eaed] border border-[#2f343d] px-2 py-1 rounded-lg transition-colors font-mono"
                >
                  + New
                </button>
                <button
                  type="button"
                  onClick={handleGenerateSyllabus}
                  disabled={isGeneratingChapters}
                  title="Generate complete AI curriculum"
                  className="text-[11px] bg-[#6c8cff]/15 hover:bg-[#6c8cff]/25 text-[#6c8cff] border border-[#6c8cff]/30 px-2.5 py-1 rounded-lg transition-colors font-mono disabled:opacity-50"
                >
                  {isGeneratingChapters ? '...' : '✨ AI'}
                </button>

                {/* Collapse Syllabus Button inside Sidebar Header */}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg hover:bg-[#1f2229] text-[#9ca3af] hover:text-[#f1f4fa] transition-colors ml-0.5"
                  title="Close Syllabus"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Curriculum Progress Bar */}
            {chapters.length > 0 && (
              <ProgressBar
                completed={completedCount}
                total={chapters.length}
                percentage={progressPercentage}
              />
            )}

            {/* Inline Add Chapter Form */}
            {showAddInline && (
              <div className="p-2.5 bg-[#1a1b21] border-b border-[#2f343d] flex gap-1.5 animate-fadeIn">
                <input
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="e.g. Memory Layout"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddChapter()
                    if (e.key === 'Escape') setShowAddInline(false)
                  }}
                  className="flex-1 bg-[#111318] border border-[#2f343d] focus:border-[#6c8cff] rounded-lg px-2.5 py-1.5 text-xs text-[#e8eaed] outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddChapter()}
                  className="bg-[#6c8cff] text-[#001e60] font-semibold text-xs px-2.5 py-1.5 rounded-lg"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddInline(false)}
                  className="text-[#9ca3af] hover:text-[#e8eaed] px-1.5 text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Chapters List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 chat-scroll">
              {chapters.length === 0 ? (
                <div className="text-center py-8 px-4 text-[#9ca3af]">
                  <span className="material-symbols-outlined text-3xl mb-1 text-[#6c8cff]/60">auto_stories</span>
                  <p className="text-xs font-semibold text-[#f1f4fa] mb-1">Auto-Generated Syllabus</p>
                  <p className="text-[11px] mb-3 text-[#9ca3af]/80 leading-relaxed">
                    Send your first chat message to automatically generate your tailored syllabus.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateSyllabus}
                    disabled={isGeneratingChapters}
                    className="w-full bg-[#6c8cff]/20 hover:bg-[#6c8cff]/30 text-[#6c8cff] border border-[#6c8cff]/30 font-semibold text-xs py-2 px-3 rounded-xl transition-all shadow-sm"
                  >
                    {isGeneratingChapters ? 'Synthesizing...' : '✨ Generate Now'}
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-mono font-semibold text-[#9ca3af]/70 px-2 py-1 tracking-wider">
                    Core Chapters ({chapters.length})
                  </div>
                  {chapters.map((ch, idx) => {
                    const active = selectedChapter?.id === ch.id
                    const isDone = ch.status === 'completed'
                    const displayTitle = cleanChapterTitle(ch.title)

                    return (
                      <div
                        key={ch.id}
                        onClick={() => handleSelectChapter(ch)}
                        className={`group w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer border ${
                          active
                            ? 'bg-[#6c8cff]/15 text-[#6c8cff] border-[#6c8cff]/40 font-semibold shadow-sm'
                            : 'text-[#9ca3af] hover:bg-[#1f2229] hover:text-[#f1f4fa] border-transparent'
                        }`}
                      >
                        <div className="truncate flex-1 pr-2 flex items-center gap-2 min-w-0">
                          {isDone ? (
                            <span className="material-symbols-outlined text-[15px] text-[#5fd38d]">check_circle</span>
                          ) : active ? (
                            <span className="w-2 h-2 rounded-full bg-[#6c8cff] animate-pulse shrink-0" />
                          ) : (
                            <span className="w-5 text-center font-mono text-[11px] text-[#9ca3af]/70">
                              {idx + 1}
                            </span>
                          )}
                          <span className="truncate">{displayTitle}</span>
                        </div>

                        {/* Minimal delete icon */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteChapter(ch.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#9ca3af] hover:text-[#ffb4ab] rounded transition-all"
                          title="Delete chapter"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    )
                  })}

                  {/* Optional Exploration Modules */}
                  {optionalChapters.length > 0 && (
                    <div className="pt-3 mt-2 border-t border-[#2f343d]">
                      <div className="text-[10px] uppercase font-mono font-semibold text-[#f8bc61] px-2 py-1 tracking-wider flex items-center gap-1">
                        <span>💡</span>
                        <span>Optional Modules ({optionalChapters.length})</span>
                      </div>
                      {optionalChapters.map((title, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleAddChapter(title)}
                          className="w-full text-left px-2.5 py-2 rounded-xl text-[11px] text-[#9ca3af] hover:bg-[#1f2229] hover:text-[#f1f4fa] transition-colors flex items-center justify-between cursor-pointer group"
                        >
                          <span className="truncate flex-1 pr-2">{cleanChapterTitle(title)}</span>
                          <span className="text-xs text-[#5fd38d] font-mono group-hover:inline hidden">+ Add</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Footer Reassurance */}
            <div className="p-3 border-t border-[#2f343d] bg-[#1a1b21] text-[11px] text-[#9ca3af] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#5fd38d] text-[16px]">nature_people</span>
              <span>Self-paced learning</span>
            </div>
          </aside>

        {/* CHAT / ACTIVE LESSON WORKSPACE */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#161920]">
          <ChatWindow
            messages={messages}
            isStreaming={isStreaming}
            isLoadingHistory={isLoadingHistory || isLoadingProject || initialMessages === null}
            onSendMessage={(msg, target) => sendMessage(msg, mood, studyMode, target, difficultyLevel)}
            onStopStreaming={stopStreaming}
            onRequestChallenge={() => requestChallenge(mood, studyMode)}
            onParkThought={() => setIsParkModalOpen(true)}
            onTooMuch={handleTooMuch}
            currentTopic={project?.title || ''}
            currentChapter={selectedChapter ? cleanChapterTitle(selectedChapter.title) : ''}
            currentChapterIndex={selectedIndex >= 0 ? selectedIndex : 0}
            totalChapters={chapters.length || 1}
            error={error}
            isFocusMode={!sidebarOpen}
            onToggleFocusMode={() => setSidebarOpen(!sidebarOpen)}
            onChatScroll={setIsChatScrolled}
            isChatScrolled={isChatScrolled}
            difficultyLevel={difficultyLevel}
            onSelectDifficultyLevel={handleSelectDifficultyLevel}
          />
        </main>
      </div>

      {/* Straw Hat Vibe Settings Modal */}
      <VibeSettingsModal
        isOpen={isVibeModalOpen}
        onClose={() => setIsVibeModalOpen(false)}
        currentMood={mood}
        onSelectMood={setMood}
        studyMode={studyMode}
        onSelectStudyMode={setStudyMode}
        difficultyLevel={difficultyLevel}
        onSelectDifficultyLevel={handleSelectDifficultyLevel}
      />

      {/* Park Thought Modal */}
      <ParkThoughtModal
        isOpen={isParkModalOpen}
        onClose={() => setIsParkModalOpen(false)}
        onSaveThought={handleSaveThought}
        onAskSensei={(prompt) => sendMessage(prompt, mood, studyMode, null, difficultyLevel)}
        currentTopic={selectedChapter?.title || 'General'}
      />
    </div>
  )
}
