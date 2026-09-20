import React, { useState, useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAppStore } from '../store/appStore'
import AgentThoughtTrace from './AgentThoughtTrace'
import ClaudeLoadingIndicator from './ClaudeLoadingIndicator'
import QuizCard from './QuizCard'

export function tryRepairJson(jsonStr) {
  if (!jsonStr || typeof jsonStr !== 'string') return null
  let s = jsonStr.trim()

  try {
    return JSON.parse(s)
  } catch (e) {
    // Proceed to repair
  }

  s = s.replace(/\\+$/, '')

  let inString = false
  let escaped = false
  const stack = []

  for (let i = 0; i < s.length; i++) {
    const char = s[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char)
      } else if (char === '}') {
        if (stack[stack.length - 1] === '{') stack.pop()
      } else if (char === ']') {
        if (stack[stack.length - 1] === '[') stack.pop()
      }
    }
  }

  if (inString) {
    s += '"'
  }

  s = s.replace(/,\s*$/, '')

  while (stack.length > 0) {
    const openChar = stack.pop()
    if (openChar === '{') s += '}'
    else if (openChar === '[') s += ']'
  }

  try {
    return JSON.parse(s)
  } catch (e) {
    return null
  }
}

export function normalizeQuizData(data) {
  if (!data || typeof data !== 'object') return null

  const question = data.question || data.prompt || ''
  const code = data.code || ''
  const rawOptions = data.options || data.choices || []

  const options = Array.isArray(rawOptions)
    ? rawOptions.map((opt, idx) => {
        const defaultId = String.fromCharCode(65 + idx)
        if (typeof opt === 'string') {
          const match = opt.match(/^([A-Da-d0-9])[\.\)\:\-]\s*(.+)$/)
          if (match) {
            return { id: match[1].toUpperCase(), text: match[2].trim() }
          }
          return { id: defaultId, text: opt.trim() }
        }
        if (typeof opt === 'object' && opt !== null) {
          return {
            id: String(opt.id || opt.key || defaultId).toUpperCase(),
            text: String(opt.text || opt.label || opt.option || opt.value || '').trim()
          }
        }
        return { id: defaultId, text: String(opt) }
      })
    : []

  let correct = String(data.correct || data.answer || data.correct_answer || 'A').trim()
  const correctMatch = correct.match(/([A-Da-d])/i)
  if (correctMatch) {
    correct = correctMatch[1].toUpperCase()
  } else if (!isNaN(parseInt(correct))) {
    const num = parseInt(correct)
    correct = String.fromCharCode(65 + (num > 0 && num <= 4 ? num - 1 : num))
  }

  const explanation = data.explanation || data.breakdown || data.why || ''
  const hint = data.hint || ''

  return {
    question,
    code,
    options,
    correct,
    explanation,
    hint
  }
}

