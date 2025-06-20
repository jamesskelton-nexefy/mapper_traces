import { AlertCircle, RefreshCw } from 'lucide-react'

export function ErrorMessage({ error, onRetry, className = '' }) {
  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    if (error?.error) return error.error
    return 'An unexpected error occurred'
  }

  const getErrorDetails = (error) => {
    if (error?.details) return error.details
    if (error?.hint) return error.hint
    return null
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start">
        <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-medium text-red-800 mb-1">
            Error Loading Data
          </h3>
          <p className="text-red-700 mb-2">
            {getErrorMessage(error)}
          </p>
          {getErrorDetails(error) && (
            <p className="text-red-600 text-sm mb-4">
              {getErrorDetails(error)}
            </p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 