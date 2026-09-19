import React from 'react'
import TopHeader from './TopHeader'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { useAppStore } from '../../store/appStore'

export default function AppShell({ children }) {
  const { dyslexicFont, textScale, softView } = useAppStore()

  return (
    <div className={`min-h-screen bg-[#161920] text-[#c8cdd8] ${softView ? 'soft-view-mode' : ''} ${textScale === 'large' ? 'text-scale-large' : ''}`}>
      <TopHeader />
      <Sidebar />
      <div className="lg:pl-64 pt-16 pb-20 lg:pb-8 min-h-screen transition-all">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
