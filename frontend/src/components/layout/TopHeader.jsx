import React, { useState, useEffect } from 'react'
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
    toggleSoftView,
    bionicReading, 
    toggleBionicReading
  } = useAppStore()

  const [isScrolled, setIsScrolled] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Count how many sensory adaptations are currently enabled
  const activeSensoryCount = [dyslexicFont, textScale === 'large', softView, bionicReading].filter(Boolean).length

  // Detect scroll to morph header into a floating semi-transparent pill on mobile
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen])

  return (
    <>
      <header 
        className={`
          fixed z-40 transition-all duration-300 ease-in-out flex items-center justify-between
          ${isScrolled 
            ? 'top-2.5 left-3.5 right-3.5 max-w-sm mx-auto h-11 bg-[#16181d]/80 backdrop-blur-xl border border-[#2f343d]/80 shadow-2xl rounded-full px-3.5 md:top-0 md:left-0 md:right-0 md:h-16 md:bg-[#16181d]/95 md:backdrop-blur-md md:border-b md:border-[#2f343d] md:border-t-0 md:border-x-0 md:rounded-none md:max-w-none md:mx-0 md:px-6' 
            : 'top-0 left-0 right-0 h-14 md:h-16 bg-[#16181d]/95 backdrop-blur-md border-b border-[#2f343d] px-4 sm:px-6'
          }
        `}
      >
        {/* Brand & Status - Clean and minimal across all screen sizes */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            title="Sensei AI Home"
          >
            {/* Calm Beacon Logo */}
            <div className={`rounded-lg bg-[#1f2229] border border-[#2f343d] flex items-center justify-center text-[#6c8cff] group-hover:border-[#6c8cff]/50 transition-all ${
              isScrolled ? 'w-7 h-7 md:w-8 md:h-8' : 'w-7 h-7 sm:w-8 sm:h-8'
            }`}>
              <span className={`material-symbols-outlined ${isScrolled ? 'text-[17px] md:text-[20px]' : 'text-[18px] sm:text-[20px]'}`}>spa</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span 
                className={`font-semibold tracking-tight text-[#f1f4fa] select-none transition-all ${
                  isScrolled ? 'text-sm md:text-lg' : 'text-sm sm:text-lg'
                }`}
                style={{ fontFamily: "'OpenDyslexic', sans-serif" }}
              >
                Sensei AI
              </span>
              <span 
                className="w-2 h-2 rounded-full bg-[#5fd38d] inline-block shadow-[0_0_8px_rgba(95,211,141,0.5)] shrink-0" 
                title="Calm Focus Mode Active"
              />
            </div>
          </div>
        </div>

        {/* Clean Controls - Single unified avatar trigger */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-[#6c8cff]/50 transition-all focus:outline-none active:scale-95 cursor-pointer"
            title={`Account & Sensory Settings (${user?.username || 'Learner'})`}
          >
            <div 
              className={`rounded-full bg-[#6c8cff] text-[#001e60] font-bold flex items-center justify-center shadow-sm select-none transition-all ${
                isScrolled ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-xs'
              }`}
            >
              {user?.username ? user.username.charAt(0).toUpperCase() : <span className="material-symbols-outlined text-[16px]">person</span>}
            </div>
          </button>
        </div>
      </header>

      {/* Drawer Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 ease-in-out ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* Sliding Sensory & Settings Drawer (Cleanly works on Desktop and Mobile) */}
      <div
        className={`
          fixed inset-y-0 right-0 z-50
          w-80 sm:w-96 max-w-[90vw] bg-[#16181d] border-l border-[#2f343d] shadow-2xl flex flex-col justify-between
          transition-transform duration-300 ease-in-out select-none
          ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Drawer Header: User Profile */}
        <div className="p-4 border-b border-[#2f343d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#6c8cff] text-[#001e60] font-bold text-sm flex items-center justify-center shadow-sm">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="font-semibold text-[#f1f4fa] text-sm leading-snug">
                {user?.username || 'Learner'}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-[#5fd38d]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5fd38d]" />
                <span>Calm Mode Active</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#f1f4fa] hover:bg-[#1f2229] transition-colors"
            title="Close menu"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Sensory & Accessibility Controls */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9ca3af]/80 font-semibold">
                Sensory & Accessibility
              </span>
              {activeSensoryCount > 0 && (
                <span className="text-[10px] font-mono text-[#6c8cff] font-medium">
                  {activeSensoryCount} Active
                </span>
              )}
            </div>
            <div className="space-y-2">
              {/* Dyslexia Font */}
              <button
                type="button"
                onClick={toggleDyslexicFont}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border ${
                  dyslexicFont 
                    ? 'bg-[#6c8cff]/15 border-[#6c8cff]/40 text-[#6c8cff]' 
                    : 'bg-[#1a1b21] border-[#2f343d] text-[#9ca3af] hover:border-[#6c8cff]/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">spellcheck</span>
                  <span className="font-medium">OpenDyslexic Font</span>
                </div>
                <span className="font-mono text-[11px] font-semibold">{dyslexicFont ? 'ON' : 'OFF'}</span>
              </button>

              {/* Bionic Reading */}
              <button
                type="button"
                onClick={toggleBionicReading}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border ${
                  bionicReading
                    ? 'bg-[#6c8cff]/15 border-[#6c8cff]/40 text-[#6c8cff]'
                    : 'bg-[#1a1b21] border-[#2f343d] text-[#9ca3af] hover:border-[#6c8cff]/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                  <span className="font-medium">Bionic Reading</span>
                </div>
                <span className="font-mono text-[11px] font-semibold">{bionicReading ? 'ON' : 'OFF'}</span>
              </button>

              {/* Soft View */}
              <button
                type="button"
                onClick={toggleSoftView}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border ${
                  softView
                    ? 'bg-[#f8bc61]/15 border-[#f8bc61]/40 text-[#f8bc61]'
                    : 'bg-[#1a1b21] border-[#2f343d] text-[#9ca3af] hover:border-[#f8bc61]/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">contrast</span>
                  <span className="font-medium">Soft View (Low Contrast)</span>
                </div>
                <span className="font-mono text-[11px] font-semibold">{softView ? 'ON' : 'OFF'}</span>
              </button>

              {/* Text Size Scale */}
              <button
                type="button"
                onClick={toggleTextScale}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border ${
                  textScale === 'large'
                    ? 'bg-[#6c8cff]/15 border-[#6c8cff]/40 text-[#6c8cff]'
                    : 'bg-[#1a1b21] border-[#2f343d] text-[#9ca3af] hover:border-[#6c8cff]/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">format_size</span>
                  <span className="font-medium">Text Scale</span>
                </div>
                <span className="font-mono text-[11px] font-semibold">{textScale === 'large' ? 'Large (110%)' : 'Normal'}</span>
              </button>
            </div>
          </div>

          {/* Quick Navigation & Workspace Links */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#9ca3af]/80 font-semibold mb-2 px-1">
              Workspace & Navigation
            </div>
            <div className="space-y-1">
              {[
                { label: "Today's Focus", icon: 'self_improvement', path: '/' },
                { label: 'Technical Paths', icon: 'account_tree', path: '/paths' },
                { label: 'Gentle Progress', icon: 'spa', path: '/progress' },
                { label: 'Settings & Admin', icon: 'settings', path: '/admin' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setIsDrawerOpen(false)
                    navigate(item.path)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[#c8cdd8] hover:text-[#f1f4fa] hover:bg-[#1f2229] transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#6c8cff]">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer: Sign Out */}
        <div className="p-4 border-t border-[#2f343d] bg-[#1a1b21]/50">
          <button
            type="button"
            onClick={() => {
              setIsDrawerOpen(false)
              logout()
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-[#ffb4ab] hover:text-[#ffdad6] bg-[#93000a]/20 hover:bg-[#93000a]/35 border border-[#ffb4ab]/30 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  )
}
