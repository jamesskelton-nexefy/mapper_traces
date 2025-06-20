import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useMappingIds() {
  const [mappingIds, setMappingIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMappingIds()
  }, [])

  const fetchMappingIds = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch distinct mapping IDs
      const { data, error: fetchError } = await supabase
        .schema('mapper_app')
        .from('llm_prompt_traces')
        .select('mapping_id')
        .not('mapping_id', 'is', null)
        .order('mapping_id', { ascending: true })

      if (fetchError) throw fetchError

      // Get unique mapping IDs and sort them
      const uniqueMappingIds = [...new Set(data.map(item => item.mapping_id))]
        .filter(id => id !== null && id !== undefined)
        .sort((a, b) => {
          // Sort numerically if both are numbers, otherwise alphabetically
          const aNum = parseInt(a)
          const bNum = parseInt(b)
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum
          }
          return String(a).localeCompare(String(b))
        })

      setMappingIds(uniqueMappingIds)
    } catch (err) {
      console.error('Error fetching mapping IDs:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchMappingIds()
  }

  return {
    mappingIds,
    loading,
    error,
    refetch
  }
}