import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { safeJsonParse } from '../utils/jsonRepair'

export function useDuplicateCriteria(filters = {}) {
  const [duplicates, setDuplicates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalDuplicates, setTotalDuplicates] = useState(0)

  useEffect(() => {
    fetchDuplicateCriteria()
  }, [filters])

  const extractCriterionText = (promptObject) => {
    if (!promptObject?.messages) return null
    
    // First, try to extract text between <criterion> tags from any message
    for (const message of promptObject.messages) {
      if (message.content) {
        const criterionMatch = message.content.match(/<criterion>(.*?)<\/criterion>/s)
        if (criterionMatch) {
          return criterionMatch[1].trim()
        }
      }
    }
    
    // Fallback: Look for criterion text in system or user messages
    const systemMessage = promptObject.messages.find(msg => msg.role === 'system')
    const userMessage = promptObject.messages.find(msg => msg.role === 'user')
    
    return systemMessage?.content || userMessage?.content || null
  }

  const fetchDuplicateCriteria = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all traces to analyze criteria
      let query = supabase
        .schema('mapper_app')
        .from('llm_prompt_traces')
        .select('id, criteria_id, document_name, prompt_object, created_at, mapping_id, mapping_detail_id, user_id')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.documentName) {
        query = query.ilike('document_name', `%${filters.documentName}%`)
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters.mappingId) {
        query = query.eq('mapping_id', filters.mappingId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Process and group by criterion text
      const criteriaMap = new Map()
      const processedTraces = []

      data.forEach(trace => {
        let parsedPromptObject = trace.prompt_object

        // Parse prompt_object if it's a string
        if (typeof trace.prompt_object === 'string') {
          const result = safeJsonParse(trace.prompt_object)
          if (result.success) {
            parsedPromptObject = result.data
          }
        }

        const criterionText = extractCriterionText(parsedPromptObject)
        
        if (criterionText) {
          // If result filter is active, we need to also fetch and check response_data
          // For simplicity in duplications view, we'll skip result filtering for now
          // since we're focusing on criterion text duplicates regardless of results
          
          // Normalize text for comparison (trim whitespace, normalize line breaks)
          const normalizedText = criterionText.trim().replace(/\s+/g, ' ')
          
          if (!criteriaMap.has(normalizedText)) {
            criteriaMap.set(normalizedText, [])
          }
          
          criteriaMap.get(normalizedText).push({
            ...trace,
            criterionText,
            normalizedText
          })
        }
      })

      // Find only groups with duplicates (more than 1 trace)
      const duplicateGroups = []
      criteriaMap.forEach((traces, normalizedText) => {
        if (traces.length > 1) {
          duplicateGroups.push({
            criterionText: traces[0].criterionText, // Use original text for display
            normalizedText,
            traces,
            count: traces.length,
            uniqueCriteriaIds: [...new Set(traces.map(t => t.criteria_id))],
            uniqueMappingIds: [...new Set(traces.map(t => t.mapping_id).filter(id => id !== null))],
            uniqueMappingDetailIds: [...new Set(traces.map(t => t.mapping_detail_id).filter(id => id !== null))],
            documents: [...new Set(traces.map(t => t.document_name))]
          })
        }
      })

      // Sort by count (most duplicates first)
      duplicateGroups.sort((a, b) => b.count - a.count)

      setDuplicates(duplicateGroups)
      setTotalDuplicates(duplicateGroups.reduce((sum, group) => sum + group.count, 0))
    } catch (err) {
      console.error('Error fetching duplicate criteria:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchDuplicateCriteria()
  }

  return {
    duplicates,
    loading,
    error,
    totalDuplicates,
    refetch
  }
} 