export function parseQuizMessage(content) {
  if (!content || typeof content !== 'string') {
    return { hasQuiz: false, intro: '', quizData: null, outro: '' }
  }

  const hasQuizHints =
    content.includes('"question"') ||
    content.includes('"options"') ||
    content.includes('```quiz')

  if (!hasQuizHints) {
    return { hasQuiz: false, intro: content, quizData: null, outro: '' }
  }

  // 1. Try markdown fenced block: ```quiz ... ``` or ```json ... ```
  const fencedRegex = /```(?:quiz|json)?\s*([\s\S]*?)(?:```|$)/i
  const fencedMatch = content.match(fencedRegex)

  if (fencedMatch && fencedMatch[1]) {
    const candidate = fencedMatch[1].trim()
    if (candidate.includes('"question"') || candidate.includes('"options"')) {
      const parsed = tryRepairJson(candidate)
      if (parsed && (parsed.question || parsed.prompt) && (parsed.options || parsed.choices)) {
        const intro = content.slice(0, fencedMatch.index).trim()
        const outroIndex = fencedMatch.index + fencedMatch[0].length
        const outro = content.slice(outroIndex).trim()
        return {
          hasQuiz: true,
          intro,
          quizData: normalizeQuizData(parsed),
          outro
        }
      }
    }
  }

  // 2. Try raw JSON object embedded in text: from first '{' containing "question"
  const jsonStart = content.indexOf('{')
  if (jsonStart !== -1) {
    const tailCandidate = content.slice(jsonStart)
    const jsonEnd = content.lastIndexOf('}')

    let parsed = tryRepairJson(tailCandidate)
    let outro = ''

    if (!parsed && jsonEnd > jsonStart) {
      const usedCandidate = content.slice(jsonStart, jsonEnd + 1)
      parsed = tryRepairJson(usedCandidate)
      outro = content.slice(jsonEnd + 1).trim()
    }

    if (parsed && (parsed.question || parsed.prompt) && (parsed.options || parsed.choices)) {
      const intro = content.slice(0, jsonStart).trim()
      return {
        hasQuiz: true,
        intro,
        quizData: normalizeQuizData(parsed),
        outro
      }
    }
  }

  return { hasQuiz: false, intro: content, quizData: null, outro: '' }
}

export const parseModules = (rawText) => {
  const lines = String(rawText).replace(/\n$/, '').split('\n').map((l) => l.trim()).filter(Boolean)
  const list = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.includes('|')) {
      const parts = line.split('|').map((s) => s.trim())
      const numRaw = parts[0].replace(/[^0-9]/g, '') || String(i + 1)
      const title = parts[1] || `Module ${numRaw}`
      const desc = parts.slice(2).join(' | ') || ''
      list.push({ num: numRaw, title, desc })
    } else {
      const match = line.match(/^(\d+)[\.\)]?\s*[:\-–]?\s*([^:\-–]+)(?:[:\-–]\s*(.+))?$/)
      if (match) {
        list.push({
          num: match[1] || String(i + 1),
          title: match[2].trim(),
          desc: (match[3] || '').trim()
        })
      } else {
        list.push({
          num: String(i + 1),
          title: line.replace(/^\d+[\.\)]?\s*/, ''),
          desc: ''
        })
      }
    }
  }
  return list
}

