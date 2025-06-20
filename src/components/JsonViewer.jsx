import { useState } from 'react'
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react'

export function JsonViewer({ data, collapsed = false, title = null }) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed)
  const [copied, setCopied] = useState(false)

  // Handle JSON parsing errors
  if (data && data.error === 'Failed to parse JSON') {
    return (
      <div className="bg-red-900 text-red-100 rounded-lg overflow-hidden font-mono text-sm">
        <div className="bg-red-800 px-4 py-2 border-b border-red-700">
          <span className="font-medium">{title} - JSON Parse Error</span>
        </div>
        <div className="p-4">
          <div className="text-red-200 mb-2">Failed to parse JSON data</div>
          <div className="bg-red-800 p-2 rounded text-xs overflow-auto max-h-32">
            {data.raw}
          </div>
        </div>
      </div>
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Handle null or undefined data
  if (!data) {
    return (
      <div className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden font-mono text-sm">
        <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
          <span className="font-medium">{title} - No Data</span>
        </div>
        <div className="p-4 text-gray-400">
          No data available
        </div>
      </div>
    )
  }

  const formatValue = (value, key = null, depth = 0) => {
    if (value === null) {
      return <span className="text-gray-400">null</span>
    }
    
    if (typeof value === 'boolean') {
      return <span className="text-purple-400">{value.toString()}</span>
    }
    
    if (typeof value === 'number') {
      return <span className="text-blue-400">{value}</span>
    }
    
    if (typeof value === 'string') {
      return <span className="text-green-400">"{value}"</span>
    }
    
    if (Array.isArray(value)) {
      return <ArrayViewer array={value} depth={depth} />
    }
    
    if (typeof value === 'object') {
      return <ObjectViewer object={value} depth={depth} />
    }
    
    return <span className="text-yellow-400">{String(value)}</span>
  }

  return (
    <div className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden font-mono text-sm">
      {title && (
        <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
          <span className="font-medium">{title}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
            title="Copy JSON"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      <div className="p-4 max-h-96 overflow-auto">
        {formatValue(data)}
      </div>
    </div>
  )
}

function ObjectViewer({ object, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(depth > 1)
  const keys = Object.keys(object)
  
  if (keys.length === 0) {
    return <span className="text-gray-400">{"{}"}</span>
  }

  return (
    <div className="ml-0">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        <span className="text-gray-400">{"{"}</span>
        {collapsed && <span className="text-gray-500 ml-1">...{keys.length} items</span>}
      </button>
      
      {!collapsed && (
        <div className="ml-4 border-l border-gray-700 pl-4">
          {keys.map((key, index) => (
            <div key={key} className="my-1">
              <span className="text-cyan-400">"{key}"</span>
              <span className="text-gray-400">: </span>
              <span className="inline-block">
                {formatValue(object[key], key, depth + 1)}
              </span>
              {index < keys.length - 1 && <span className="text-gray-400">,</span>}
            </div>
          ))}
          <div className="text-gray-400">{"}"}</div>
        </div>
      )}
      
      {collapsed && <span className="text-gray-400 ml-1">{"}"}</span>}
    </div>
  )
}

function ArrayViewer({ array, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(depth > 1)
  
  if (array.length === 0) {
    return <span className="text-gray-400">{"[]"}</span>
  }

  return (
    <div className="ml-0">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        <span className="text-gray-400">{"["}</span>
        {collapsed && <span className="text-gray-500 ml-1">...{array.length} items</span>}
      </button>
      
      {!collapsed && (
        <div className="ml-4 border-l border-gray-700 pl-4">
          {array.map((item, index) => (
            <div key={index} className="my-1">
              <span className="text-gray-500 mr-2">{index}:</span>
              <span className="inline-block">
                {formatValue(item, null, depth + 1)}
              </span>
              {index < array.length - 1 && <span className="text-gray-400">,</span>}
            </div>
          ))}
          <div className="text-gray-400">{"]"}</div>
        </div>
      )}
      
      {collapsed && <span className="text-gray-400 ml-1">{"]"}</span>}
    </div>
  )
}

function formatValue(value, key = null, depth = 0) {
  if (value === null) {
    return <span className="text-gray-400">null</span>
  }
  
  if (typeof value === 'boolean') {
    return <span className="text-purple-400">{value.toString()}</span>
  }
  
  if (typeof value === 'number') {
    return <span className="text-blue-400">{value}</span>
  }
  
  if (typeof value === 'string') {
    // Truncate very long strings
    if (value.length > 100) {
      return (
        <span className="text-green-400" title={value}>
          "{value.substring(0, 100)}..."
        </span>
      )
    }
    return <span className="text-green-400">"{value}"</span>
  }
  
  if (Array.isArray(value)) {
    return <ArrayViewer array={value} depth={depth} />
  }
  
  if (typeof value === 'object') {
    return <ObjectViewer object={value} depth={depth} />
  }
  
  return <span className="text-yellow-400">{String(value)}</span>
} 