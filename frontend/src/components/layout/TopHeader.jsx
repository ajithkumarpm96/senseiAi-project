import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'

export default function TopHeader() {
  const navigate = useNavigate()
  const { 
    user, 
    logout, 
    dyslexicFont, 
    toggleDyslexicFont,
    textScale,
    toggleTextScale,
    softView,
    toggleSoftView
  } = useAppStore()

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#16181d]/95 backdrop-blur-md border-b border-[#2f343d] z-50 flex items-center justify-between px-4 sm:px-6">
      {/* Brand & Status */}
      <div className="flex items-center gap-3">
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          {/* Calm Beacon Logo */}
          <div className="w-8 h-8 rounded-lg bg-[#1f2229] border border-[#2f343d] flex items-center justify-center text-[#6c8cff] group-hover:border-[#6c8cff]/50 transition-colors">
            <span className="material-symbols-outlined text-[20px]">spa</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg tracking-tight text-[#f1f4fa]">Sensei AI</span>
            <span 
              className="w-2.5 h-2.5 rounded-full bg-[#5fd38d] inline-block shadow-[0_0_8px_rgba(95,211,141,0.5)]" 
              title="Calm Focus Mode Active"
            />
          </div>
        </div>

        {/* Calm Mode pill (Desktop) */}
        <div className="hidden md:flex items-center gap-2 bg-[#1f2229] border border-[#2f343d] px-3 py-1 rounded-full text-xs text-[#9ca3af]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5fd38d] animate-pulse" />
          <span>Calm Mode Active</span>
        </div>
      </div>

      {/* Reading Accessibility Controls & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sensory Toolbar */}
        <div className="flex items-center bg-[#1a1b21] border border-[#2f343d] px-1.5 py-1 rounded-xl gap-1">
          {/* Dyslexia-friendly Font Switcher */}
          <button
            type="button"
            onClick={toggleDyslexicFont}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              dyslexicFont 
                ? 'bg-[#6c8cff] text-[#001e60] shadow-sm font-semibold' 
                : 'text-[#9ca3af] hover:text-[#f1f4fa] hover:bg-[#1f2229]'
            }`}
            title="Toggle OpenDyslexic accessible font"
          >
            <span className="material-symbols-outlined text-[16px]">spellcheck</span>
            <span className="hidden sm:inline">Dyslexia</span>
          </button>

          <div className="h-4 w-px bg-[#2f343d]" />

          {/* Text Size Scale */}
          <button
            type="button"
            onClick={toggleTextScale}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              textScale === 'large'
                ? 'bg-[#6c8cff]/20 text-[#6c8cff] border border-[#6c8cff]/40'
                : 'text-[#9ca3af] hover:text-[#f1f4fa] hover:bg-[#1f2229]'
            }`}
            title="Adjust Text Scale"
          >
            <span className="material-symbols-outlined text-[16px]">format_size</span>
            <span className="hidden sm:inline">Scale</span>
          </button>

          <div className="h-4 w-px bg-[#2f343d]" />

          {/* Soft View (Low Contrast) */}
          <button
            type="button"
            onClick={toggleSoftView}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              softView
                ? 'bg-[#f8bc61]/20 text-[#f8bc61] border border-[#f8bc61]/40'
                : 'text-[#9ca3af] hover:text-[#f1f4fa] hover:bg-[#1f2229]'
            }`}
            title="Soft Low-Contrast View"
          >
            <span className="material-symbols-outlined text-[16px]">contrast</span>
            <span className="hidden sm:inline">Soft</span>
          </button>
        </div>

        {/* User Avatar & Logout */}
        <div className="flex items-center gap-2 pl-1">
          <button
            onClick={() => navigate('/admin')}
            className="hidden sm:flex text-xs text-[#9ca3af] hover:text-[#e8eaed] px-2 py-1.5 rounded-lg hover:bg-[#1f2229] transition-colors"
            title="Usage & Analytics"
          >
            Admin
          </button>
          
          <div 
            className="w-8 h-8 rounded-full bg-[#6c8cff] text-[#001e60] font-semibold text-xs flex items-center justify-center shadow-sm select-none"
            title={`Logged in as ${user?.username || 'User'}`}
          >
            {user?.username ? user.username.charAt(0).toUpperCase() : <span className="material-symbols-outlined text-[18px]">person</span>}
          </div>

          <button
            onClick={logout}
            className="text-xs text-[#ffb4ab]/80 hover:text-[#ffb4ab] px-2 py-1.5 rounded-lg hover:bg-[#93000a]/20 transition-colors"
            title="Log out"
          >
            <span className="material-symbols-outlined text-[18px] sm:hidden">logout</span>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
