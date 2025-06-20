import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function StatsCard({ title, value, subtitle, icon: Icon, trend, className = '' }) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {Icon && <Icon className="w-5 h-5 text-gray-500" />}
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon()}
              <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 