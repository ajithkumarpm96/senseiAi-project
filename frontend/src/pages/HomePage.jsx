import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import AppShell from '../components/layout/AppShell'
import FreshStartDashboard from '../components/dashboard/FreshStartDashboard'
import ResumingDashboard from '../components/dashboard/ResumingDashboard'
import NewSubjectModal from '../components/dashboard/NewSubjectModal'

export default function HomePage() {
  const [projects, setProjects] = useState([])
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [forceFreshStart, setForceFreshStart] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects/')
      const list = res.data || []
      setProjects(list)
      if (list.length > 0) {
        setActiveProjectId((prev) => prev || list[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch projects', err)
    } finally {
      setLoading(false)
    }
  }

  // Creates a new project and keeps user ON the dashboard with this new subject selected
  const handleCreateProject = async (title) => {
    try {
      const res = await api.post('/projects/', { title })
      const newProj = res.data
      setProjects((prev) => [newProj, ...prev])
      setActiveProjectId(newProj.id)
      setForceFreshStart(false)
      // Stay in dashboard so user sees their new subject card ready to start!
    } catch (err) {
      console.error('Failed to create project', err)
      alert('Could not create subject. Please try again.')
    }
  }

  const handleDeleteProject = async (id) => {
    try {
      await api.delete(`/projects/${id}`)
      setProjects((prev) => {
        const updated = prev.filter((p) => p.id !== id)
        if (activeProjectId === id) {
          setActiveProjectId(updated[0]?.id || null)
        }
        return updated
      })
    } catch (err) {
      console.error('Failed to delete project', err)
    }
  }

  // Switches the currently active track on the dashboard without navigating away
  const handleSelectTrack = (id) => {
    setActiveProjectId(id)
    setForceFreshStart(false)
  }

  const handleStartPreset = async (title) => {
    // Check if project with this title already exists
    const existing = projects.find((p) => p.title.toLowerCase() === title.toLowerCase())
    if (existing) {
      navigate(`/study/${existing.id}`)
    } else {
      try {
        const res = await api.post('/projects/', { title })
        const newProj = res.data
        setProjects((prev) => [newProj, ...prev])
        setActiveProjectId(newProj.id)
        navigate(`/study/${newProj.id}`)
      } catch (err) {
        console.error('Failed to create preset project', err)
      }
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-3xl text-[#6c8cff] animate-spin">
            progress_activity
          </span>
          <span className="text-xs text-[#9ca3af] font-mono">Loading your calm space...</span>
        </div>
      </AppShell>
    )
  }

  // If user has no projects or requested a clean workspace fresh start:
  const isFresh = projects.length === 0 || forceFreshStart

  return (
    <AppShell>
      {isFresh ? (
        <FreshStartDashboard
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectActiveProject={handleSelectTrack}
          onOpenNewModal={() => setIsModalOpen(true)}
          onDeleteProject={handleDeleteProject}
          onStartProject={handleStartPreset}
        />
      ) : (
        <ResumingDashboard
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={handleSelectTrack}
          onOpenNewModal={() => setIsModalOpen(true)}
          onDeleteProject={handleDeleteProject}
          onCleanWorkspace={() => setForceFreshStart(true)}
        />
      )}

      {/* Add New Subject Modal */}
      <NewSubjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </AppShell>
  )
}
