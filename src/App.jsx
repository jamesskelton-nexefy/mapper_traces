import { useState, useMemo } from 'react'
import { Database, FileText, CheckCircle, XCircle, Activity, Eye, BarChart3, Copy } from 'lucide-react'

import { useTraces } from './hooks/useTraces'
import { TraceCard } from './components/TraceCard'
import { FilterBar } from './components/FilterBar'
import { Pagination } from './components/Pagination'
import { LoadingSpinner } from './components/LoadingSpinner'
import { ErrorMessage } from './components/ErrorMessage'
import { StatsCard } from './components/StatsCard'
import { DocumentViewer } from './components/DocumentViewer'
import { ReportView } from './components/ReportView'
import { DuplicationsView } from './components/DuplicationsView'

function App() {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({})
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)
  const [currentView, setCurrentView] = useState('traces') // 'traces', 'report', or 'duplications'
  const pageSize = 10

  const { 
    traces, 
    loading, 
    error, 
    totalCount, 
    totalPages,
    overallStats,
    refetch 
  } = useTraces(currentPage, pageSize, filters)

  // Calculate page-specific statistics for display context
  const pageStats = useMemo(() => {
    if (!traces.length) return { total: 0, met: 0, notMet: 0 }
    
    const met = traces.filter(trace => trace.response_data?.result === true).length
    const notMet = traces.filter(trace => trace.response_data?.result === false).length
    const total = traces.length

    return { total, met, notMet }
  }, [traces])

  // Get document information from the first trace
  const documentInfo = useMemo(() => {
    if (!traces.length) return null
    const firstTrace = traces[0]
    return {
      name: firstTrace.document_name,
      checksum: firstTrace.document_checksum
    }
  }, [traces])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // If report view is active, render the report component
  if (currentView === 'report') {
    return (
      <ReportView 
        traces={traces}
        overallStats={overallStats}
        onBack={() => setCurrentView('traces')}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        loading={loading}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        refetch={refetch}
      />
    )
  }

  // If duplications view is active, render the duplications component
  if (currentView === 'duplications') {
    return (
      <DuplicationsView 
        onBack={() => setCurrentView('traces')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Mapper Traces Viewer
                </h1>
                <p className="text-sm text-gray-500">
                  LLM Prompt Traces from Supabase
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('report')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  Report View
                </button>
                <button
                  onClick={() => setCurrentView('duplications')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 hover:border-orange-300 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Duplications
                </button>
              </div>
              <button
                onClick={() => setShowDocumentViewer(true)}
                disabled={!documentInfo}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Document Content
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Activity className="w-4 h-4" />
                <span>Real-time data</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Traces"
            value={overallStats.total.toLocaleString()}
            subtitle={`${pageStats.total} on current page`}
            icon={FileText}
          />
          <StatsCard
            title="Criteria Met"
            value={overallStats.met.toLocaleString()}
            subtitle={`${overallStats.metRate}% success rate`}
            icon={CheckCircle}
            trend={overallStats.metRate > 50 ? 'up' : overallStats.metRate < 50 ? 'down' : 'neutral'}
          />
          <StatsCard
            title="Criteria Not Met"
            value={overallStats.notMet.toLocaleString()}
            subtitle={`${100 - overallStats.metRate}% failure rate`}
            icon={XCircle}
            trend={overallStats.metRate < 50 ? 'up' : overallStats.metRate > 50 ? 'down' : 'neutral'}
          />
          <StatsCard
            title="Current Page"
            value={currentPage}
            subtitle={`of ${totalPages} pages`}
            icon={Database}
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <FilterBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onRefresh={refetch}
            loading={loading}
          />
        </div>

        {/* Content */}
        {error ? (
          <ErrorMessage error={error} onRetry={refetch} />
        ) : loading && traces.length === 0 ? (
          <LoadingSpinner text="Loading traces..." />
        ) : traces.length === 0 ? (
          <div className="card">
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No traces found
              </h3>
              <p className="text-gray-600 mb-4">
                {Object.keys(filters).length > 0 
                  ? 'Try adjusting your filters to see more results.'
                  : 'There are no LLM prompt traces in the database yet.'}
              </p>
              {Object.keys(filters).length > 0 && (
                <button
                  onClick={() => handleFiltersChange({})}
                  className="btn-primary"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Traces List */}
            <div className="space-y-6">
              {traces.map((trace) => (
                <TraceCard key={trace.id} trace={trace} />
              ))}
            </div>

            {/* Loading overlay for pagination */}
            {loading && traces.length > 0 && (
              <div className="mt-6">
                <LoadingSpinner size="sm" text="Loading more traces..." />
              </div>
            )}

            {/* Pagination */}
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                loading={loading}
              />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Database className="w-4 h-4" />
              <span>Connected to Supabase</span>
            </div>
            <div className="text-sm text-gray-500">
              Built with React + Supabase
            </div>
          </div>
        </div>
      </footer>

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={showDocumentViewer}
        onClose={() => setShowDocumentViewer(false)}
        documentName={documentInfo?.name}
        documentChecksum={documentInfo?.checksum}
        traces={traces}
      />
    </div>
  )
}

export default App 