const normalizeMessageContent = (content) => {
  if (!content) return ''
  if (content.includes('```modules')) return content

  const roadmapRegex = /(?:###?|##)\s*(?:🗺️|📋|🎯)?\s*(?:Chapter\s*(?:Roadmap|Modules|Curriculum)|Modules\s*Roadmap)[\s\S]*?(?=(?:\n\s*###|\n\s*##|\n\s*\*\*Next|\n\s*Ready to start|\n\s*Let's start|$))/i
  const match = content.match(roadmapRegex)
  if (match) {
    const roadmapSection = match[0]
    const lines = roadmapSection.split('\n')
    const moduleLines = []
    for (const line of lines) {
      const itemMatch = line.match(/^\s*(\d+)[\.\)]\s*(?:\*\*)?([^*\n|]+)(?:\*\*)?\s*[:|–\-]\s*(.+)$/)
      if (itemMatch) {
        moduleLines.push(`${itemMatch[1]} | ${itemMatch[2].trim()} | ${itemMatch[3].trim()}`)
      }
    }
    if (moduleLines.length >= 2) {
      const moduleBlock = `\n\`\`\`modules\n${moduleLines.join('\n')}\n\`\`\`\n`
      content = content.replace(roadmapSection, moduleBlock)
    }
  }

  // Auto-close unclosed code block if followed by markdown headers/dividers
  if (content.includes('```')) {
    const fenceCount = (content.match(/```/g) || []).length
    if (fenceCount % 2 !== 0) {
      const headerIndex = content.search(/\n(?:\s*---|\s*###|\s*##|\s*Let's test)/i)
      if (headerIndex !== -1) {
        content = content.slice(0, headerIndex) + '\n```\n' + content.slice(headerIndex)
      } else {
        content = content + '\n```\n'
      }
    }
  }

  return content
}

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false)
  const lines = (code || '').trim().split('\n')
  const isLong = lines.length > 10
  const [isExpanded, setIsExpanded] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col bg-[#1a1b21] rounded-xl border border-[#2f343d] overflow-hidden my-3 not-prose shadow-sm font-sans">
      {/* Clean Minimal Code Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1f2229] border-b border-[#2f343d]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[#9ca3af] font-medium tracking-wide">
            {language || 'code'}
          </span>
          {isLong && (
            <span className="text-[10px] font-mono text-[#6c8cff] bg-[#6c8cff]/10 px-1.5 py-0.5 rounded">
              {lines.length} lines
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-[#282a2f] text-[#9ca3af] hover:text-[#e8eaed] font-mono text-xs transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-[#5fd38d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[#5fd38d]">Copied</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content - Collapsible if > 10 lines */}
      <div className={`relative ${isLong && !isExpanded ? 'max-h-40 overflow-hidden' : ''}`}>
        <pre className="p-4 overflow-x-auto font-mono text-xs leading-relaxed text-[#e8eaed] select-text">
          <code className="font-mono">{code}</code>
        </pre>

        {isLong && !isExpanded && (
          <div className="absolute inset-x-0 bottom-0 pt-12 pb-2.5 bg-gradient-to-t from-[#1a1b21] via-[#1a1b21]/90 to-transparent flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="px-3.5 py-1 rounded-full bg-[#242832] hover:bg-[#2e3340] text-[#6c8cff] text-xs font-mono font-medium border border-[#6c8cff]/40 shadow-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <span>Show code ({lines.length} lines)</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
          </div>
        )}
      </div>

      {isLong && isExpanded && (
        <div className="flex justify-end px-3 py-1.5 bg-[#1f2229]/60 border-t border-[#2f343d]">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-[11px] font-mono text-[#9ca3af] hover:text-[#e8eaed] flex items-center gap-0.5 transition-colors cursor-pointer"
          >
            <span>Collapse snippet</span>
            <span className="material-symbols-outlined text-[14px]">expand_less</span>
          </button>
        </div>
      )}
    </div>
  )
}

// Bionic Reading Helper: Bolds the first part of each word
const formatBionicText = (text) => {
  if (typeof text !== 'string') return text
  const parts = text.split(/(\s+)/)
  return parts.map((part, idx) => {
    if (!part || /^\s+$/.test(part)) return part
    const match = part.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9]+)([^a-zA-Z0-9]*)$/)
    if (!match) return part
    const [_, lead, word, trail] = match
    const mid = Math.ceil(word.length * (word.length <= 3 ? 0.35 : 0.45)) || 1
    return (
      <React.Fragment key={idx}>
        {lead}
        <strong className="font-bold text-[#f1f4fa]">{word.slice(0, mid)}</strong>
        {word.slice(mid)}
        {trail}
      </React.Fragment>
    )
  })
}

const renderBionicChildren = (children) => {
  if (typeof children === 'string') return formatBionicText(children)
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') {
        return <React.Fragment key={i}>{formatBionicText(child)}</React.Fragment>
      }
      return child
    })
  }
  return children
}

