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
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  // Detect scroll to morph header into a floating semi-transparent pill on mobile
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
        {/* Brand & Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 cursor-pointer group shrink-0"
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

          {/* Calm Mode pill (Desktop) */}
          <div className="hidden md:flex items-center gap-2 bg-[#1f2229] border border-[#2f343d] px-3 py-1 rounded-full text-xs text-[#9ca3af]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5fd38d] animate-pulse" />
            <span>Calm Mode Active</span>
          </div>
        </div>

        {/* Desktop Accessibility Controls & Profile */}
        <div className="hidden md:flex items-center gap-2 sm:gap-3">
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

            <div className="h-4 w-px bg-[#2f343d]" />

            {/* Bionic Reading */}
            <button
              type="button"
              onClick={toggleBionicReading}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                bionicReading
                  ? 'bg-[#6c8cff]/20 text-[#6c8cff] border border-[#6c8cff]/40'
                  : 'text-[#9ca3af] hover:text-[#f1f4fa] hover:bg-[#1f2229]'
              }`}
              title="Bionic Reading (Bold First Letters)"
            >
              <span className="material-symbols-outlined text-[16px]">auto_stories</span>
              <span className="hidden sm:inline">Bionic</span>
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

        {/* Mobile Profile Icon Only (Clicking opens sidebar drawer) */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#6c8cff]/50 transition-transform active:scale-95"
            title="Open Profile & Menu"
          >
            <div 
              className={`rounded-full bg-[#6c8cff] text-[#001e60] font-semibold flex items-center justify-center shadow-sm select-none transition-all ${
                isScrolled ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-xs'
              }`}
            >
              {user?.username ? user.username.charAt(0).toUpperCase() : <span className="material-symbols-outlined text-[16px]">person</span>}
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden transition-opacity duration-300 ease-in-out ${
          isMobileDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileDrawerOpen(false)}
      />

      {/* Mobile Sliding Sidebar Drawer */}
      <div
        className={`
          fixed inset-y-0 right-0 z-50 md:hidden
          w-80 max-w-[85vw] bg-[#16181d] border-l border-[#2f343d] shadow-2xl flex flex-col justify-between
          transition-transform duration-300 ease-in-out select-none
          ${isMobileDrawerOpen ? 'translate-x-0' : 'translate-x-full'}
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
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#f1f4fa] hover:bg-[#1f2229] transition-colors"
            title="Close menu"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Navigation (Moved from Bottom Nav) */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#9ca3af]/80 font-semibold mb-2 px-1">
              Navigation
            </div>
            <div className="space-y-1">
              {[
                { label: "Today's Focus", icon: 'calendar_today', path: '/' },
                { label: 'Technical Paths', icon: 'route', path: '/paths' },
                { label: 'Gentle Progress', icon: 'insights', path: '/progress' },
                { label: 'Settings & Admin', icon: 'settings', path: '/admin' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setIsMobileDrawerOpen(false)
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

          {/* Sensory & Accessibility Controls (Moved from Top Header) */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#9ca3af]/80 font-semibold mb-2 px-1">
              Sensory & Accessibility
            </div>
            <div className="space-y-2">
              {/* Dyslexia Font */}
              <button
                type="button"
                onClick={toggleDyslexicFont}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border ${
                  dyslexicFont 
                    ? 'bg-[#6c8cff]/15 border-[#6c8cff]/40 text-[#6c8cff]' 
                    : 'bg-[#1a1b21] border-[#2f343d] text-[#9ca3af]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">spellcheck</span>
                  <span className="font-medium">OpenDyslexic Font</span>
                </div>
                <span className="font-mono text-[11px] font-semibold">{dyslexicFont ? 'ON' : 'OFF'}</span>
              </button>

              {/* Text Size Scale */}
              <button
                type="button"
                onClick={toggleTextScale}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border ${
                  textScale === 'large'
                    ? 'bg-[#6c8cff]/15 border-[#6c8cff]/40 text-[#6c8cff]'
                    : 'bg-[#1a1b21] border-[#2f343d] text-[#9ca3af]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">format_size</span>
                  <span className="font-medium">Text Scale</span>
                </div>
                <span className="font-mono text-[11px] font-semibold">{textScale === 'large' ? 'Large (110%)' : 'Normal'}</span>
              </button>

              {/* Soft View */}
              <button
                type="button"
                onClick={toggleSoftView}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border ${
                  softView
                    ? 'bg-[#f8bc61]/15 border-[#f8bc61]/40 text-[#f8bc61]'
                    : 'bg-[#1a1b21] border-[#2f343d] text-[#9ca3af]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">contrast</span>
                  <span className="font-medium">Soft View (Low Contrast)</span>
                </div>
                <span className="font-mono text-[11px] font-semibold">{softView ? 'ON' : 'OFF'}</span>
              </button>

              {/* Bionic Reading */}
              <button
                type="button"
                onClick={toggleBionicReading}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border ${
                  bionicReading
                    ? 'bg-[#6c8cff]/15 border-[#6c8cff]/40 text-[#6c8cff]'
                    : 'bg-[#1a1b21] border-[#2f343d] text-[#9ca3af]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                  <span className="font-medium">Bionic Reading</span>
                </div>
                <span className="font-mono text-[11px] font-semibold">{bionicReading ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer: Sign Out */}
        <div className="p-4 border-t border-[#2f343d] bg-[#1a1b21]/50">
          <button
            type="button"
            onClick={() => {
              setIsMobileDrawerOpen(false)
              logout()
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-[#ffb4ab] hover:text-[#ffdad6] bg-[#93000a]/20 hover:bg-[#93000a]/35 border border-[#ffb4ab]/30 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  )
}
