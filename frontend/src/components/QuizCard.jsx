import React, { useState } from 'react'

export default function QuizCard({ quizData, onAskSensei, onNextChallenge }) {
  const [selectedOption, setSelectedOption] = useState(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [isSkipped, setIsSkipped] = useState(false)

  if (!quizData || !quizData.question) return null

  const { question, code, options = [], correct, explanation, hint } = quizData

  const handleSelect = (optionId) => {
    if (isSubmitted || isSkipped) return
    setSelectedOption(optionId)
    setIsSubmitted(true)
    if (navigator.vibrate) {
      if (optionId === correct) {
        navigator.vibrate([10, 40, 20])
      } else {
        navigator.vibrate([20, 30, 20])
      }
    }
  }

  const isCorrect = selectedOption === correct

  return (
    <div className="my-5 not-prose rounded-2xl bg-[#1f2229] border border-[#2f343d] p-5 sm:p-6 shadow-xl flex flex-col gap-4 text-[#e8eaed]">
      {/* Header Badge with Amber Accent */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#282a2f] border border-[#f8bc61]/40 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#f8bc61] text-[20px]">swords</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-wider uppercase text-[#f8bc61] font-mono">
              Challenger Arena · Interview Checkpoint
            </span>
            <span className="text-xs text-[#9ca3af]">Test your mental model under interview conditions</span>
          </div>
        </div>

        {isSubmitted && (
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border font-mono ${
              isCorrect
                ? 'bg-[#183e28] border-[#5fd38d]/50 text-[#5fd38d]'
                : 'bg-[#93000a]/40 border-[#ffb4ab]/40 text-[#ffb4ab]'
            }`}
          >
            {isCorrect ? '✓ Nailed It' : '✕ Stale Trap'}
          </span>
        )}
      </div>

      {/* Prompt Headline */}
      <h3 className="text-sm sm:text-base font-semibold text-[#e8eaed] leading-relaxed">
        {question}
      </h3>

      {/* Code Snippet Box (Okabe-Ito syntax colors) */}
      {code && code.trim() && (
        <div className="bg-[#1a1b21] rounded-xl border border-[#2f343d] overflow-hidden select-text">
          <pre className="p-3.5 font-mono text-xs leading-relaxed text-[#e8eaed] overflow-x-auto whitespace-pre">
            <code>{code}</code>
          </pre>
        </div>
      )}

      {/* Interactive MCQ Option Cards */}
      <div aria-label="Quiz answer options" className="flex flex-col gap-2.5" role="radiogroup">
        {options.map((opt) => {
          const isThisSelected = selectedOption === opt.id
          const isThisCorrect = opt.id === correct

          let cardStyle = 'bg-[#1a1b21] border-[#2f343d] hover:border-[#6c8cff]/70 hover:bg-[#282a2f] text-[#e8eaed]'

          if (isSubmitted) {
            if (isThisCorrect) {
              cardStyle = 'bg-[#183e28]/70 border-[#5fd38d] text-[#a5f5c5] ring-1 ring-[#5fd38d]/40'
            } else if (isThisSelected) {
              cardStyle = 'bg-[#93000a]/40 border-[#ffb4ab] text-[#ffdad6]'
            } else {
              cardStyle = 'bg-[#1a1b21]/60 border-[#2f343d]/60 text-[#9ca3af] opacity-50'
            }
          } else if (isSkipped) {
            cardStyle = 'bg-[#1a1b21]/60 border-[#2f343d]/60 text-[#9ca3af] opacity-60'
          }

          return (
            <button
              key={opt.id}
              type="button"
              disabled={isSubmitted || isSkipped}
              onClick={() => handleSelect(opt.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 active:scale-[0.99] disabled:cursor-default ${cardStyle}`}
            >
              <span
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 font-mono transition-colors ${
                  isSubmitted && isThisCorrect
                    ? 'bg-[#5fd38d] text-[#00391d]'
                    : isSubmitted && isThisSelected
                    ? 'bg-[#ffb4ab] text-[#690005]'
                    : 'bg-[#282a2f] text-[#9ca3af]'
                }`}
              >
                {opt.id}
              </span>
              <span className="flex-1 text-xs sm:text-sm leading-relaxed">{opt.text}</span>
            </button>
          )
        })}
      </div>

      {/* Hint Tray */}
      {showHint && !isSubmitted && (
        <div className="p-3.5 rounded-xl bg-[#1a1b21] border border-[#f8bc61]/40 text-xs text-[#f8bc61] leading-relaxed flex items-start gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">lightbulb</span>
          <p>{hint || 'Think about which variable values get captured by closures during execution.'}</p>
        </div>
      )}

      {/* Feedback Explanation Tray (Revealed after answering) */}
      {isSubmitted && (
        <div className="p-4 rounded-xl bg-[#1a1b21] border border-[#5fd38d]/40 flex flex-col gap-2 animate-fadeIn">
          <div className="flex items-center gap-2 text-[#5fd38d] text-xs font-semibold font-mono">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>{isCorrect ? 'Bullseye! You nailed the reasoning.' : `Correct Answer: Option ${correct}`}</span>
          </div>
          <p className="text-xs text-[#9ca3af] leading-relaxed">
            {explanation}
          </p>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#2f343d] mt-1 flex-wrap">
            {onAskSensei && (
              <button
                type="button"
                onClick={() => onAskSensei(`Can you explain why Option ${correct} is the answer to: "${question}"?`)}
                className="text-xs text-[#6c8cff] hover:text-[#f1f4fa] bg-[#1f2229] hover:bg-[#282a2f] border border-[#2f343d] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">school</span>
                <span>Ask Sensei to break down</span>
              </button>
            )}
            {onNextChallenge && (
              <button
                type="button"
                onClick={onNextChallenge}
                className="text-xs text-[#001e60] bg-[#6c8cff] hover:bg-[#809cff] font-semibold px-4 py-1.5 rounded-lg transition-all ml-auto flex items-center gap-1"
              >
                <span>Next Challenge</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer Hint Levers & Skip (Zero Penalty) */}
      {!isSubmitted && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#2f343d] text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[#282a2f] text-[#9ca3af] hover:text-[#f8bc61] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-[#f8bc61]">lightbulb</span>
              <span>{showHint ? 'Hide hint' : 'Need a hint?'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSkipped(true)}
              className="px-2.5 py-1 rounded-lg hover:bg-[#282a2f] text-[#9ca3af] hover:text-[#e8eaed] transition-colors"
            >
              Skip (Zero penalty)
            </button>
          </div>
          <span className="text-[11px] font-mono text-[#9ca3af]/70 hidden sm:inline">
            Interview Checkpoint · 1 Question
          </span>
        </div>
      )}
    </div>
  )
}