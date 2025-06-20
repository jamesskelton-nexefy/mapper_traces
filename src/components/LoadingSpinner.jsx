import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-primary-600 animate-spin mb-2`} />
      {text && (
        <p className={`text-gray-600 ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  )
} 