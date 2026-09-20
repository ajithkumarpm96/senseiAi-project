import { useState } from 'react'
import api from '../api/client'
import { useAppStore } from '../store/appStore'
import { useNavigate } from 'react-router-dom'

/**
 * LoginPage - Clean, Accessible & Mobile/iPhone-Optimized Authentication
 */
export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { setToken, setUser, softView, textScale } = useAppStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login'
      const res = await api.post(endpoint, { username, password })

      if (isRegister) {
        // After register, automatically log in
        const loginRes = await api.post('/auth/login', { username, password })
        setToken(loginRes.data.access_token)
      } else {
        setToken(res.data.access_token)
      }

      // Fetch user profile and store
      const meRes = await api.get('/auth/me')
      setUser(meRes.data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to connect. Please check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`min-h-screen min-h-[100dvh] w-full bg-[#161920] text-[#c8cdd8] flex flex-col justify-between relative overflow-x-hidden overflow-y-auto selection:bg-[#6c8cff]/30 selection:text-[#6c8cff] pt-[env(safe-area-inset-top,0.75rem)] pb-[env(safe-area-inset-bottom,1rem)] ${
        softView ? 'soft-view-mode' : ''
      } ${textScale === 'large' ? 'text-scale-large' : ''}`}
    >
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[#6c8cff]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[#5fd38d]/8 blur-3xl pointer-events-none" />

      {/* Top Bar: Minimal Brand Only with iOS notch padding */}
      <header className="w-full px-4 sm:px-6 py-3 sm:py-5 flex items-center z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1e222b] border border-[#2f343d] flex items-center justify-center text-[#6c8cff] shadow-sm">
            <span className="material-symbols-outlined text-[20px]">spa</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base sm:text-lg tracking-tight text-[#dee3ec]">
              Sensei AI
            </span>
            <span
              className="w-2 h-2 rounded-full bg-[#5fd38d] shadow-[0_0_8px_rgba(95,211,141,0.5)]"
              title="Active"
            />
          </div>
        </div>
      </header>

      {/* Main Centered Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-4 sm:py-8 z-10 w-full my-auto">
        <div className="w-full max-w-[420px] bg-[#1e222b] border border-[#2f343d] rounded-2xl p-5 sm:p-8 shadow-xl flex flex-col gap-5 sm:gap-6 relative">
          
          {/* Header Title */}
          <div className="text-center pt-0.5">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#dee3ec] tracking-tight">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h1>
          </div>

          {/* Segmented Auth Mode Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#161920] border border-[#2f343d] text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false)
                setError('')
              }}
              className={`h-9 sm:h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer select-none active:scale-[0.98] ${
                !isRegister
                  ? 'bg-[#1e222b] text-[#dee3ec] shadow-sm font-semibold border border-[#2f343d]'
                  : 'text-[#939aa8] hover:text-[#dee3ec]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true)
                setError('')
              }}
              className={`h-9 sm:h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer select-none active:scale-[0.98] ${
                isRegister
                  ? 'bg-[#1e222b] text-[#dee3ec] shadow-sm font-semibold border border-[#2f343d]'
                  : 'text-[#939aa8] hover:text-[#dee3ec]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#939aa8] uppercase tracking-wider">
                Username
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[#939aa8] flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  /* text-base on mobile prevents iOS Safari automatic viewport zooming */
                  className="w-full h-12 bg-[#161920] border border-[#2f343d] focus:border-[#6c8cff] focus:ring-1 focus:ring-[#6c8cff] rounded-xl pl-10 pr-4 text-base sm:text-sm text-[#c8cdd8] placeholder-[#939aa8]/50 outline-none transition-all font-mono"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono font-medium text-[#939aa8] uppercase tracking-wider">
                  Password
                </label>
                {isRegister && (
                  <span className="text-[11px] text-[#939aa8] font-mono">
                    Min 6 characters
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[#939aa8] flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  /* text-base on mobile prevents iOS Safari automatic viewport zooming */
                  className="w-full h-12 bg-[#161920] border border-[#2f343d] focus:border-[#6c8cff] focus:ring-1 focus:ring-[#6c8cff] rounded-xl pl-10 pr-12 text-base sm:text-sm text-[#c8cdd8] placeholder-[#939aa8]/50 outline-none transition-all font-mono"
                  placeholder="••••••••"
                  required
                />
                {/* 44px touch target for iOS HIG */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1.5 w-10 h-10 flex items-center justify-center text-[#939aa8] hover:text-[#dee3ec] active:text-[#dee3ec] transition-colors cursor-pointer rounded-lg"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 flex items-start gap-2.5 text-xs text-[#ffb4ab] animate-fadeIn">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Submit Button (48px / h-12 height for comfortable thumb tap) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#6c8cff] hover:bg-[#809cff] active:scale-[0.98] text-[#001e60] font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#6c8cff]/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#6c8cff] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed mt-2 select-none"
            >
              {loading ? (
                <span className="material-symbols-outlined text-[20px] animate-spin">
                  progress_activity
                </span>
              ) : (
                <>
                  <span>{isRegister ? 'Sign Up' : 'Sign In'}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Subtle bottom spacing for iOS home indicator */}
      <div className="h-4 sm:h-6 shrink-0" />
    </div>
  )
}
