import React from 'react'
import AppShell from '../components/layout/AppShell'

/** ProgressPage - Gentle Progress Tracking */
export default function ProgressPage() {
  return (
    <AppShell>
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#183e28] text-[#5fd38d] border border-[#5fd38d]/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-[32px]">spa</span>
        </div>
        <h1 className="text-2xl font-bold text-[#f1f4fa]">Gentle Progress Tracking</h1>
        <p className="text-sm text-[#9ca3af] max-w-[500px] leading-relaxed">
          Your learning rhythm is calculated without guilt or broken streak penalties. 
          Detailed milestones and module mastery will expand here.
        </p>
      </div>
    </AppShell>
  )
}
