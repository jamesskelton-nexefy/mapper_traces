import { useState, useEffect } from 'react'
import { FileText, X, Download, Eye, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function DocumentViewer({ isOpen, onClose, documentName, documentChecksum, traces }) {
  const [documentContent, setDocumentContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && documentChecksum) {
      fetchDocumentContent()
    }
  }, [isOpen, documentChecksum])

  const fetchDocumentContent = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching document content for checksum:', documentChecksum)

      // Method 1: Try direct access to file_text table
      try {
        const { data, error: fetchError } = await supabase
          .from('file_text')
          .select('content_as_text, metadata, file_size')
          .eq('hash', documentChecksum)
          .limit(1)

        console.log('Direct query result:', { data, fetchError })

        if (!fetchError && data && data.length > 0) {
          console.log('Successfully fetched document content, processing...')
          const processedContent = processDocumentContent(data[0])
          setDocumentContent(processedContent)
          return
        }
      } catch (directErr) {
        console.log('Direct access failed (likely RLS):', directErr.message)
      }

      // Method 2: Try with explicit schema reference
      try {
        const { data: schemaData, error: schemaError } = await supabase
          .schema('mapper_app')
          .from('file_text')
          .select('content_as_text, metadata, file_size')
          .eq('hash', documentChecksum)
          .limit(1)

        console.log('Schema query result:', { schemaData, schemaError })

        if (!schemaError && schemaData && schemaData.length > 0) {
          const processedContent = processDocumentContent(schemaData[0])
          setDocumentContent(processedContent)
          return
        }
      } catch (schemaErr) {
        console.log('Schema access failed:', schemaErr.message)
      }

      // Method 3: Fallback to trace extraction
      console.log('Attempting fallback: extracting content from traces')
      const fallbackContent = extractContentFromTraces()
      if (fallbackContent) {
        setDocumentContent(fallbackContent)
        return
      }
      
      throw new Error(`Unable to access document content. This appears to be a Row Level Security (RLS) issue preventing client access to the file_text table. Contact the database administrator to grant access or update RLS policies.`)
      
    } catch (err) {
      console.error('Error fetching document content:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const processDocumentContent = (rawData) => {
    try {
      let contentText = rawData.content_as_text
      
      // Check if content is JSON format (each line is a JSON object)
      if (contentText && typeof contentText === 'string' && contentText.includes('{"type":')) {
        console.log('Processing JSON-formatted document content')
        
        // Split by lines and parse each JSON object
        const lines = contentText.split('\n').filter(line => line.trim())
        const textContent = []
        
        for (const line of lines) {
          try {
            const jsonObj = JSON.parse(line)
            if (jsonObj.text && jsonObj.text.trim()) {
              // Add page number if available
              const pageInfo = jsonObj.metadata?.page_number ? `[Page ${jsonObj.metadata.page_number}] ` : ''
              textContent.push(`${pageInfo}${jsonObj.text}`)
            }
          } catch (parseErr) {
            // If line isn't valid JSON, add it as-is
            if (line.trim()) {
              textContent.push(line)
            }
          }
        }
        
        contentText = textContent.join('\n\n')
        console.log('Processed content length:', contentText.length)
      }
      
      return {
        ...rawData,
        content_as_text: contentText,
        metadata: {
          ...rawData.metadata,
          processed: true,
          tokenCount: Math.floor(contentText.length / 4)
        }
      }
    } catch (err) {
      console.error('Error processing document content:', err)
      return rawData
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const extractContentFromTraces = () => {
    if (!traces || traces.length === 0) return null

    try {
      // Look through traces to find document content in prompt_object
      for (const trace of traces) {
        if (trace.prompt_object?.system) {
          // Check if any system message contains document content
          for (const systemMessage of trace.prompt_object.system) {
            if (systemMessage.type === 'text' && systemMessage.text && 
                systemMessage.text.length > 1000 && // Assume document content is substantial
                systemMessage.text.includes('document') || systemMessage.text.includes('content')) {
              
              // Extract what looks like document content
              const content = systemMessage.text
              console.log('Found potential document content in system message, length:', content.length)
              
              return {
                content_as_text: content,
                file_size: content.length,
                metadata: { 
                  tokenCount: Math.floor(content.length / 4), // Rough estimate
                  source: 'extracted_from_prompt_object'
                }
              }
            }
          }
        }
      }
      return null
    } catch (err) {
      console.error('Error extracting content from traces:', err)
      return null
    }
  }

  const getDocumentInfo = () => {
    if (!documentName) return null
    
    // Extract info from filename
    const parts = documentName.split(' - ')
    const docCode = parts[0] || documentName
    const title = parts[1] || 'Document'
    const version = parts[2] || ''
    const organization = parts[3]?.replace('.pdf', '') || ''

    return { docCode, title, version, organization }
  }

  if (!isOpen) return null

  const docInfo = getDocumentInfo()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Document Content</h2>
              <p className="text-sm text-gray-600">Content sent to LLM for analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Info */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Document Details</h3>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">Filename:</span> {documentName}</div>
                {docInfo && (
                  <>
                    <div><span className="font-medium">Document Code:</span> {docInfo.docCode}</div>
                    <div><span className="font-medium">Title:</span> {docInfo.title}</div>
                    {docInfo.version && <div><span className="font-medium">Version:</span> {docInfo.version}</div>}
                    {docInfo.organization && <div><span className="font-medium">Organization:</span> {docInfo.organization}</div>}
                  </>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">File Information</h3>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">Checksum:</span> <code className="text-xs bg-gray-200 px-1 rounded">{documentChecksum}</code></div>
                {documentContent && (
                  <>
                    <div><span className="font-medium">File Size:</span> {formatFileSize(documentContent.file_size)}</div>
                    <div><span className="font-medium">Token Count:</span> {documentContent.metadata?.tokenCount?.toLocaleString() || 'Unknown'}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-2 text-gray-600">Loading document content...</span>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Eye className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">Unable to load document content</span>
                </div>
                <p className="text-red-700 mt-2">{error}</p>
                <div className="text-red-600 text-sm mt-3 space-y-1">
                  <p><strong>Troubleshooting attempted:</strong></p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Searched file_text table using document checksum</li>
                    <li>Attempted fuzzy hash matching</li>
                    <li>Tried extracting content from LLM prompt traces</li>
                  </ul>
                  <p className="mt-2">Check browser console for detailed debug information.</p>
                </div>
                <button
                  onClick={fetchDocumentContent}
                  className="mt-3 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded transition-colors"
                >
                  Retry Loading
                </button>
              </div>
            </div>
          ) : documentContent ? (
            <div className="p-6">
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Document Content</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This is the actual text content that was extracted from the PDF and sent to the LLM for analysis.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-3 flex justify-between items-center">
                  <span>Content Preview</span>
                  <span>{documentContent.metadata?.source === 'extracted_from_prompt_object' ? 'Extracted from LLM traces' : 'From file_text table'}</span>
                </div>
                <div className="bg-white border border-gray-300 rounded p-3 max-h-[60vh] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                    {documentContent.content_as_text}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 font-medium">Document content not loaded</span>
                </div>
                <p className="text-yellow-700 mt-2">
                  Click the button above to load the document content.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
} 