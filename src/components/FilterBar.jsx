import { useState } from 'react'
import { Search, Filter, X, RefreshCw } from 'lucide-react'
import { useMappingIds } from '../hooks/useMappingIds'

export function FilterBar({ filters, onFiltersChange, onRefresh, loading }) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const { mappingIds, loading: mappingIdsLoading } = useMappingIds()
  
  const updateFilter = (key, value) => {
    let processedValue = value === '' ? undefined : value
    
    // Convert mappingId to number if it's a numeric string
    if (key === 'mappingId' && processedValue !== undefined) {
      const numValue = parseInt(processedValue)
      if (!isNaN(numValue)) {
        processedValue = numValue
      }
    }
    
    onFiltersChange({
      ...filters,
      [key]: processedValue
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
    setShowAdvanced(false)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '')

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-secondary p-2"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`btn-secondary p-2 ${showAdvanced ? 'bg-primary-100 text-primary-700' : ''}`}
            title="Advanced filters"
          >
            <Filter className="w-4 h-4" />
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn-secondary p-2 text-red-600 hover:bg-red-50"
              title="Clear all filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Basic Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search document names..."
          value={filters.documentName || ''}
          onChange={(e) => updateFilter('documentName', e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Result Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Result
              </label>
              <select
                value={filters.result === undefined ? '' : filters.result.toString()}
                onChange={(e) => updateFilter('result', e.target.value === '' ? undefined : e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Results</option>
                <option value="true">Met</option>
                <option value="false">Not Met</option>
              </select>
            </div>

            {/* Mapping ID Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mapping ID
                {!mappingIdsLoading && mappingIds.length > 0 && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({mappingIds.length} available)
                  </span>
                )}
              </label>
              <select
                value={filters.mappingId || ''}
                onChange={(e) => updateFilter('mappingId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={mappingIdsLoading}
              >
                <option value="">
                  {mappingIdsLoading ? 'Loading mapping IDs...' : 'All Mapping IDs'}
                </option>
                {mappingIds.map(mappingId => (
                  <option key={mappingId} value={mappingId}>
                    {mappingId}
                  </option>
                ))}
              </select>
            </div>

            {/* User ID Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <input
                type="text"
                placeholder="Enter user ID..."
                value={filters.userId || ''}
                onChange={(e) => updateFilter('userId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (value === undefined || value === '') return null
              
              let displayValue = value
              if (key === 'result') {
                displayValue = value ? 'Met' : 'Not Met'
              }
              
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                >
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="font-medium">{displayValue}</span>
                  <button
                    onClick={() => updateFilter(key, undefined)}
                    className="ml-1 hover:bg-primary-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
} 