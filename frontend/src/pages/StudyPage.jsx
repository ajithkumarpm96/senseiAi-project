import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAppStore } from '../store/appStore'
import { useChat } from '../hooks/useChat'
import ChatWindow from '../components/ChatWindow'
import ProgressBar from '../components/ProgressBar'
import VibeSettingsModal from '../components/workspace/VibeSettingsModal'

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
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [showAddInline, setShowAddInline] = useState(false)
  const [isGeneratingChapters, setIsGeneratingChapters] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isVibeModalOpen, setIsVibeModalOpen] = useState(false)

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    requestChallenge,
    stopStreaming
  } = useChat(projectId, selectedChapter?.id)

  useEffect(() => {
    loadProjectAndChapters()
  }, [projectId])

  const loadProjectAndChapters = async () => {
    try {
      const [projRes, chapRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/chapters`)
      ])
      setProject(projRes.data)
      setChapters(chapRes.data)

      // Restore previously selected chapter from localStorage
      const savedChapId = localStorage.getItem(`sensei_active_chapter_${projectId}`)
      const found = savedChapId ? chapRes.data.find((c) => String(c.id) === String(savedChapId)) : null
      const toSelect = found || (chapRes.data.length > 0 ? chapRes.data[0] : null)
      setSelectedChapter(toSelect)
    } catch (err) {
      console.error('Error loading project details', err)
    }
  }

  const handleSelectChapter = (ch) => {
    setSelectedChapter(ch)
    if (ch?.id) {
      localStorage.setItem(`sensei_active_chapter_${projectId}`, String(ch.id))
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

  return (
    <div className={`h-screen flex flex-col bg-[#161920] text-[#c8cdd8] overflow-hidden ${softView ? 'soft-view-mode' : ''} ${textScale === 'large' ? 'text-scale-large' : ''}`}>
      
      {/* ========================================================= */}
      {/* TOP WORKSPACE HEADER (Stitch Standard) */}
      {/* ========================================================= */}
      <header className="h-16 bg-[#16181d] border-b border-[#2f343d] flex items-center justify-between px-4 sm:px-6 shrink-0 z-30">
        
        {/* Left: Back Link & Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
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

        {/* Right: Straw Hat (Luffy) Vibe Button & Sensory Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Straw Hat 👒 Vibe & Mood Pop-Up Trigger */}
          <button
            type="button"
            onClick={() => setIsVibeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1f2229] hover:bg-[#282a2f] border border-[#2f343d] hover:border-[#f8bc61]/60 text-xs text-[#e8eaed] transition-all shadow-sm group"
            title="Companion Vibe, Study Mood & Persona"
          >
            <span className="text-base group-hover:scale-110 transition-transform select-none">👒</span>
            <span className="hidden md:inline font-mono text-[#f8bc61]">Vibe</span>
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
            <span className="hidden sm:inline font-mono">Quiz</span>
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
      </header>

      {/* ========================================================= */}
      {/* MAIN WORKSPACE BODY */}
      {/* ========================================================= */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Floating Expand Syllabus Button (Shown when collapsed) */}
        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="absolute left-0 top-3 z-30 flex items-center gap-1.5 bg-[#16181d] hover:bg-[#1f2229] border-y border-r border-[#2f343d] hover:border-[#6c8cff]/50 text-[#9ca3af] hover:text-[#6c8cff] py-2 px-2.5 rounded-r-xl shadow-lg transition-all font-mono text-xs"
            title="Expand Syllabus"
          >
            <span className="material-symbols-outlined text-[18px]">last_page</span>
            <span className="hidden sm:inline">Syllabus</span>
          </button>
        )}

        {/* SYLLABUS SIDEBAR (Redesigned to Cognitive Sanctuary) */}
        {sidebarOpen && (
          <aside className="w-64 sm:w-72 bg-[#16181d] border-r border-[#2f343d] flex flex-col shrink-0 z-20 transition-all select-none">
            
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
                  title="Collapse Syllabus"
                >
                  <span className="material-symbols-outlined text-[18px]">first_page</span>
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
                  <p className="text-xs mb-3">No chapters created yet.</p>
                  <button
                    type="button"
                    onClick={handleGenerateSyllabus}
                    disabled={isGeneratingChapters}
                    className="w-full bg-[#6c8cff] hover:bg-[#809cff] text-[#001e60] font-semibold text-xs py-2 px-3 rounded-xl transition-all shadow-sm"
                  >
                    {isGeneratingChapters ? 'Synthesizing...' : '✨ Generate AI Syllabus'}
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
        )}

        {/* CHAT / ACTIVE LESSON WORKSPACE */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#161920]">
          <ChatWindow
            messages={messages}
            isStreaming={isStreaming}
            onSendMessage={(msg, target) => sendMessage(msg, mood, studyMode, target)}
            onStopStreaming={stopStreaming}
            onRequestChallenge={() => requestChallenge(mood, studyMode)}
            currentTopic={project?.title || ''}
            currentChapter={selectedChapter ? cleanChapterTitle(selectedChapter.title) : ''}
            currentChapterIndex={selectedIndex >= 0 ? selectedIndex : 0}
            totalChapters={chapters.length || 1}
            error={error}
            isFocusMode={!sidebarOpen}
            onToggleFocusMode={() => setSidebarOpen(!sidebarOpen)}
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
      />
    </div>
  )
}
