/**
 * client.js - API Helper (Axios instance)
 *
 * Instead of writing fetch() everywhere with headers, we create ONE
 * configured axios instance that automatically:
 *   1. Prepends /api to every URL
 *   2. Adds the JWT token to every request header
 *   3. Handles 401 errors (auto-logout if token expires)
 *
 * Usage in any component or hook:
 *   import api from '../api/client'
 *   const projects = await api.get('/projects')
 *   const project = await api.post('/projects', { title: 'Learn Python' })
 *
 * Analogy: This is like a pre-configured Postman collection,
 *          but in code that your app uses automatically.
 */
import axios from 'axios'
import { useAppStore } from '../store/appStore'

// Create an axios instance with our base config
const rawBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')

const api = axios.create({
  baseURL: rawBase ? `${rawBase}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: runs BEFORE every request
// Automatically adds Authorization header with the JWT token
api.interceptors.request.use((config) => {
  const token = useAppStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: runs AFTER every response
// If we get a 401 (unauthorized), clear the token and let App.jsx redirect to /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAppStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export default api
