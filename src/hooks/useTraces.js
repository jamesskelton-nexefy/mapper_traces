import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { safeJsonParse, getJsonAsObject } from '../utils/jsonRepair'

export function useTraces(page = 1, pageSize = 20, filters = {}) {
  const [traces, setTraces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [overallStats, setOverallStats] = useState({ total: 0, met: 0, notMet: 0, metRate: 0 })

  useEffect(() => {
    fetchTraces()
    fetchOverallStats()
  }, [page, pageSize, filters])

  const fetchOverallStats = async () => {
    try {
      // Fetch response_data and apply non-result filters at database level
      let query = supabase
        .schema('mapper_app')
        .from('llm_prompt_traces')
        .select('response_data')

      // Apply non-result filters (same as main query)
      if (filters.documentName) {
        query = query.ilike('document_name', `%${filters.documentName}%`)
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters.mappingId) {
        query = query.eq('mapping_id', filters.mappingId)
      }
      // Don't apply result filter at database level - do it client-side for consistency

      const { data, error } = await query

      if (error) throw error

      // Process the data client-side to count results
      let total = 0
      let met = 0
      let notMet = 0

      data.forEach(trace => {
        let resultValue = null

        // Parse response_data using the same logic as main query
        if (typeof trace.response_data === 'string') {
          const result = safeJsonParse(trace.response_data)
          if (result.success) {
            resultValue = result.data?.result
          }
        } else {
          resultValue = trace.response_data?.result
        }

        // If result filter is active, only count records that match
        if (filters.result !== undefined) {
          const matchesFilter = (filters.result === true && resultValue === true) ||
                               (filters.result === false && resultValue === false)
          if (matchesFilter) {
            total++
            if (resultValue === true) {
              met++
            } else if (resultValue === false) {
              notMet++
            }
          }
        } else {
          // No result filter - count all and categorize by result
          total++
          if (resultValue === true) {
            met++
          } else if (resultValue === false) {
            notMet++
          }
        }
      })

      const metRate = total > 0 ? Math.round((met / total) * 100) : 0

      setOverallStats({
        total,
        met,
        notMet,
        metRate
      })
    } catch (err) {
      console.error('Error fetching overall stats:', err)
      // Don't update stats if there's an error, keep previous values
    }
  }

  const fetchTraces = async () => {
    try {
      setLoading(true)
      setError(null)

      // When result filter is active, we need to fetch more data and filter client-side
      // because database LIKE patterns don't work reliably with malformed JSON
      const needsClientSideFiltering = filters.result !== undefined

      let query = supabase
        .schema('mapper_app')
        .from('llm_prompt_traces')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply non-result filters at database level
      if (filters.documentName) {
        query = query.ilike('document_name', `%${filters.documentName}%`)
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters.mappingId) {
        query = query.eq('mapping_id', filters.mappingId)
      }

      // If we need client-side filtering, fetch more records without pagination first
      if (needsClientSideFiltering) {
        // Fetch all matching records (without result filter) to filter client-side
        const { data: allData, error: fetchError } = await query
        
        if (fetchError) throw fetchError

        // Parse and filter client-side
        const filteredData = []
        allData.forEach(trace => {
          let parsedResponseData = trace.response_data
          let resultValue = null

          // Parse response_data using repair utility
          if (typeof trace.response_data === 'string') {
            const result = safeJsonParse(trace.response_data)
            if (result.success) {
              parsedResponseData = result.data
              resultValue = result.data?.result
            }
          } else {
            resultValue = trace.response_data?.result
          }

          // Check if this record matches the result filter
          const matchesFilter = (filters.result === true && resultValue === true) ||
                               (filters.result === false && resultValue === false)

          if (matchesFilter) {
            filteredData.push({
              ...trace,
              response_data: parsedResponseData
            })
          }
        })

        // Apply pagination to filtered data
        const totalFilteredCount = filteredData.length
        const from = (page - 1) * pageSize
        const paginatedData = filteredData.slice(from, from + pageSize)

        // Process remaining JSON parsing for paginated data
        const processedData = paginatedData.map(trace => {
          let parsedPromptObject = trace.prompt_object

          // Parse prompt_object using repair utility
          if (typeof trace.prompt_object === 'string') {
            const result = safeJsonParse(trace.prompt_object)
            if (result.success) {
              parsedPromptObject = result.data
            } else {
              console.error('Error parsing prompt_object for trace', trace.id, ':', result.error)
              parsedPromptObject = { error: 'Failed to parse JSON', raw: trace.prompt_object }
            }
          }

          return {
            ...trace,
            prompt_object: parsedPromptObject
          }
        })

        setTraces(processedData)
        setTotalCount(totalFilteredCount)
        return
      }

      // For non-result filters, use database pagination as before
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      // Parse JSON fields using the advanced JSON repair utility
      const processedData = data.map(trace => {
        let parsedPromptObject = trace.prompt_object
        let parsedResponseData = trace.response_data

        // Parse prompt_object using repair utility
        if (typeof trace.prompt_object === 'string') {
          const result = safeJsonParse(trace.prompt_object)
          if (result.success) {
            parsedPromptObject = result.data
          } else {
            console.error('Error parsing prompt_object for trace', trace.id, ':', result.error)
            console.log('Raw prompt_object:', trace.prompt_object.substring(0, 200) + '...')
            parsedPromptObject = { error: 'Failed to parse JSON', raw: trace.prompt_object }
          }
        }

        // Parse response_data using repair utility
        if (typeof trace.response_data === 'string') {
          const result = safeJsonParse(trace.response_data)
          if (result.success) {
            parsedResponseData = result.data
          } else {
            console.error('Error parsing response_data for trace', trace.id, ':', result.error)
            console.log('Raw response_data:', trace.response_data.substring(0, 200) + '...')
            parsedResponseData = { error: 'Failed to parse JSON', raw: trace.response_data }
          }
        }

        return {
          ...trace,
          prompt_object: parsedPromptObject,
          response_data: parsedResponseData
        }
      })

      setTraces(processedData)
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error fetching traces:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchTraces()
    fetchOverallStats()
  }

  return {
    traces,
    loading,
    error,
    totalCount,
    overallStats,
    refetch,
    hasMore: (page * pageSize) < totalCount,
    totalPages: Math.ceil(totalCount / pageSize)
  }
} 