import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { label: 'Today', icon: 'calendar_today', path: '/' },
    { label: 'Paths', icon: 'route', path: '/paths' },
    { label: 'Progress', icon: 'insights', path: '/progress' },
    { label: 'Settings', icon: 'settings', path: '/admin' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#16181d]/95 backdrop-blur-xl border-t border-[#2f343d] lg:hidden pb-[env(safe-area-inset-bottom,0px)]">
      <div className="grid grid-cols-4 h-16 items-center px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 h-12 rounded-xl transition-all ${
                isActive
                  ? 'text-[#6c8cff] bg-[#1f2229] font-medium'
                  : 'text-[#9ca3af] hover:text-[#e8eaed]'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">{tab.icon}</span>
              <span className="text-[11px] tracking-tight">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
