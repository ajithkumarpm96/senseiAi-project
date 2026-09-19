import React, { useState, useEffect } from 'react'

const CLAUDE_PHRASES = [
  'Consulting the ancient scrolls... 📜',
  'Dispatching DuckDuckGo scouts into the web... 🦆',
  'Brewing a fresh analogy... 🧪',
  'Scribbling on the chalkboard... 📝',
  'Earning a quick PhD in this topic... 🔬',
  'Fighting off Hydra bugs... ⚔️',
  'Channeling chakra & calibrating dopamine... 🧘',
  'Synthesizing bite-sized wisdom... 💡',
  'Translating tech jargon into human speak... 🗣️',
  'Untangling the code spaghetti... 🍝',
  'Summoning the right pop culture reference... ⚡'
]

export default function ClaudeLoadingIndicator() {
  const [index, setIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true)
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % CLAUDE_PHRASES.length)
        setIsFading(false)
      }, 180)
    }, 2400)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2.5 h-8 select-none py-1">
      {/* Claude-style AI Sparkle */}
      <div className="relative flex items-center justify-center shrink-0">
        <div className="absolute w-4 h-4 bg-purple-500/30 rounded-full blur-xs animate-ping" />
        <svg
          className="w-4 h-4 text-purple-400 relative z-10 animate-spin-slow transition-transform"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
        </svg>
      </div>

      {/* Pure Typography Shimmering Phrase (Option C) */}
      <span
        className={`text-xs sm:text-sm font-medium tracking-wide bg-gradient-to-r from-purple-200 via-indigo-100 to-purple-300 bg-clip-text text-transparent animate-shimmer-text transition-all duration-200 ease-out truncate ${
          isFading ? 'opacity-0 translate-y-0.5' : 'opacity-100 translate-y-0'
        }`}
      >
        {CLAUDE_PHRASES[index]}
      </span>
    </div>
  )
}
