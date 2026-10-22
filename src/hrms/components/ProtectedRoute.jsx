import { useAuth } from '../context/AuthContext'

// The console login covers the HRMS: wait for the HRMS profile of the console user, no HRMS login.
const ProtectedRoute = ({ children }) => {
  const { user, loading, error, retry } = useAuth()

  if (user) return children

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm text-gray-600">
        Could not load the HRMS profile{error?.response?.data?.message ? `: ${error.response.data.message}` : '.'}
      </p>
      <button type="button" onClick={retry} className="btn-primary">Try again</button>
    </div>
  )
}

export default ProtectedRoute
