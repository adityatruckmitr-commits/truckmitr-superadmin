import axios from 'axios'
import { HRMS_API_BASE, HRMS_TOKEN_KEY, endConsoleSession } from '../env'

const api = axios.create({
  baseURL: HRMS_API_BASE,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(HRMS_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // The console login expired or was revoked: back to the console login
    if (error.response?.status === 401) {
      endConsoleSession()
    }
    return Promise.reject(error)
  }
)

export default api
