import { useState } from 'react'
import { format } from 'date-fns'
import { 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  User, 
  Calendar,
  CheckCircle,
  XCircle,
  Hash,
  Eye,
  Code
} from 'lucide-react'
import { JsonViewer } from './JsonViewer'

export function TraceCard({ trace }) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const responseData = trace.response_data || {}
  const promptObject = trace.prompt_object || {}

  const getResultBadge = (result) => {
    if (result === true) {
      return (
        <span className="badge badge-success">
          <CheckCircle className="w-3 h-3 mr-1" />
          Met
        </span>
      )
    } else if (result === false) {
      return (
        <span className="badge badge-error">
          <XCircle className="w-3 h-3 mr-1" />
          Not Met
        </span>
      )
    }
    return (
      <span className="badge badge-info">
        Unknown
      </span>
    )
  }

  const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <h3 className="font-medium text-gray-900 truncate">
              {trace.document_name}
            </h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Hash className="w-3 h-3" />
              ID: {trace.id}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(trace.created_at), 'MMM d, yyyy HH:mm')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {responseData?.result !== undefined && getResultBadge(responseData.result)}
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn-secondary p-2"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {responseData?.summary ? truncateText(responseData.summary) : 'No summary available'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <div className="text-xs text-gray-500">Mapping ID</div>
          <div className="font-medium">{trace.mapping_id}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Criteria ID</div>
          <div className="font-medium">{trace.criteria_id}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Model</div>
          <div className="font-medium text-xs">{promptObject?.model || 'N/A'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Confidence</div>
          <div className="font-medium">{responseData?.confidence || 'N/A'}</div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t pt-4">
          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-4 border-b">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'prompt', label: 'Prompt', icon: Code },
              { id: 'response', label: 'Response', icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Document Details</h4>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                    <div><strong>Name:</strong> {trace.document_name}</div>
                    <div><strong>Checksum:</strong> <code className="text-xs">{trace.document_checksum}</code></div>
                    <div><strong>User ID:</strong> <code className="text-xs">{trace.user_id}</code></div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Criteria Information</h4>
                  <div className="bg-blue-50 p-3 rounded-lg space-y-2 text-sm">
                    <div><strong>Criteria ID:</strong> <code className="text-xs">{trace.criteria_id}</code></div>
                    <div><strong>Mapping ID:</strong> <code className="text-xs">{trace.mapping_id}</code></div>
                    <div><strong>Mapping Detail ID:</strong> <code className="text-xs">{trace.mapping_detail_id}</code></div>
                    {promptObject?.messages && promptObject.messages.length > 0 && (
                      <div className="mt-2">
                        <strong>Criterion Context:</strong>
                        <div className="mt-1 p-2 bg-white rounded border text-xs max-h-32 overflow-y-auto">
                          {promptObject.messages.find(msg => msg.role === 'system')?.content || 
                           promptObject.messages.find(msg => msg.role === 'user')?.content ||
                           'No criterion text found in messages'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {responseData?.reasoning && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Reasoning</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      {responseData.reasoning}
                    </div>
                  </div>
                )}

                {responseData?.suggestions && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Suggestions</h4>
                    <div className="bg-blue-50 p-3 rounded-lg text-sm">
                      {responseData.suggestions}
                    </div>
                  </div>
                )}

                {responseData?.references && responseData.references.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">References ({responseData.references.length})</h4>
                    <div className="space-y-2">
                      {responseData.references.map((ref, index) => (
                        <div key={index} className="bg-green-50 p-3 rounded-lg text-sm">
                          <div className="font-medium mb-1">"{ref.quote}"</div>
                          <div className="text-gray-600 text-xs">
                            {ref.section} - Page {ref.page_number} - Item {ref.item_number}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'prompt' && (
              <div>
                <JsonViewer 
                  data={promptObject} 
                  title="Prompt Object"
                  collapsed={true}
                />
              </div>
            )}

            {activeTab === 'response' && (
              <div>
                <JsonViewer 
                  data={responseData} 
                  title="Response Data"
                  collapsed={false}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 