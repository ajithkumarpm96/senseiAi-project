import { useState, useEffect, useRef } from 'react'
import api from '../api/client'
import { useAppStore } from '../store/appStore'

/**
 * useChat Hook - Manages Real-time Chat & SSE Token Streaming
 *
 * Concepts for your learning:
 * 1. Native ReadableStream: We use window.fetch with response.body.getReader()
 *    to read token chunks as they arrive over HTTP in real time.
 * 2. Token Assembly: As chunks stream in, we update the last AI message state,
 *    triggering a smooth word-by-word typing effect in React!
 */
export function useChat(projectId, chapterId, initialMessages = null, ready = true, onSyllabusGenerated = null) {
  const [messages, setMessages] = useState(initialMessages || [])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(initialMessages === null)
  const [error, setError] = useState(null)
  
  const token = useAppStore((state) => state.token)
  const theme = useAppStore((state) => state.theme)
  const abortControllerRef = useRef(null)
  const currentChapterIdRef = useRef(chapterId)
  const autoAssignedChapterRef = useRef(null)
  const hasUsedInitialMessagesRef = useRef(false)
  const prevChapterIdRef = useRef(chapterId)
  const prevProjectIdRef = useRef(projectId)

  // Synchronously adopt initialMessages during render if provided after initial mount
  const [prevInitialMessages, setPrevInitialMessages] = useState(initialMessages)
  if (initialMessages !== prevInitialMessages) {
    setPrevInitialMessages(initialMessages)
    if (initialMessages !== null) {
      setMessages(initialMessages)
      setIsLoadingHistory(false)
    }
  }

  // Synchronously enter loading state if chapter or project changes
  const [prevChapterId, setPrevChapterId] = useState(chapterId)
  const [prevProjectId, setPrevProjectId] = useState(projectId)
  if (chapterId !== prevChapterId || projectId !== prevProjectId) {
    const isAutoAssigned = autoAssignedChapterRef.current && String(chapterId) === String(autoAssignedChapterRef.current)
    const isInitialChapterAssignment = !prevChapterId && chapterId && projectId === prevProjectId
    setPrevChapterId(chapterId)
    setPrevProjectId(projectId)
    // Only blank messages if switching between distinct existing chapters or switching projects
    if (ready && !isInitialChapterAssignment && !isAutoAssigned) {
      setIsLoadingHistory(true)
      setMessages([])
    }
  }

  // 1. Load chat history when project or chapter changes
  useEffect(() => {
    // If this chapter change was caused by auto-assigning the syllabus during our active chat, don't abort or reload!
    if (autoAssignedChapterRef.current && String(chapterId) === String(autoAssignedChapterRef.current)) {
      autoAssignedChapterRef.current = null
      prevChapterIdRef.current = chapterId
      currentChapterIdRef.current = chapterId
      return
    }

    const isInitialChapterAssignment = (!prevChapterIdRef.current || prevChapterIdRef.current === 'undefined') && chapterId && prevProjectIdRef.current === projectId
    prevChapterIdRef.current = chapterId
    prevProjectIdRef.current = projectId
    currentChapterIdRef.current = chapterId
    if (!projectId || !ready) return

    // If this was an initial chapter assignment for an in-progress or active chat, preserve messages
    if (isInitialChapterAssignment && (isStreaming || messages.length > 0)) {
      return
    }

    // If initialMessages was provided for this initial chapter, use it once and skip duplicate fetch
    if (!hasUsedInitialMessagesRef.current && initialMessages !== null) {
      hasUsedInitialMessagesRef.current = true
      return
    }

    // If an active stream exists when changing chapters, abort it
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
    setError(null)
    setIsLoadingHistory(true)
    setMessages([])

    loadHistory(projectId, chapterId)
  }, [projectId, chapterId, ready])

  const loadHistory = async (pId = projectId, cId = chapterId) => {
    if (!pId) return
    setIsLoadingHistory(true)
    try {
      const url = cId
        ? `/chat/history/${pId}?chapter_id=${cId}`
        : `/chat/history/${pId}`
      const res = await api.get(url)
      // Only set messages if we are still on the requested chapter
      if (currentChapterIdRef.current === cId) {
        setMessages(res.data || [])
      }
    } catch (err) {
      console.error('Failed to load chat history', err)
    } finally {
      if (currentChapterIdRef.current === cId) {
        setIsLoadingHistory(false)
      }
    }
  }

  // 2. Send message and stream the response
  const sendMessage = async (
    userPrompt,
    mood = 'focused',
    studyMode = 'chill',
    targetAgent = null,
    difficultyLevel = 'beginner'
  ) => {
    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim() || isStreaming) return

    const safeMood = typeof mood === 'string' ? mood : 'focused'
    const safeStudyMode = typeof studyMode === 'string' ? studyMode : 'chill'
    const safeTargetAgent = typeof targetAgent === 'string' ? targetAgent : null
    const safeDifficulty = typeof difficultyLevel === 'string' ? difficultyLevel : 'beginner'

    setError(null)
    const userMessage = {
      id: 'temp-user-' + Date.now(),
      role: 'user',
      content: userPrompt,
      created_at: new Date().toISOString()
    }

    let activeRole = safeTargetAgent || 'sensei'
    const aiPlaceholder = {
      id: 'temp-ai-' + Date.now(),
      role: activeRole,
      content: '',
      steps: [],
      created_at: new Date().toISOString()
    }

    // Optimistically show user message and empty AI bubble
    setMessages((prev) => [...prev, userMessage, aiPlaceholder])
    setIsStreaming(true)

    abortControllerRef.current = new AbortController()

    try {
      const rawBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')
      const streamUrl = rawBase ? `${rawBase}/api/chat/stream` : '/api/chat/stream'

      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userPrompt,
          project_id: parseInt(projectId),
          chapter_id: chapterId ? parseInt(chapterId) : null,
          mood: safeMood,
          theme: theme,
          study_mode: safeStudyMode,
          difficulty_level: safeDifficulty,
          target_agent: safeTargetAgent
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}))
        throw new Error(errorJson.detail || 'Failed to connect to Sensei')
      }

      // Read SSE stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''
      let activeSteps = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.slice(6).trim()
            if (!rawData) continue

            try {
              const parsed = JSON.parse(rawData)

              // -1. Syllabus generated automatically on first chat
              if (parsed.type === 'syllabus_generated') {
                if (parsed.selected_chapter_id) {
                  autoAssignedChapterRef.current = parsed.selected_chapter_id
                  currentChapterIdRef.current = parsed.selected_chapter_id
                }
                if (onSyllabusGenerated) {
                  onSyllabusGenerated({
                    coreChapters: parsed.core_chapters || [],
                    optionalChapters: parsed.optional_chapters || [],
                    selectedChapterId: parsed.selected_chapter_id
                  })
                }
              }

              // 0. Agent routing switch (e.g. Challenger or Hype agent stepped in)
              else if (parsed.type === 'agent_switch' && parsed.agent) {
                activeRole = parsed.agent
                updateAiMessage(accumulatedText, activeSteps, activeRole)
              }
              // 1. Initial or intermediate reasoning step
              else if (parsed.type === 'step') {
                activeSteps.push({
                  title: parsed.step,
                  status: 'done'
                })
                updateAiMessage(accumulatedText, activeSteps, activeRole)
              }
              // 2. Web search tool execution started
              else if (parsed.type === 'tool_start') {
                activeSteps.push({
                  title: 'Searching DuckDuckGo for live facts...',
                  tool: parsed.tool,
                  query: parsed.query,
                  status: 'running'
                })
                updateAiMessage(accumulatedText, activeSteps, activeRole)
              }
              // 3. Web search tool finished
              else if (parsed.type === 'tool_end') {
                activeSteps = activeSteps.map((s) =>
                  s.tool === parsed.tool ? { ...s, status: 'done' } : s
                )
                updateAiMessage(accumulatedText, activeSteps, activeRole)
              }
              // 4. Token streaming chunk
              else if (parsed.type === 'token' && parsed.content) {
                accumulatedText += parsed.content
                updateAiMessage(accumulatedText, activeSteps, activeRole)
              }
              // 5. Completion event
              else if (parsed.type === 'done') {
                activeSteps = activeSteps.map((s) => ({ ...s, status: 'done' }))
                updateAiMessage(accumulatedText, activeSteps, activeRole)
              }
              // 6. Error event
              else if (parsed.type === 'error') {
                setError(parsed.content)
              }
            } catch (e) {
              // Ignore partial JSON chunks
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Streaming error', err)
        setError(err.message || 'Sensei was interrupted')
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  // Helper to update the active AI message in state
  const updateAiMessage = (content, steps, role) => {
    setMessages((prev) => {
      const updated = [...prev]
      const lastIndex = updated.length - 1
      if (lastIndex >= 0) {
        updated[lastIndex] = {
          ...updated[lastIndex],
          role: role || updated[lastIndex].role,
          content: content,
          steps: [...steps]
        }
      }
      return updated
    })
  }

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const requestChallenge = (mood = 'focused', studyMode = 'chill') => {
    const safeMood = typeof mood === 'string' ? mood : 'focused'
    const safeStudyMode = typeof studyMode === 'string' ? studyMode : 'chill'
    return sendMessage(
      "I want to test my knowledge! Give me an interview challenge on this chapter.",
      safeMood,
      safeStudyMode,
      "challenger"
    )
  }

  return {
    messages,
    isStreaming,
    isLoadingHistory,
    error,
    sendMessage,
    requestChallenge,
    stopStreaming,
    reloadHistory: loadHistory
  }
}