export default function MessageBubble({
  message,
  messageId,
  onSendMessage,
  onParkThought,
  isStreaming,
  isHighlighted = false,
  isLatest = false
}) {
  const isUser = message.role === 'user'
  const isChallenger = message.role === 'challenger'
  const [copiedFeedback, setCopiedFeedback] = useState(false)
  const [showDeepDive, setShowDeepDive] = useState(false)
  const [showMobileLevers, setShowMobileLevers] = useState(false)
  const dyslexicFont = useAppStore((state) => state.dyslexicFont)
  const bionicReading = useAppStore((state) => state.bionicReading)
  const focusedParagraphId = useAppStore((state) => state.focusedParagraphId)
  const setFocusedParagraphId = useAppStore((state) => state.setFocusedParagraphId)

  const lastTapRef = useRef(0)
  const handleDoubleTap = () => {
    if (isUser) return
    const now = Date.now()
    if (now - lastTapRef.current < 320) {
      if (navigator.vibrate) navigator.vibrate([15, 30, 15])
      const snippet = (message.content || '').replace(/[#*`_]/g, '').slice(0, 120).trim()
      if (onParkThought && snippet) {
        onParkThought(snippet)
      }
    }
    lastTapRef.current = now
  }

  const quizInfo = useMemo(() => {
    if (message.quizData) {
      return { hasQuiz: true, intro: '', quizData: normalizeQuizData(message.quizData), outro: '' }
    }
    return parseQuizMessage(message.content || '')
  }, [message.content, message.quizData])

  const processedContent = normalizeMessageContent(message.content || '')

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content || '')
    setCopiedFeedback(true)
    setTimeout(() => setCopiedFeedback(false), 1800)
  }

  // USER INTENT PROMPT BLOCK (Stitch Design)
  if (isUser) {
    return (
      <div id={messageId} className="w-full max-w-5xl xl:max-w-6xl mx-auto my-5">
        <section className="bg-[#1e222b] rounded-2xl p-5 sm:p-6 border border-[#2f343d] hover:border-[#4b515d] transition-colors shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#939aa8]">
              You
            </span>
            <span className="font-mono text-xs text-[#6c8cff] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">psychology</span>
              Mental Model Session
            </span>
          </div>
          <p className={`text-sm sm:text-base text-[#c8cdd8] leading-relaxed ${dyslexicFont ? 'font-dyslexic-content' : ''}`}>
            {message.content}
          </p>
        </section>
      </div>
    )
  }

  // QUIZ CHECKPOINT (Challenger Arena - Parsed or explicit quizData)
  if (quizInfo.hasQuiz && quizInfo.quizData) {
    return (
      <div id={messageId} className={`w-full max-w-5xl xl:max-w-6xl mx-auto my-6 transition-all ${isHighlighted ? 'ring-2 ring-[#6c8cff] rounded-2xl p-2' : ''}`}>
        {/* Agent Thought Trace Bar */}
        {message.steps && message.steps.length > 0 && (
          <AgentThoughtTrace steps={message.steps} isStreaming={isStreaming} />
        )}

        {/* Challenger Intro / Rival banter if present */}
        {quizInfo.intro && (
          <div className={`mb-3 text-[#c8cdd8] leading-relaxed text-sm sm:text-base ${dyslexicFont ? 'font-dyslexic-content' : ''}`}>
            <p>{quizInfo.intro}</p>
          </div>
        )}

        {/* Interactive Quiz Card with option buttons */}
        <QuizCard
          quizData={quizInfo.quizData}
          onAskSensei={onSendMessage}
          onNextChallenge={() => onSendMessage('Give me another challenge question to test this concept!')}
        />

        {/* Challenger Outro if present */}
        {quizInfo.outro && (
          <div className={`mt-3 text-[#c8cdd8] leading-relaxed text-sm sm:text-base ${dyslexicFont ? 'font-dyslexic-content' : ''}`}>
            <p>{quizInfo.outro}</p>
          </div>
        )}
      </div>
    )
  }

  // While Challenger is streaming and quiz hasn't finished parsing, show a sleek crafting challenge indicator
  if (isChallenger && isStreaming && !quizInfo.hasQuiz) {
    return (
      <div id={messageId} className="w-full max-w-5xl xl:max-w-6xl mx-auto my-6">
        {message.steps && message.steps.length > 0 && (
          <AgentThoughtTrace steps={message.steps} isStreaming={isStreaming} />
        )}
        <div className="my-5 rounded-2xl bg-[#1f2229] border border-[#f8bc61]/40 p-6 flex items-center gap-4 animate-pulse shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-[#282a2f] border border-[#f8bc61]/60 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#f8bc61] text-[22px] animate-spin">swords</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#f8bc61] font-mono">
              Challenger Arena · Formulating Challenge
            </span>
            <span className="text-xs text-[#9ca3af]">
              Crafting an interview-level problem to test your mental model...
            </span>
          </div>
        </div>
      </div>
    )
  }

  // SENSEI / AI DIRECT RESPONSE (Claude-style centered content on canvas)
  return (
    <div 
      id={messageId} 
      onClick={(e) => {
        if (focusedParagraphId && e.target.tagName !== 'P') {
          setFocusedParagraphId(null)
        }
      }}
      className={`w-full max-w-5xl xl:max-w-6xl mx-auto my-6 transition-all ${isHighlighted ? 'ring-2 ring-[#6c8cff] rounded-2xl p-2' : ''}`}
    >
      {/* Agent Thought Trace Bar */}
      {message.steps && message.steps.length > 0 && (
        <AgentThoughtTrace steps={message.steps} isStreaming={isStreaming} />
      )}

      {/* Streaming Indicator */}
      {isStreaming && !message.content && <ClaudeLoadingIndicator />}

      {/* Main Content Article */}
      <article 
        onClick={handleDoubleTap}
        className={`flex flex-col gap-4 text-[#c8cdd8] leading-relaxed select-text ${dyslexicFont ? 'font-dyslexic-content' : ''}`}
      >
        {processedContent ? (
          <>
            <ReactMarkdown
              components={{
                code({ className, children }) {
                  const rawCode = String(children || '')
                  const match = /language-(\w+)/.exec(className || '')

                  // 1. Modules Roadmap Block
                  if (match && match[1] === 'modules') {
                    const modulesList = parseModules(rawCode)
                    return (
                      <div className="my-4 p-4 sm:p-5 rounded-2xl bg-[#1e222b] border border-[#2f343d] not-prose shadow-sm">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#2f343d]">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🗺️</span>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6c8cff] font-mono">
                              Curriculum Modules
                            </h4>
                          </div>
                          <span className="text-[11px] bg-[#282a2f] text-[#939aa8] px-2 py-0.5 rounded-full font-mono">
                            {modulesList.length} Modules
                          </span>
                        </div>
                        <div className="space-y-2">
                          {modulesList.map((m, idx) => (
                            <div
                              key={idx}
                              onClick={() => onSendMessage && onSendMessage(`Let's explore Module ${m.num}: ${m.title}`)}
                              className="group flex items-center justify-between gap-3 p-3 rounded-xl bg-[#161920] hover:bg-[#282a2f] border border-[#2f343d] hover:border-[#6c8cff]/50 transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-7 h-7 rounded-lg bg-[#282a2f] text-[#6c8cff] font-mono text-xs font-semibold flex items-center justify-center shrink-0">
                                  {String(m.num).padStart(2, '0')}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold text-[#dee3ec] group-hover:text-[#6c8cff] transition-colors truncate">
                                    {m.title}
                                  </div>
                                  {m.desc && (
                                    <div className="text-[11px] text-[#939aa8] truncate mt-0.5">
                                      {m.desc}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-[#6c8cff] font-mono">Start →</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }

                  // 2. Fenced Quiz Block (```quiz or ```json containing quiz)
                  if (match && (match[1] === 'quiz' || match[1] === 'json')) {
                    const parsed = tryRepairJson(rawCode)
                    if (parsed && (parsed.question || parsed.prompt) && (parsed.options || parsed.choices)) {
                      return (
                        <div className="my-3">
                          <QuizCard
                            quizData={normalizeQuizData(parsed)}
                            onAskSensei={onSendMessage}
                            onNextChallenge={() => onSendMessage('Give me another challenge question to test this concept!')}
                          />
                        </div>
                      )
                    }
                  }

                  // 3. Real Code Block
                  const isBlock = Boolean(className) || rawCode.includes('\n')
                  if (isBlock) {
                    return <CodeBlock code={rawCode.replace(/\n$/, '')} language={match ? match[1] : ''} />
                  }

                  // 3. Inline Code
                  return (
                    <code className="font-mono text-xs bg-[#222630] text-[#6c8cff] px-1.5 py-0.5 rounded border border-[#2f343d]">
                      {children}
                    </code>
                  )
                },
                h2: ({ children }) => (
                  <div className="border-l-2 border-[#444653] hover:border-[#6c8cff] pl-4 py-0.5 my-3 transition-colors">
                    <h2 className="text-base sm:text-lg font-semibold text-[#dee3ec] tracking-tight">
                      {children}
                    </h2>
                  </div>
                ),
                h3: ({ children }) => (
                  <div className="border-l-2 border-[#444653] hover:border-[#5fd38d] pl-4 py-0.5 my-2 transition-colors">
                    <h3 className="text-sm sm:text-base font-semibold text-[#dee3ec]">
                      {children}
                    </h3>
                  </div>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-[#5fd38d] pl-4 py-1 my-3 bg-[#183e28]/20 rounded-r-xl text-[#c8cdd8] text-sm">
                    {children}
                  </blockquote>
                ),
                p: ({ children, node }) => {
                  const pLine = node?.position?.start?.line || 0
                  const pId = `${messageId}-p-${pLine}`
                  const isFocused = focusedParagraphId === pId
                  const isDimmed = Boolean(focusedParagraphId && !isFocused)

                  return (
                    <p 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDoubleTap()
                        setFocusedParagraphId(isFocused ? null : pId)
                      }}
                      className={`text-sm sm:text-base leading-relaxed transition-all duration-200 cursor-pointer mb-3 last:mb-0 ${
                        isDimmed ? 'opacity-25' : 'opacity-100'
                      } ${
                        isFocused 
                          ? 'ring-1 ring-[#6c8cff]/60 bg-[#6c8cff]/10 text-[#f1f4fa] rounded-xl p-3 shadow-inner' 
                          : 'text-[#c8cdd8]'
                      }`}
                    >
                      {bionicReading ? renderBionicChildren(children) : children}
                    </p>
                  )
                },
                ul: ({ children }) => (
                  <ul className="list-disc list-outside ml-5 space-y-1.5 my-2 text-sm text-[#c8cdd8]">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside ml-5 space-y-1.5 my-2 text-sm text-[#c8cdd8]">
                    {children}
                  </ol>
                ),
              }}
            >
              {processedContent}
            </ReactMarkdown>

            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-[#6c8cff] animate-pulse rounded-xs" />
            )}
          </>
        ) : null}
      </article>

      {/* QUIET ACTION ROW (Cognitive Levers from Stitch) - Only shown on the latest response */}
      {!isStreaming && processedContent && isLatest && (
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 sm:pt-3 mt-2 sm:mt-4 border-t border-[#2f343d]/50 text-xs relative">
          {/* Desktop Levers Row */}
          <div className="hidden sm:flex flex-wrap items-center gap-1.5 font-mono">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyMessage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a1b21] hover:bg-[#282a2f] text-[#9ca3af] hover:text-[#e8eaed] border border-[#2f343d] transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copiedFeedback ? 'check' : 'content_copy'}
              </span>
              <span>{copiedFeedback ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Simpler Lever */}
            <button
              type="button"
              onClick={() => onSendMessage && onSendMessage('Could you explain that part in a simpler, shorter way with zero jargon?')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a1b21] hover:bg-[#282a2f] text-[#f8bc61] border border-[#2f343d] hover:border-[#f8bc61]/40 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">lightbulb</span>
              <span>Simpler</span>
            </button>

            {/* Shorter Lever */}
            <button
              type="button"
              onClick={() => onSendMessage && onSendMessage('Can you distill the key takeaways into 3 quick bullet points?')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a1b21] hover:bg-[#282a2f] text-[#5fd38d] border border-[#2f343d] hover:border-[#5fd38d]/40 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">content_cut</span>
              <span>Shorter</span>
            </button>

            {/* Different Analogy Lever */}
            <button
              type="button"
              onClick={() => onSendMessage && onSendMessage('Could you explain this concept using a completely different real-world analogy?')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a1b21] hover:bg-[#282a2f] text-[#6c8cff] border border-[#2f343d] hover:border-[#6c8cff]/40 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">autorenew</span>
              <span>Different analogy</span>
            </button>
          </div>

          {/* Mobile Sleek Micro-Toolbar */}
          <div className="flex sm:hidden items-center gap-1 font-mono relative">
            {/* Compact Copy Button */}
            <button
              type="button"
              onClick={handleCopyMessage}
              className="p-1 rounded text-[#9ca3af] hover:text-[#e8eaed] transition-colors flex items-center justify-center"
              title="Copy message"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copiedFeedback ? 'check' : 'content_copy'}
              </span>
            </button>

            {/* Collapsible Levers Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMobileLevers((prev) => !prev)}
                className="flex items-center gap-0.5 p-1 rounded text-[#9ca3af] hover:text-[#f1f4fa] transition-colors"
                title="Cognitive Prompt Levers"
              >
                <span className="material-symbols-outlined text-[15px] text-[#f8bc61]">tune</span>
                <span className={`material-symbols-outlined text-[12px] transition-transform ${showMobileLevers ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {/* Mobile Levers Popover */}
              {showMobileLevers && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowMobileLevers(false)} 
                  />
                  <div className="absolute bottom-full left-0 mb-1.5 w-60 bg-[#16181d] border border-[#2f343d] rounded-xl p-1.5 shadow-2xl z-40 flex flex-col gap-1 animate-fadeIn">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMobileLevers(false)
                        onSendMessage?.('Could you explain that part in a simpler, shorter way with zero jargon?')
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-[#f8bc61] hover:bg-[#1f2229] transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                      <span>Simpler (Zero jargon)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMobileLevers(false)
                        onSendMessage?.('Can you distill the key takeaways into 3 quick bullet points?')
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-[#5fd38d] hover:bg-[#1f2229] transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_cut</span>
                      <span>Shorter (3 bullets)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMobileLevers(false)
                        onSendMessage?.('Could you explain this concept using a completely different real-world analogy?')
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-[#6c8cff] hover:bg-[#1f2229] transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[16px]">autorenew</span>
                      <span>Different analogy</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Collapsible Deep Dive */}
          <button
            type="button"
            onClick={() => setShowDeepDive(!showDeepDive)}
            className="text-[11px] sm:text-xs text-[#6c8cff] hover:underline flex items-center gap-0.5 font-mono ml-auto"
          >
            <span className="hidden sm:inline">{showDeepDive ? 'Hide details' : 'Show more details'}</span>
            <span className="sm:hidden">{showDeepDive ? 'Hide' : 'Details'}</span>
            <span className={`material-symbols-outlined text-[13px] sm:text-[15px] transition-transform ${showDeepDive ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>
        </div>
      )}

      {/* Deep Dive Panel */}
      {showDeepDive && (
        <div className="p-4 rounded-xl bg-[#1a1b21] border border-[#2f343d] mt-3 space-y-2 text-xs text-[#9ca3af] leading-relaxed animate-fadeIn">
          <h4 className="font-semibold text-[#f1f4fa] flex items-center gap-1.5 text-xs font-mono">
            <span className="material-symbols-outlined text-[#6c8cff] text-[16px]">account_tree</span>
            <span>Under the hood mental model</span>
          </h4>
          <p>
            Whenever state mutations or algorithmic steps execute, the runtime coordinates queues without blocking user input. 
            Understanding internal reconciliation helps you predict lifecycle timing with zero cognitive guesswork.
          </p>
        </div>
      )}
    </div>
  )
}
