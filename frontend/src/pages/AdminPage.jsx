import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAppStore } from '../store/appStore'

/**
 * AdminPage - Kill Switch + Usage Dashboard
 *
 * This is your emergency control panel.
 * - See how many tokens have been used today / this month
 * - Estimated cost in USD
 * - Big red button to kill all LLM calls instantly
 */
export default function AdminPage() {
  const [status, setStatus] = useState(null)
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)
  const logout = useAppStore((state) => state.logout)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statusRes, usageRes] = await Promise.all([
        api.get('/admin/status'),
        api.get('/admin/usage'),
      ])
      setStatus(statusRes.data)
      setUsage(usageRes.data)
    } catch (err) {
      console.error('Failed to fetch admin data', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleKillSwitch = async () => {
    const newState = !status.kill_switch_active
    try {
      const res = await api.post('/admin/kill-switch', { active: newState })
      setStatus({ ...status, kill_switch_active: res.data.kill_switch_active })
      alert(res.data.message)
    } catch (err) {
      console.error('Failed to toggle kill switch', err)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p>Loading admin data...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">🛡️ Admin Panel</h1>
        <button onClick={logout} className="text-red-400 hover:text-red-300 text-sm">Logout</button>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">

        {/* Kill Switch */}
        <div className={status?.kill_switch_active ? 'rounded-xl p-6 border-2 border-red-500 bg-red-950' : 'rounded-xl p-6 border-2 border-gray-700 bg-gray-900'}>
          <h2 className="text-lg font-bold mb-1">☢️ Kill Switch</h2>
          <p className="text-gray-400 text-sm mb-4">
            {status?.kill_switch_active
              ? 'ACTIVE - All LLM calls are BLOCKED'
              : 'Inactive - LLM calls are allowed'}
          </p>
          <button
            onClick={toggleKillSwitch}
            className={status?.kill_switch_active ? 'bg-green-600 hover:bg-green-700 font-bold py-2 px-6 rounded-lg' : 'bg-red-600 hover:bg-red-700 font-bold py-2 px-6 rounded-lg'}
          >
            {status?.kill_switch_active ? 'Re-enable LLM' : 'KILL ALL LLM CALLS'}
          </button>
        </div>

        {/* Usage Stats */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">📊 Token Usage</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{usage?.total_input_tokens?.toLocaleString() || 0}</p>
              <p className="text-xs text-gray-400">Input tokens</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{usage?.total_output_tokens?.toLocaleString() || 0}</p>
              <p className="text-xs text-gray-400">Output tokens</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">${usage?.total_estimated_cost_usd?.toFixed(4) || '0.0000'}</p>
              <p className="text-xs text-gray-400">Estimated cost</p>
            </div>
          </div>

          {/* Daily breakdown */}
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Daily Breakdown (Last 30 days)</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {usage?.daily_breakdown?.length === 0 ? (
              <p className="text-gray-500 text-sm">No usage yet.</p>
            ) : (
              usage?.daily_breakdown?.map((d) => (
                <div key={d.date} className="flex justify-between text-sm py-1 border-b border-gray-800">
                  <span className="text-gray-400">{d.date}</span>
                  <span>{d.input_tokens + d.output_tokens} tokens</span>
                  <span className="text-green-400">${d.estimated_cost_usd.toFixed(4)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Limits info */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">🛡️ Guardrail Limits</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Daily token limit</span><span>{status?.daily_token_limit?.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Monthly token limit</span><span>{status?.monthly_token_limit?.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Rate limit (per hour)</span><span>{status?.rate_limit_per_hour} requests</span></div>
          </div>
        </div>

      </main>
    </div>
  )
}
