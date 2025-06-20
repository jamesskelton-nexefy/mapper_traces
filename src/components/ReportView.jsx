import { useMemo } from 'react'
import { format } from 'date-fns'
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  ArrowLeft,
  Download
} from 'lucide-react'
import { Pagination } from './Pagination'
import { LoadingSpinner } from './LoadingSpinner'
import { FilterBar } from './FilterBar'

export function ReportView({ 
  traces, 
  overallStats, 
  onBack, 
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  loading,
  filters,
  onFiltersChange,
  refetch
}) {
  // Calculate page-specific statistics
  const pageStats = useMemo(() => {
    if (!traces.length) return { total: 0, met: 0, notMet: 0 }
    
    const met = traces.filter(trace => trace.response_data?.result === true).length
    const notMet = traces.filter(trace => trace.response_data?.result === false).length
    const total = traces.length

    return { total, met, notMet }
  }, [traces])

  // Process traces into report format
  const reportData = useMemo(() => {
    return traces.map(trace => {
      const responseData = trace.response_data || {}
      const promptObject = trace.prompt_object || {}
      
      // Extract criteria name from prompt messages
      let criteriaName = 'Unknown Criteria'
      if (promptObject?.messages) {
        const systemMessage = promptObject.messages.find(msg => msg.role === 'system')?.content
        const userMessage = promptObject.messages.find(msg => msg.role === 'user')?.content
        
        // Try to extract a meaningful criteria name from the prompt
        if (systemMessage) {
          // Look for patterns like "Evaluate..." or criteria descriptions
          const match = systemMessage.match(/(?:Evaluate|Check|Verify|Assess)\s+([^.]+)/i)
          if (match) {
            criteriaName = match[1].trim()
          } else {
            criteriaName = systemMessage.trim()
          }
        } else if (userMessage) {
          criteriaName = userMessage.trim()
        }
      }
      
      // Extract mapped from/to document names
      let mappedFromDoc = 'Unknown'
      let mappedToDoc = 'Unknown'
      
      // Try to get mapping document names from various possible fields
      if (trace.source_document_name && trace.target_document_name) {
        mappedFromDoc = trace.source_document_name
        mappedToDoc = trace.target_document_name
      } else if (trace.from_document_name && trace.to_document_name) {
        mappedFromDoc = trace.from_document_name
        mappedToDoc = trace.to_document_name
      } else if (trace.document_a_name && trace.document_b_name) {
        mappedFromDoc = trace.document_a_name
        mappedToDoc = trace.document_b_name
      } else if (responseData?.source_document && responseData?.target_document) {
        mappedFromDoc = responseData.source_document
        mappedToDoc = responseData.target_document
      } else if (promptObject?.source_document && promptObject?.target_document) {
        mappedFromDoc = promptObject.source_document
        mappedToDoc = promptObject.target_document
      } else {
        // Fallback: use current document_name as one of the documents
        mappedFromDoc = trace.document_name || 'Unknown'
        mappedToDoc = 'Target Document'
      }
      
      return {
        id: trace.id,
        criteriaName,
        result: responseData?.result,
        reasoning: responseData?.reasoning || 'No reasoning provided',
        confidence: responseData?.confidence,
        documentName: trace.document_name,
        mappedFromDoc,
        mappedToDoc,
        createdAt: trace.created_at,
        criteriaId: trace.criteria_id
      }
    })
  }, [traces])

  const getResultIcon = (result) => {
    if (result === true) {
      return <CheckCircle className="w-5 h-5 text-green-600" />
    } else if (result === false) {
      return <XCircle className="w-5 h-5 text-red-600" />
    }
    return <div className="w-5 h-5 rounded-full bg-gray-300" />
  }

  const getResultText = (result) => {
    if (result === true) return 'PASSED'
    if (result === false) return 'FAILED'
    return 'UNKNOWN'
  }

  const getResultBadgeColor = (result) => {
    if (result === true) return 'bg-green-100 text-green-800 border-green-200'
    if (result === false) return 'bg-red-100 text-red-800 border-red-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Traces
              </button>
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Report View
                  </h1>
                  <p className="text-sm text-gray-500">
                    Criteria evaluation results
                  </p>
                </div>
              </div>
            </div>
            <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                     <div className="bg-white rounded-lg border border-gray-200 p-6">
             <div className="flex items-center gap-3">
               <FileText className="w-8 h-8 text-blue-600" />
               <div>
                 <p className="text-sm font-medium text-gray-600">Total Criteria</p>
                 <p className="text-2xl font-bold text-gray-900">{overallStats.total.toLocaleString()}</p>
                 <p className="text-xs text-gray-500">{pageStats.total} on current page</p>
               </div>
             </div>
           </div>
           
           <div className="bg-white rounded-lg border border-gray-200 p-6">
             <div className="flex items-center gap-3">
               <CheckCircle className="w-8 h-8 text-green-600" />
               <div>
                 <p className="text-sm font-medium text-gray-600">Passed</p>
                 <p className="text-2xl font-bold text-green-600">{overallStats.met.toLocaleString()}</p>
                 <p className="text-xs text-gray-500">{pageStats.met} on current page</p>
               </div>
             </div>
           </div>
           
           <div className="bg-white rounded-lg border border-gray-200 p-6">
             <div className="flex items-center gap-3">
               <XCircle className="w-8 h-8 text-red-600" />
               <div>
                 <p className="text-sm font-medium text-gray-600">Failed</p>
                 <p className="text-2xl font-bold text-red-600">{overallStats.notMet.toLocaleString()}</p>
                 <p className="text-xs text-gray-500">{pageStats.notMet} on current page</p>
               </div>
             </div>
           </div>
          
                     <div className="bg-white rounded-lg border border-gray-200 p-6">
             <div className="flex items-center gap-3">
               {overallStats.metRate >= 70 ? (
                 <TrendingUp className="w-8 h-8 text-green-600" />
               ) : (
                 <TrendingDown className="w-8 h-8 text-red-600" />
               )}
               <div>
                 <p className="text-sm font-medium text-gray-600">Success Rate</p>
                 <p className={`text-2xl font-bold ${overallStats.metRate >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                   {overallStats.metRate}%
                 </p>
                 <p className="text-xs text-gray-500">Page {currentPage} of {totalPages}</p>
               </div>
             </div>
           </div>
                 </div>

         {/* Filters */}
         <div className="mb-6">
           <FilterBar
             filters={filters}
             onFiltersChange={onFiltersChange}
             onRefresh={refetch}
             loading={loading}
           />
         </div>

         {/* Report Table */}
         <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-200">
             <div className="flex items-center justify-between">
                                <div>
                   <h2 className="text-lg font-semibold text-gray-900">Criteria Evaluation Results</h2>
                   <p className="text-sm text-gray-500 mt-1">
                     Detailed breakdown of each criteria evaluation with document mapping information
                     {Object.keys(filters).length > 0 && ' (filtered)'}
                   </p>
                 </div>
               {totalPages > 1 && (
                 <div className="text-sm text-gray-500">
                   Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()} results
                 </div>
               )}
             </div>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full min-w-[1200px]">
                             <thead className="bg-gray-50">
                 <tr>
                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Criteria Name
                   </th>
                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Mapped From
                   </th>
                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Mapped To
                   </th>
                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Result
                   </th>
                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Reasoning
                   </th>
                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Evaluated
                   </th>
                 </tr>
               </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                                 {reportData.map((item, index) => (
                   <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                     <td className="px-4 py-4">
                       <div className="text-sm font-medium text-gray-900 break-words">
                         {item.criteriaName}
                       </div>
                       <div className="text-xs text-gray-500 mt-1">
                         ID: {item.criteriaId}
                       </div>
                     </td>
                     <td className="px-4 py-4">
                       <div className="text-sm text-gray-900 break-words">
                         {item.mappedFromDoc}
                       </div>
                     </td>
                     <td className="px-4 py-4">
                       <div className="text-sm text-gray-900 break-words">
                         {item.mappedToDoc}
                       </div>
                     </td>
                     <td className="px-4 py-4">
                       <div className="flex items-center gap-2">
                         {getResultIcon(item.result)}
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getResultBadgeColor(item.result)}`}>
                           {getResultText(item.result)}
                         </span>
                       </div>
                       {item.confidence && (
                         <div className="text-xs text-gray-500 mt-1">
                           Confidence: {item.confidence}
                         </div>
                       )}
                     </td>
                     <td className="px-4 py-4">
                       <div className="text-sm text-gray-900 break-words">
                         {item.reasoning}
                       </div>
                     </td>
                     <td className="px-4 py-4 text-sm text-gray-500">
                       {format(new Date(item.createdAt), 'MMM d, yyyy')}
                       <div className="text-xs text-gray-400">
                         {format(new Date(item.createdAt), 'HH:mm')}
                       </div>
                     </td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>
          
                     {reportData.length === 0 && (
             <div className="text-center py-12">
               <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
               <h3 className="text-lg font-medium text-gray-900 mb-2">
                 No data available
               </h3>
               <p className="text-gray-600 mb-4">
                 {Object.keys(filters).length > 0 
                   ? 'No traces found matching the current filters.'
                   : 'No traces found to generate a report.'}
               </p>
               {Object.keys(filters).length > 0 && (
                 <button
                   onClick={() => onFiltersChange({})}
                   className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                 >
                   Clear Filters
                 </button>
               )}
             </div>
           )}
         </div>

         {/* Loading overlay for pagination */}
         {loading && traces.length > 0 && (
           <div className="mt-6">
             <LoadingSpinner size="sm" text="Loading more results..." />
           </div>
         )}

         {/* Pagination */}
         {totalPages > 1 && (
           <div className="mt-8">
             <Pagination
               currentPage={currentPage}
               totalPages={totalPages}
               totalCount={totalCount}
               pageSize={pageSize}
               onPageChange={onPageChange}
               loading={loading}
             />
           </div>
         )}
       </main>
     </div>
   )
 } 