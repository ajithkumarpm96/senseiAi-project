import React, { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import ParkThoughtModal from './workspace/ParkThoughtModal'
import SenseiLoader from './common/SenseiLoader'
import { useAppStore } from '../store/appStore'

export default function ChatWindow({
  messages = [],
  isStreaming = false,
  isLoadingHistory = false,
  onSendMessage,
  onStopStreaming,
  onRequestChallenge,
  onParkThought,
  onTooMuch,
  onChatScroll,
  isChatScrolled = false,
  currentTopic = 'this topic',
  currentChapter = '',
  currentChapterIndex = 0,
  totalChapters = 1,
  error = null,
  isFocusMode = false,
  onToggleFocusMode,
  difficultyLevel = 'beginner',
  onSelectDifficultyLevel
}) {
  const [input, setInput] = useState('')
  const [customFocus, setCustomFocus] = useState('')
  const [exploreMenuOpen, setExploreMenuOpen] = useState(false)
  const [isParkModalOpen, setIsParkModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)

  const scrollContainerRef = useRef(null)
  const latestMessageRef = useRef(null)

  // Auto-scroll on new messages
  useEffect(() => {
    if (latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, isStreaming])

  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    if (navigator.vibrate) navigator.vibrate(10)
    onSendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const addParkedThought = useAppStore((state) => state.addParkedThought)
  const parkedThoughts = useAppStore((state) => state.parkedThoughts || [])

  const handleSaveThought = (thought) => {
    addParkedThought(thought, currentChapter || currentTopic || 'General')
    setToastMessage(`Thought parked: "${thought.slice(0, 32)}..."`)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleStartChapter = () => {
    if (isStreaming) return
    const topicName = currentChapter || currentTopic
    if (customFocus.trim()) {
      onSendMessage(
        `Let's start ${topicName}! Specific focus: ${customFocus.trim()}. Please introduce the concepts with intuitive analogies and outline the sequential module roadmap.`
      )
    } else {
      onSendMessage(
        `Let's start ${topicName}! Introduce the core concepts with an intuitive real-world analogy, and show how the mental model works without overwhelming jargon.`
      )
    }
  }

  const promptChips = [
    'Why does this pattern matter in practice?',
    'Show 3-question self test to check my intuition',
    'What are the most common beginner traps here?',
    'Break this down into tiny mental steps',
  ]

  const progressFraction = totalChapters > 0 ? (currentChapterIndex + 1) / totalChapters : 0.33
  const estimatedMinsLeft = Math.max(5, (totalChapters - currentChapterIndex) * 5)

  return (
    <div className="flex flex-col h-full bg-[#161920] text-[#c8cdd8] relative overflow-hidden">
      
      {/* Toast Notification for Parked Thoughts */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#1f2229] border border-[#5fd38d] text-[#e8eaed] px-4 py-2 rounded-xl flex items-center gap-2 shadow-2xl animate-slideDown">
          <span className="material-symbols-outlined text-[#5fd38d] text-[18px]">check_circle</span>
          <span className="text-xs font-mono">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* PERSISTENT "WHERE AM I" PROGRESS STRIP (Stitch Spec) */}
      {/* ========================================================= */}
      <div className={`
        w-full bg-[#16181d] border-b border-[#2f343d] px-3 sm:px-6 shrink-0 z-10 shadow-sm transition-all duration-300 ease-in-out
        ${isChatScrolled 
          ? 'max-md:h-0 max-md:py-0 max-md:opacity-0 max-md:overflow-hidden max-md:border-b-0 py-1.5 sm:py-2.5' 
          : 'py-1.5 sm:py-2.5'
        }
      `}>
        <div className="max-w-5xl xl:max-w-6xl mx-auto flex flex-col gap-1 sm:gap-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            {/* Active Lesson & Duration */}
            <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[11px] sm:text-xs">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#6c8cff] animate-pulse" />
              <span className="font-semibold text-[#f1f4fa]">
                Lesson {currentChapterIndex + 1} of {Math.max(1, totalChapters)}
              </span>
              <span className="text-[#4b515d]">·</span>
              <span className="text-[#9ca3af] flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] sm:text-[14px]">schedule</span>
                <span>~{estimatedMinsLeft} min left</span>
              </span>
              <span className="text-[#4b515d]">·</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                difficultyLevel === 'advanced'
                  ? 'bg-[#6c8cff]/15 border-[#6c8cff]/40 text-[#6c8cff]'
                  : difficultyLevel === 'intermediate'
                  ? 'bg-[#f8bc61]/15 border-[#f8bc61]/40 text-[#f8bc61]'
                  : 'bg-[#5fd38d]/15 border-[#5fd38d]/40 text-[#5fd38d]'
              }`}>
                {difficultyLevel === 'advanced' ? 'Advanced' : difficultyLevel === 'intermediate' ? 'Intermediate' : 'Beginner'}
              </span>
            </div>

            {/* Desktop Utility Actions (Hidden on mobile since they are floated at the top header) */}
            <div className="hidden md:flex items-center gap-1.5">
              {/* Focus Mode Toggle */}
              {onToggleFocusMode && (
                <button
                  type="button"
                  onClick={onToggleFocusMode}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors ${
                    isFocusMode
                      ? 'bg-[#6c8cff]/20 border-[#6c8cff] text-[#6c8cff]'
                      : 'bg-[#1f2229] border-[#2f343d] text-[#9ca3af] hover:text-[#e8eaed] hover:bg-[#282a2f]'
                  }`}
                  title="Toggle distraction-free canvas"
                >
                  <span className="material-symbols-outlined text-[15px]">filter_center_focus</span>
                  <span>{isFocusMode ? 'Normal View' : 'Focus Mode'}</span>
                </button>
              )}

              {/* Quiz Checkpoint Button */}
              {onRequestChallenge && (
                <button
                  type="button"
                  onClick={() => onRequestChallenge?.()}
                  disabled={isStreaming}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1f2229] hover:bg-[#282a2f] border border-[#f8bc61]/40 hover:border-[#f8bc61] text-xs font-mono text-[#f8bc61] transition-all shadow-sm group disabled:opacity-50"
                  title="Trigger an interview checkpoint quiz challenge"
                >
                  <span className="material-symbols-outlined text-[15px] group-hover:rotate-12 transition-transform">swords</span>
                  <span>Quiz</span>
                </button>
              )}

              {/* Park a Thought */}
              <button
                type="button"
                onClick={() => (onParkThought ? onParkThought() : setIsParkModalOpen(true))}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1f2229] hover:bg-[#282a2f] border border-[#2f343d] text-xs font-mono text-[#5fd38d] transition-colors cursor-pointer"
                title="Offload tangents without breaking focus"
              >
                <span className="material-symbols-outlined text-[15px]">bookmark_add</span>
                <span>Park a thought</span>
                {parkedThoughts.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#5fd38d]/20 text-[#5fd38d] text-[10px] font-bold">
                    {parkedThoughts.length}
                  </span>
                )}
              </button>

              {/* Too Much / Simplify */}
              <button
                type="button"
                onClick={() =>
                  onTooMuch
                    ? onTooMuch()
                    : onSendMessage('Too much! Please re-explain this shorter, simpler, and with zero jargon.')
                }
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1f2229] hover:bg-[#282a2f] border border-[#2f343d] text-xs font-mono text-[#f8bc61] transition-colors"
                title="Re-explain shorter and simpler"
              >
                <span className="material-symbols-outlined text-[15px]">energy_savings_leaf</span>
                <span>Too much</span>
              </button>
            </div>
          </div>

          {/* Chunky Calm Progress Rail */}
          <div className="w-full bg-[#282a2f] h-1 sm:h-1.5 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-[#6c8cff] rounded-full transition-all duration-500" 
              style={{ width: `${Math.round(progressFraction * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MESSAGES SCROLL AREA (Centered Claude-Style Canvas) */}
      {/* ========================================================= */}
      <div 
        ref={scrollContainerRef} 
        onScroll={(e) => {
          const el = e.currentTarget
          if (onChatScroll) {
            onChatScroll(el.scrollTop > 25)
          }
          const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
          setShowScrollToBottom(distFromBottom > 160)
        }}
        onTouchMove={() => {
          if (document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')) {
            document.activeElement.blur()
          }
        }}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-28 sm:pb-36 chat-scroll"
      >
        {isLoadingHistory ? (
          <div className="h-full min-h-[50vh] flex flex-col items-center justify-center">
            <SenseiLoader size={100} />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-[620px] mx-auto py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#1f2229] border border-[#2f343d] flex items-center justify-center text-2xl mb-3 shadow-md">
              🎓
            </div>
            <h2 className="text-lg font-bold text-[#f1f4fa] mb-1">
              Sensei Focus Workspace
            </h2>
            <p className="text-xs sm:text-sm text-[#9ca3af] mb-5">
              Exploring <strong className="text-[#6c8cff]">{currentChapter || currentTopic}</strong> with zero pressure.
            </p>

            {/* Knowledge Level Selector (Beginner Default) */}
            <div className="w-full bg-[#16181d] border border-[#2f343d] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-3.5 mb-5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#9ca3af] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-[#6c8cff]">tune</span>
                  <span>Your Current Knowledge Level</span>
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#6c8cff]/15 text-[#6c8cff] border border-[#6c8cff]/30">
                  {difficultyLevel === 'advanced' ? 'Advanced' : difficultyLevel === 'intermediate' ? 'Intermediate' : 'Beginner (Default)'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onSelectDifficultyLevel && onSelectDifficultyLevel('beginner')}
                  className={`py-2 px-2.5 rounded-xl border text-left transition-all flex flex-col gap-0.5 cursor-pointer ${
                    difficultyLevel === 'beginner'
                      ? 'bg-[#183e28]/50 border-[#5fd38d] text-[#5fd38d] shadow-sm'
                      : 'bg-[#1a1b21] border-[#2f343d] text-[#9ca3af] hover:text-[#e8eaed] hover:bg-[#1f2229]'
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-semibold">
                    <span>🟢</span>
                    <span>Beginner</span>
                  </div>
                  <span className="text-[10px] opacity-75 leading-tight">From scratch</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectDifficultyLevel && onSelectDifficultyLevel('intermediate')}
                  className={`py-2 px-2.5 rounded-xl border text-left transition-all flex flex-col gap-0.5 cursor-pointer ${
                    difficultyLevel === 'intermediate'
                      ? 'bg-[#f8bc61]/15 border-[#f8bc61] text-[#f8bc61] shadow-sm'
                      : 'bg-[#1a1b21] border-[#2f343d] text-[#9ca3af] hover:text-[#e8eaed] hover:bg-[#1f2229]'
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-semibold">
                    <span>🟡</span>
                    <span>Intermediate</span>
                  </div>
                  <span className="text-[10px] opacity-75 leading-tight">Know basics</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectDifficultyLevel && onSelectDifficultyLevel('advanced')}
                  className={`py-2 px-2.5 rounded-xl border text-left transition-all flex flex-col gap-0.5 cursor-pointer ${
                    difficultyLevel === 'advanced'
                      ? 'bg-[#6c8cff]/15 border-[#6c8cff] text-[#6c8cff] shadow-sm'
                      : 'bg-[#1a1b21] border-[#2f343d] text-[#9ca3af] hover:text-[#e8eaed] hover:bg-[#1f2229]'
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-semibold">
                    <span>🔴</span>
                    <span>Advanced</span>
                  </div>
                  <span className="text-[10px] opacity-75 leading-tight">Internals &amp; perf</span>
                </button>
              </div>

              <p className="text-[11px] text-[#9ca3af] bg-[#1a1b21] p-2.5 rounded-xl border border-[#2f343d]/60 leading-relaxed">
                {difficultyLevel === 'advanced'
                  ? '🚀 Advanced: Sensei skips the basics and dives straight into runtime internals, memory layout, concurrency mechanics, and edge cases.'
                  : difficultyLevel === 'intermediate'
                  ? '⚡ Intermediate: Focuses on idiomatic patterns, component composition, real-world workflows, and architecture.'
                  : '🌱 Beginner (Recommended): Starts from absolute zero with relatable physical analogies, crystal-clear step-by-step fundamentals, and zero assumed jargon.'
                }
              </p>

              {/* Start button & Optional focus */}
              <button
                type="button"
                onClick={handleStartChapter}
                disabled={isStreaming}
                className="w-full h-12 bg-[#6c8cff] hover:bg-[#809cff] active:scale-[0.99] text-[#001e60] font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
              >
                <span>Let's Start</span>
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              </button>

              <div>
                <input
                  type="text"
                  value={customFocus}
                  onChange={(e) => setCustomFocus(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleStartChapter()
                    }
                  }}
                  placeholder='Optional focus: "focus on practical web APIs", etc.'
                  className="w-full bg-[#1a1b21] border border-[#2f343d] focus:border-[#6c8cff] rounded-xl px-3.5 py-2 text-xs text-[#e8eaed] placeholder-[#9ca3af]/50 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Starter Levers */}
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => onSendMessage(`Explain ${currentChapter || currentTopic} like I am 10 years old with a real-world visual analogy`)}
                className="text-xs bg-[#1a1b21] hover:bg-[#1f2229] text-[#6c8cff] border border-[#2f343d] rounded-full px-3.5 py-1.5 transition-colors"
              >
                💡 Explain with an analogy
              </button>
              <button
                type="button"
                onClick={() => onSendMessage(`Give me a clean, short code example of ${currentChapter || currentTopic}`)}
                className="text-xs bg-[#1a1b21] hover:bg-[#1f2229] text-[#5fd38d] border border-[#2f343d] rounded-full px-3.5 py-1.5 transition-colors"
              >
                💻 Clean code example
              </button>
              <button
                type="button"
                onClick={() => onSendMessage(`What are the common beginner pitfalls with ${currentChapter || currentTopic}?`)}
                className="text-xs bg-[#1a1b21] hover:bg-[#1f2229] text-[#f8bc61] border border-[#2f343d] rounded-full px-3.5 py-1.5 transition-colors"
              >
                ⚠️ Common pitfalls
              </button>
              {onRequestChallenge && (
                <button
                  type="button"
                  onClick={() => onRequestChallenge?.()}
                  disabled={isStreaming}
                  className="text-xs bg-[#1f2229] hover:bg-[#282a2f] text-[#f8bc61] border border-[#f8bc61]/40 hover:border-[#f8bc61] rounded-full px-3.5 py-1.5 transition-colors flex items-center gap-1.5 font-mono disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[15px]">swords</span>
                  <span>Quiz Checkpoint</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {(() => {
              let latestAssistantIdx = -1
              for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].role !== 'user') {
                  latestAssistantIdx = i
                  break
                }
              }

              return messages.map((m, idx) => {
                const isLast = idx === messages.length - 1
                const isLatest = idx === latestAssistantIdx
                const messageId = m.id ? `msg-${m.id}` : `msg-${idx}`
                return (
                  <div
                    key={m.id || idx}
                    ref={isLast ? latestMessageRef : null}
                    className="transition-all"
                  >
                    <MessageBubble
                      message={m}
                      messageId={messageId}
                      onSendMessage={onSendMessage}
                      onParkThought={handleSaveThought}
                      isStreaming={isStreaming && isLast}
                      isLatest={isLatest}
                    />
                  </div>
                )
              })
            })()}
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="max-w-5xl xl:max-w-6xl mx-auto p-3.5 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/40 text-[#ffdad6] text-xs flex items-center justify-between gap-3 mt-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => onSendMessage('Retry previous message')}
              className="underline hover:text-white font-mono"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* PINNED BOTTOM INTERACTION DOCK (Stitch Spec) */}
      {/* ========================================================= */}
      <div className="absolute bottom-0 left-0 right-0 z-30 px-3 sm:px-6 pb-2.5 sm:pb-4 pt-3 sm:pt-6 bg-gradient-to-t from-[#161920] via-[#161920]/95 to-transparent flex flex-col items-center pointer-events-none">
        <div className="w-full max-w-5xl xl:max-w-6xl flex flex-col gap-2 pointer-events-auto">
          
          {/* Desktop Prompt Steer Chips */}
          <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-mono text-[#9ca3af] flex items-center gap-1 select-none shrink-0">
              <span className="material-symbols-outlined text-[13px] text-[#6c8cff]">bolt</span>
              <span>Explore:</span>
            </span>

            {/* Quick Quiz Checkpoint Chip */}
            {onRequestChallenge && (
              <button
                type="button"
                onClick={() => onRequestChallenge?.()}
                disabled={isStreaming}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-[#1f2229] hover:bg-[#282a2f] border border-[#f8bc61]/40 hover:border-[#f8bc61] text-[#f8bc61] text-xs font-mono transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[14px]">swords</span>
                <span>Quiz Checkpoint</span>
              </button>
            )}

            {promptChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setInput(chip)
                }}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-[#1a1b21] hover:bg-[#1f2229] border border-[#2f343d] hover:border-[#6c8cff]/50 text-xs text-[#9ca3af] hover:text-[#e8eaed] transition-colors flex items-center gap-1 shrink-0 font-mono"
              >
                <span>"{chip}"</span>
                <span className="material-symbols-outlined text-[13px] text-[#4b515d]">north_east</span>
              </button>
            ))}
          </div>

          {/* Main Input Tray */}
          <div className="relative bg-[#16181d] rounded-xl sm:rounded-2xl border border-[#2f343d] focus-within:border-[#6c8cff] transition-all p-1.5 sm:p-2 flex flex-col shadow-2xl">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Sensei to clarify, simplify, or test your intuition..."
              className="w-full bg-transparent px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-[#e8eaed] placeholder-[#9ca3af]/50 outline-none resize-none leading-relaxed max-h-24"
            />

            <div className="flex items-center justify-between pt-1 px-1.5 sm:px-2 border-t border-[#2f343d]/40">
              {/* Mobile Explore Prompts Button (inside tray footer) */}
              <div className="relative md:hidden">
                <button
                  type="button"
                  onClick={() => setExploreMenuOpen((prev) => !prev)}
                  className="p-1 rounded-lg text-[#6c8cff] hover:bg-[#1f2229] transition-colors flex items-center justify-center"
                  title="Explore Prompts"
                >
                  <span className="material-symbols-outlined text-[17px]">bolt</span>
                </button>

                {exploreMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setExploreMenuOpen(false)} 
                    />
                    <div className="absolute bottom-full left-0 mb-2 w-72 max-w-[88vw] bg-[#1a1b21] border border-[#2f343d] rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 animate-fadeIn">
                      <div className="text-[10px] font-mono text-[#9ca3af] px-2 py-1 uppercase tracking-wider flex items-center gap-1 border-b border-[#2f343d]/50 pb-1 mb-0.5">
                        <span className="material-symbols-outlined text-[13px] text-[#6c8cff]">bolt</span>
                        <span>Explore Prompts</span>
                      </div>
                      {onRequestChallenge && (
                        <button
                          type="button"
                          onClick={() => {
                            setExploreMenuOpen(false)
                            onRequestChallenge()
                          }}
                          disabled={isStreaming}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-mono text-[#f8bc61] hover:bg-[#1f2229] transition-colors flex items-center gap-2 border border-[#f8bc61]/20 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[15px]">swords</span>
                          <span>Quiz Checkpoint</span>
                        </button>
                      )}
                      {promptChips.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            setInput(chip)
                            setExploreMenuOpen(false)
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-[#c8cdd8] hover:bg-[#1f2229] hover:text-[#f1f4fa] transition-colors flex items-center justify-between group font-mono"
                        >
                          <span className="truncate">{chip}</span>
                          <span className="material-symbols-outlined text-[13px] text-[#4b515d] group-hover:text-[#6c8cff] shrink-0 ml-1">north_east</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="hidden md:block" />
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={onStopStreaming}
                    className="flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-[#93000a]/30 hover:bg-[#93000a]/50 text-[#ffb4ab] border border-[#ffb4ab]/40 text-xs font-semibold transition-all"
                  >
                    <span className="material-symbols-outlined text-[15px] sm:text-[16px]">stop</span>
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl bg-[#6c8cff] hover:bg-[#809cff] disabled:opacity-40 text-[#001e60] text-xs font-semibold transition-all shadow-sm active:scale-95"
                  >
                    <span>Send</span>
                    <span className="material-symbols-outlined text-[15px] sm:text-[16px]">send</span>
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Jump to Latest Pill */}
      {showScrollToBottom && (
        <button
          type="button"
          onClick={() => {
            scrollContainerRef.current?.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: 'smooth'
            })
          }}
          className="fixed bottom-20 sm:bottom-28 right-4 sm:right-8 z-40 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#16181d]/90 hover:bg-[#1f2229] text-[#6c8cff] border border-[#6c8cff]/50 shadow-2xl backdrop-blur-md text-xs font-semibold animate-fadeIn transition-all active:scale-95 cursor-pointer"
          title="Scroll to latest message"
        >
          <span className="material-symbols-outlined text-[15px]">arrow_downward</span>
          <span>Latest</span>
        </button>
      )}

      {/* Floating Thought Parked Toast */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#16181d]/95 border border-[#5fd38d]/50 text-[#5fd38d] px-4 py-2 rounded-full shadow-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn backdrop-blur-md">
          <span className="material-symbols-outlined text-[16px]">bookmark_add</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Park Thought Modal */}
      <ParkThoughtModal
        isOpen={isParkModalOpen}
        onClose={() => setIsParkModalOpen(false)}
        onSaveThought={handleSaveThought}
        onAskSensei={onSendMessage}
        currentTopic={currentChapter || currentTopic || 'General'}
      />
    </div>
  )
}
