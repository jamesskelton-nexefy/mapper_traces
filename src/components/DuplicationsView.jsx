import { useState } from 'react'
import { ArrowLeft, Copy, AlertTriangle, FileText, Hash, Users, BarChart3, Eye, Table, Download } from 'lucide-react'
import { format } from 'date-fns'
import { useDuplicateCriteria } from '../hooks/useDuplicateCriteria'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { StatsCard } from './StatsCard'
import { FilterBar } from './FilterBar'

export function DuplicationsView({ onBack }) {
  const [filters, setFilters] = useState({})
  const { duplicates, loading, error, totalDuplicates, refetch } = useDuplicateCriteria(filters)
  const [expandedGroups, setExpandedGroups] = useState(new Set())
  const [expandedInstances, setExpandedInstances] = useState(new Set())
  const [viewMode, setViewMode] = useState('detailed') // 'detailed' or 'report'

  const toggleGroup = (index) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedGroups(newExpanded)
  }

  const toggleInstance = (instanceKey) => {
    const newExpanded = new Set(expandedInstances)
    if (newExpanded.has(instanceKey)) {
      newExpanded.delete(instanceKey)
    } else {
      newExpanded.add(instanceKey)
    }
    setExpandedInstances(newExpanded)
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const exportReport = () => {
    // Create CSV content
    const headers = [
      'Duplicate Group', 
      'Criterion Text', 
      'Criteria IDs', 
      'Mapping IDs', 
      'Mapping Detail IDs', 
      'Count', 
      'Documents'
    ]
    const rows = duplicates.map((group, index) => [
      `Duplicate #${index + 1}`,
      `"${group.criterionText.replace(/"/g, '""')}"`, // Escape quotes in CSV
      group.uniqueCriteriaIds.join(';'), // Use semicolon to separate IDs
      group.uniqueMappingIds.length > 0 ? group.uniqueMappingIds.join(';') : 'N/A',
      group.uniqueMappingDetailIds.length > 0 ? group.uniqueMappingDetailIds.join(';') : 'N/A',
      group.count,
      group.documents.length
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `duplicate-criteria-report-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }



  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Duplicate Criteria</h1>
                  <p className="text-sm text-gray-500">Error loading duplicates</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorMessage error={error} onRetry={refetch} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Copy className="w-8 h-8 text-orange-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Duplicate Criteria
                </h1>
                <p className="text-sm text-gray-500">
                  Criteria with identical text content (extracted from &lt;criterion&gt; tags)
                  {Object.keys(filters).length > 0 && ' (filtered)'}
                </p>
              </div>
            </div>
                         <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <button
                   onClick={() => setViewMode(viewMode === 'detailed' ? 'report' : 'detailed')}
                   className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-colors"
                 >
                   <Table className="w-4 h-4" />
                   {viewMode === 'detailed' ? 'Report View' : 'Detailed View'}
                 </button>
                 <button
                   onClick={refetch}
                   disabled={loading}
                   className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   <BarChart3 className="w-4 h-4" />
                   Refresh Analysis
                 </button>
               </div>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Duplicate Groups"
            value={duplicates.length.toLocaleString()}
            subtitle="Sets of identical criteria"
            icon={Copy}
            trend="neutral"
          />
          <StatsCard
            title="Total Duplicates"
            value={totalDuplicates.toLocaleString()}
            subtitle="Individual duplicate traces"
            icon={FileText}
            trend="neutral"
          />
          <StatsCard
            title="Avg. per Group"
            value={duplicates.length > 0 ? Math.round(totalDuplicates / duplicates.length) : 0}
            subtitle="Duplicates per criterion"
            icon={BarChart3}
            trend="neutral"
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            onRefresh={refetch}
            loading={loading}
          />
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner text="Analyzing criteria for duplicates..." />
        ) : duplicates.length === 0 ? (
          <div className="card">
            <div className="text-center py-12">
              <Copy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No duplicate criteria found
              </h3>
              <p className="text-gray-600 mb-4">
                {Object.keys(filters).length > 0 
                  ? 'No duplicate criteria found matching the current filters.'
                  : 'All criteria have unique text content.'}
              </p>
              {Object.keys(filters).length > 0 && (
                <button
                  onClick={() => setFilters({})}
                  className="btn-primary"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'report' ? (
          /* Report View */
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Duplicate Criteria Report</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Tabular view of duplicate criteria extracted from &lt;criterion&gt; tags with mapping details
                    {Object.keys(filters).length > 0 && ' (filtered)'}
                  </p>
                </div>
                <button 
                  onClick={exportReport}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Group
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criterion Text
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Criteria IDs
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Mapping IDs
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                      Mapping Detail IDs
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Count
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Documents
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {duplicates.map((group, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium text-gray-900">
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 break-words max-w-md">
                          <div className="line-clamp-3">
                            {group.criterionText}
                          </div>
                          {group.criterionText.length > 150 && (
                            <button
                              onClick={() => copyToClipboard(group.criterionText)}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                            >
                              Click to copy full text
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs font-mono text-gray-700">
                          {group.uniqueCriteriaIds.join(', ')}
                        </div>
                        <button
                          onClick={() => copyToClipboard(group.uniqueCriteriaIds.join(', '))}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                        >
                          Copy IDs
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs font-mono text-gray-700">
                          {group.uniqueMappingIds.length > 0 ? group.uniqueMappingIds.join(', ') : 'N/A'}
                        </div>
                        {group.uniqueMappingIds.length > 0 && (
                          <button
                            onClick={() => copyToClipboard(group.uniqueMappingIds.join(', '))}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            Copy IDs
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs font-mono text-gray-700">
                          {group.uniqueMappingDetailIds.length > 0 ? group.uniqueMappingDetailIds.join(', ') : 'N/A'}
                        </div>
                        {group.uniqueMappingDetailIds.length > 0 && (
                          <button
                            onClick={() => copyToClipboard(group.uniqueMappingDetailIds.join(', '))}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            Copy IDs
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {group.count}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {group.documents.length}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {group.documents.slice(0, 1).map(doc => doc.split('/').pop()).join(', ')}
                          {group.documents.length > 1 && ` +${group.documents.length - 1}`}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Detailed View */
          <div className="space-y-6">
            {duplicates.map((group, index) => (
              <div key={index} className="card">
                {/* Group Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <h3 className="font-medium text-gray-900">
                        Duplicate Criterion #{index + 1}
                      </h3>
                      <span className="badge badge-warning">
                        {group.count} instances
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {group.uniqueCriteriaIds.length} unique criteria IDs
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {group.documents.length} documents
                      </div>
                      <div className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {group.uniqueMappingIds.length} mapping ID{group.uniqueMappingIds.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(group.criterionText)}
                      className="btn-secondary p-2"
                      title="Copy criterion text"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleGroup(index)}
                      className="btn-secondary"
                    >
                      {expandedGroups.has(index) ? 'Show Less' : 'Show Details'}
                    </button>
                  </div>
                </div>

                                 {/* Criterion Text Preview */}
                 <div className="mb-4">
                   <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                     <h4 className="font-medium text-orange-900 mb-2">Criterion Text (from &lt;criterion&gt; tags):</h4>
                     <div className="text-sm text-orange-800 leading-relaxed whitespace-pre-wrap">
                       {group.criterionText}
                     </div>
                   </div>
                 </div>

                                 {/* All instances as clickable boxes */}
                 <div className="mb-4">
                   <div className="flex items-center gap-2 mb-3">
                     <Users className="w-4 h-4 text-gray-500" />
                     <h5 className="font-medium text-gray-900">All Instances ({group.traces.length})</h5>
                     <span className="text-sm text-gray-500">Click to view criterion text</span>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                     {group.traces.map((trace, traceIndex) => {
                       const instanceKey = `${index}-${trace.id}`
                       const isExpanded = expandedInstances.has(instanceKey)
                       const colors = [
                         'bg-blue-50 border-blue-200 hover:bg-blue-100',
                         'bg-green-50 border-green-200 hover:bg-green-100',
                         'bg-purple-50 border-purple-200 hover:bg-purple-100',
                         'bg-pink-50 border-pink-200 hover:bg-pink-100',
                         'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
                         'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                       ]
                       const colorClass = colors[traceIndex % colors.length]
                       
                       return (
                         <div key={trace.id} className="space-y-2">
                           <button
                             onClick={() => toggleInstance(instanceKey)}
                             className={`w-full p-4 rounded-lg border-2 text-left transition-colors cursor-pointer ${colorClass}`}
                           >
                             <div className="flex items-center gap-2 mb-3">
                               <div className={`w-3 h-3 rounded-full ${
                                 traceIndex % 6 === 0 ? 'bg-blue-500' :
                                 traceIndex % 6 === 1 ? 'bg-green-500' :
                                 traceIndex % 6 === 2 ? 'bg-purple-500' :
                                 traceIndex % 6 === 3 ? 'bg-pink-500' :
                                 traceIndex % 6 === 4 ? 'bg-yellow-500' : 'bg-indigo-500'
                               }`} />
                               <h6 className="font-medium text-gray-900">
                                 Instance {traceIndex + 1}
                               </h6>
                               {isExpanded && (
                                 <Eye className="w-4 h-4 text-gray-500 ml-auto" />
                               )}
                             </div>
                             <div className="space-y-2 text-sm">
                               <div>
                                 <span className="font-medium">Criteria ID:</span>
                                 <code className="ml-2 text-xs bg-white px-2 py-1 rounded">
                                   {trace.criteria_id}
                                 </code>
                               </div>
                               <div>
                                 <span className="font-medium">Mapping ID:</span>
                                 <code className="ml-2 text-xs bg-white px-2 py-1 rounded">
                                   {trace.mapping_id || 'N/A'}
                                 </code>
                               </div>
                               <div>
                                 <span className="font-medium">Mapping Detail ID:</span>
                                 <code className="ml-2 text-xs bg-white px-2 py-1 rounded">
                                   {trace.mapping_detail_id || 'N/A'}
                                 </code>
                               </div>
                               <div>
                                 <span className="font-medium">Document:</span>
                                 <span className="ml-2 text-gray-700 text-xs">{trace.document_name}</span>
                               </div>
                               <div>
                                 <span className="font-medium">Created:</span>
                                 <span className="ml-2 text-gray-700 text-xs">
                                   {format(new Date(trace.created_at), 'MMM d, yyyy HH:mm')}
                                 </span>
                               </div>
                             </div>
                           </button>
                           
                           {/* Show criterion text when expanded */}
                           {isExpanded && (
                             <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                               <h6 className="font-medium text-gray-900 mb-2 text-sm">Criterion Text for Validation:</h6>
                               <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded border">
                                 {trace.criterionText}
                               </div>
                             </div>
                           )}
                         </div>
                       )
                     })}
                   </div>
                 </div>

                {/* Documents and IDs Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Affected Documents:</h5>
                    <div className="space-y-1">
                      {group.documents.map((doc) => (
                        <div key={doc} className="text-gray-600 text-xs">
                          • {doc}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Criteria IDs:</h5>
                      <div className="flex flex-wrap gap-1">
                        {group.uniqueCriteriaIds.map((id) => (
                          <code key={id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {id}
                          </code>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Mapping IDs:</h5>
                      <div className="flex flex-wrap gap-1">
                        {group.uniqueMappingIds.length > 0 ? group.uniqueMappingIds.map((id) => (
                          <code key={id} className="text-xs bg-blue-100 px-2 py-1 rounded">
                            {id}
                          </code>
                        )) : <span className="text-xs text-gray-500">None</span>}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Mapping Detail IDs:</h5>
                      <div className="flex flex-wrap gap-1">
                        {group.uniqueMappingDetailIds.length > 0 ? group.uniqueMappingDetailIds.map((id) => (
                          <code key={id} className="text-xs bg-green-100 px-2 py-1 rounded">
                            {id}
                          </code>
                        )) : <span className="text-xs text-gray-500">None</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
} 