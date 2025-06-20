// Adapted JSON repair utility for React frontend
// Based on colleague's TypeScript version

export function getJsonAsArray(response) {
  try {
    const jsonString = jsonRepairAndFlatten(response)
    const obj = JSON.parse(jsonString)
    if (!Array.isArray(obj)) return undefined
    return obj
  } catch (error) {
    console.error('Failed to parse as array:', error)
    return undefined
  }
}

export function getJsonAsObject(response) {
  try {
    const jsonString = jsonRepairAndFlatten(response)
    const obj = JSON.parse(jsonString)
    if (!obj) return undefined
    return obj
  } catch (error) {
    console.error('Failed to parse as object:', error)
    return undefined
  }
}

export function jsonRepairAndFlatten(rawString) {
  if (typeof rawString !== "string" || rawString.trim().length === 0) {
    throw new Error("Input must be a non-empty string")
  }

  const isJSON = (data) => {
    try {
      JSON.parse(data)
      return true
    } catch (e) {
      return false
    }
  }

  // Remove markdown code block markers if present from LLM responses
  let rj = rawString.replace(/```json\s*/, "").replace(/```\s*$/, "")
  rj = rj.replace(/```\s*/, "").replace(/```\s*$/, "")

  // Try to trim to JSON boundaries first
  const trimResult = trimToJSON(rawString)
  rj = trimResult.success ? trimResult.result : rawString
  if (isJSON(rj)) return rj

  // Remove incompatible characters
  rj = removeIncompatibleCharacters(rj)
  if (isJSON(rj)) return rj

  // Try escaping JSON strings
  rj = escapeJsonStrings(rj)
  if (isJSON(rj)) return rj

  // Try basic string repair
  rj = basicJsonRepair(rj)
  if (isJSON(rj)) return rj

  // Flatten and try again
  let flatj = rawString.replace(/(\r\n|\n|\r)/gm, " ")
  flatj = flatj.replace(/\u002F\u0022/g, "\u201C") // replace any /" inside a string with "
  if (isJSON(flatj)) return flatj

  // Try basic repair on flattened version
  rj = basicJsonRepair(flatj)
  if (isJSON(rj)) return rj

  // Last resort - throw error
  JSON.parse(flatj) // This will throw the actual parsing error
  return flatj
}

function trimToJSON(textWithJson) {
  const startCurlyBrace = textWithJson.indexOf("{")
  const startSquareBrace = textWithJson.indexOf("[")
  let start = -1
  let openBrace = ""
  let closeBrace = ""
  
  if (startCurlyBrace !== -1 && (startSquareBrace === -1 || startCurlyBrace < startSquareBrace)) {
    start = startCurlyBrace
    openBrace = "{"
    closeBrace = "}"
  } else if (startSquareBrace !== -1) {
    start = startSquareBrace
    openBrace = "["
    closeBrace = "]"
  }
  
  if (start === -1) return { success: false, result: textWithJson }

  let braceCount = 0
  let end = start

  // Iterate through string tracking nested braces
  for (let i = start; i < textWithJson.length; i++) {
    if (textWithJson[i] === openBrace) braceCount++
    if (textWithJson[i] === closeBrace) {
      braceCount--
      // When we hit 0, we've found the matching outer brace
      if (braceCount === 0) {
        end = i + 1
        break
      }
    }
  }

  // If braceCount isn't 0, we have mismatched braces
  if (braceCount !== 0) return { success: false, result: textWithJson }

  // Extract just the JSON portion
  const jsonStr = textWithJson.slice(start, end)
  return { success: true, result: jsonStr }
}

function removeIncompatibleCharacters(rawString) {
  return rawString
    // Replace forward slash + quote with just quote
    .replace(/\/"/g, "\u201C")
    // Remove all control characters and non-printable characters
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    // Replace multiple spaces with single space
    .replace(/\s+/g, " ")
    // Remove any backslashes that aren't proper escapes
    .replace(/\\(?!["\\/bfnrt])/g, "")
    // Replace multiple consecutive quotes with single quote
    .replace(/"{2,}/g, '"')
    // Remove any remaining problematic escape characters
    .replace(/[\b\f\n\r\t\v]/g, " ")
    // Trim any whitespace
    .trim()
}

export function escapeJsonStrings(jsonRawStr, doTrimToBraces = true) {
  let inString = false
  let escaped = false
  let result = ""

  let jsonStr = jsonRawStr
  if (doTrimToBraces) {
    const trimResult = trimToJSON(jsonRawStr)
    jsonStr = trimResult.success ? trimResult.result : jsonRawStr
  }

  jsonStr = jsonStr.replace(/\/"/g, "\u201C") // replace any /" special character

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i]

    // Handle escape sequences
    if (escaped) {
      result += char
      escaped = false
      continue
    }

    if (char === "\\") {
      result += char
      escaped = true
      continue
    }

    // Track string boundaries
    if (char === '"') {
      inString = !inString
      result += char
      continue
    }

    // Escape newlines only within strings
    if (inString && char === "\n") {
      result += "\\n"
    } else {
      result += char
    }
  }

  return result
}

// Basic JSON repair function (simplified version without external dependencies)
function basicJsonRepair(jsonString) {
  try {
    let repaired = jsonString

    // Fix common issues
    // Remove trailing commas
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1')
    
    // Fix missing quotes around keys
    repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    
    // Fix single quotes to double quotes
    repaired = repaired.replace(/'/g, '"')
    
    // Fix undefined values
    repaired = repaired.replace(/:\s*undefined/g, ': null')
    
    // Fix NaN values
    repaired = repaired.replace(/:\s*NaN/g, ': null')
    
    // Fix Infinity values
    repaired = repaired.replace(/:\s*Infinity/g, ': null')
    
    // Fix unquoted string values (basic attempt)
    repaired = repaired.replace(/:\s*([a-zA-Z][a-zA-Z0-9\s]*)\s*([,}])/g, (match, value, end) => {
      // Don't quote if it's already a valid JSON value
      if (['true', 'false', 'null'].includes(value.trim()) || !isNaN(value.trim())) {
        return match
      }
      return `: "${value.trim()}"${end}`
    })

    return repaired
  } catch (error) {
    console.error('Basic JSON repair failed:', error)
    return jsonString
  }
}

// Safe wrapper for parsing with repair attempts
export function safeJsonParse(rawString) {
  try {
    // First try direct parsing
    return { success: true, data: JSON.parse(rawString) }
  } catch (error) {
    try {
      // Try repair and parse
      const repaired = jsonRepairAndFlatten(rawString)
      return { success: true, data: JSON.parse(repaired) }
    } catch (repairError) {
      console.error('JSON repair failed:', repairError)
      return { 
        success: false, 
        error: repairError.message,
        raw: rawString 
      }
    }
  }
} 