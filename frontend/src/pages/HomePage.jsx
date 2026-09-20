import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import AppShell from '../components/layout/AppShell'
import FreshStartDashboard from '../components/dashboard/FreshStartDashboard'
import ResumingDashboard from '../components/dashboard/ResumingDashboard'
import NewSubjectModal from '../components/dashboard/NewSubjectModal'
import SenseiLoader from '../components/common/SenseiLoader'

export default function HomePage() {
  const [projects, setProjects] = useState([])
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [initialProgress, setInitialProgress] = useState(null)
  const [initialChapters, setInitialChapters] = useState([])
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
        const firstId = list[0].id
        setActiveProjectId(firstId)
        try {
          const [progRes, chapRes] = await Promise.all([
            api.get(`/progress/${firstId}`).catch(() => ({ data: null })),
            api.get(`/projects/${firstId}/chapters`).catch(() => ({ data: [] })),
          ])
          setInitialProgress(progRes.data)
          setInitialChapters(Array.isArray(chapRes.data) ? chapRes.data : [])
        } catch (subErr) {
          console.error('Failed to pre-fetch active project data', subErr)
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects', err)
    } finally {
      setLoading(false)
    }
  }

  // Creates a new project and keeps user ON the dashboard with this new subject selected
  const handleCreateProject = async (title, difficultyLevel = 'beginner') => {
    try {
      const res = await api.post('/projects/', { title, difficulty_level: difficultyLevel })
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
        <div className="min-h-[70vh] flex flex-col items-center justify-center">
          <SenseiLoader size={120} />
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
          initialChapters={initialChapters}
          initialProgress={initialProgress}
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
