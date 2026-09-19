import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { label: "Today's Focus", icon: 'self_improvement', path: '/' },
    { label: 'Technical Paths', icon: 'account_tree', path: '/paths' },
    { label: 'Gentle Progress', icon: 'spa', path: '/progress' },
    { label: 'Saved Notes & Snippets', icon: 'bookmarks', path: '/notes' },
    { label: 'Settings', icon: 'settings', path: '/admin' },
  ]

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-[#16181d] border-r border-[#2f343d] z-40 hidden lg:flex flex-col justify-between p-4 select-none">
      <div className="flex flex-col gap-4">
        <div className="px-2">
          <span className="text-[11px] font-semibold tracking-wider text-[#9ca3af]/80 uppercase font-mono">
            FOCUS WORKSPACE
          </span>
        </div>

        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-left ${
                  isActive
                    ? 'bg-[#6c8cff]/15 text-[#6c8cff] border border-[#6c8cff]/30 shadow-sm'
                    : 'text-[#9ca3af] hover:text-[#f1f4fa] hover:bg-[#1f2229] border border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Reassurance Footer Card */}
      <div className="bg-[#1a1b21] border border-[#2f343d] p-3 rounded-xl">
        <div className="flex items-center gap-1.5 text-[#5fd38d] mb-1">
          <span className="material-symbols-outlined text-[18px]">nature_people</span>
          <span className="text-xs font-semibold">No Pressure Pace</span>
        </div>
        <p className="text-xs text-[#9ca3af] leading-relaxed">
          Take breaks when needed. Mental clarity comes first.
        </p>
      </div>
    </aside>
  )
}
