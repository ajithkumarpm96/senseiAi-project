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
export function useChat(projectId, chapterId) {
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState(null)
  
  const token = useAppStore((state) => state.token)
  const theme = useAppStore((state) => state.theme)
  const abortControllerRef = useRef(null)
  const currentChapterIdRef = useRef(chapterId)

  // 1. Load chat history when project or chapter changes
  useEffect(() => {
    currentChapterIdRef.current = chapterId
    if (!projectId) return

    // If an active stream exists when changing chapters, abort it
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
    setError(null)
    setMessages([])

    loadHistory(projectId, chapterId)
  }, [projectId, chapterId])

  const loadHistory = async (pId = projectId, cId = chapterId) => {
    if (!pId) return
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
    }
  }

  // 2. Send message and stream the response
  const sendMessage = async (userPrompt, mood = 'focused', studyMode = 'chill', targetAgent = null) => {
    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim() || isStreaming) return

    const safeMood = typeof mood === 'string' ? mood : 'focused'
    const safeStudyMode = typeof studyMode === 'string' ? studyMode : 'chill'
    const safeTargetAgent = typeof targetAgent === 'string' ? targetAgent : null

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
      const response = await fetch('/api/chat/stream', {
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

              // 0. Agent routing switch (e.g. Challenger or Hype agent stepped in)
              if (parsed.type === 'agent_switch' && parsed.agent) {
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
                if (currentChapterIdRef.current === chapterId) {
                  setError(parsed.content)
                }
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
      if (currentChapterIdRef.current !== chapterId) return prev
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
    error,
    sendMessage,
    requestChallenge,
    stopStreaming,
    reloadHistory: loadHistory
  }
}
