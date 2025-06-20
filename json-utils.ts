// Enhanced helper function to sanitize a raw json string that couldn't be parsed

import { jsonrepair } from "jsonrepair"

export const safeJsonRepair = (rawString: string): { success: boolean; repairedJSON: string } => {
  var res = { success: false, repairedJSON: undefined }
  try {
    res.repairedJSON = jsonrepair(rawString)
    let o = JSON.parse(res.repairedJSON)
    res.success = true
  } catch (e) {
    res.success = false
    res.repairedJSON = undefined
  } finally {
    return res
  }
}

export function getJsonAsArray(response: string): any[] | undefined {
  const jsonString = jsonRepairAndFlatten(response)
  const obj = JSON.parse(jsonString)
  if (!Array.isArray(obj)) return undefined
  return obj
}

export function getJsonAsObject<T>(response: string): T | undefined {
  const jsonString = jsonRepairAndFlatten(response)
  const obj = JSON.parse(jsonString) as T
  if (!obj) return undefined
  return obj
}

export function jsonRepairAndFlatten(rawString: string): string {
  if (typeof rawString !== "string" || rawString.trim().length === 0) {
    throw new Error("Input must be a non-empty string")
  }
  const isJSON = (data: string): boolean => {
    try {
      let o = JSON.parse(data)
      return true
    } catch (e) {
      return false
    }
  }

  // Remove markdown code block markers if present from eg llm responses
  var rj: string | undefined = rawString.replace(/```json\s*/, "").replace(/```\s*$/, "")
  rj = rj.replace(/```\s*/, "").replace(/```\s*$/, "")

  var rj = trimToJSON(rawString).result || rawString
  if (isJSON(rj)) return rj

  rj = removeIncompatibleCharacters(rj)
  if (isJSON(rj)) return rj

  rj = escapeJsonStrings(rj)
  if (isJSON(rj)) return rj

  rj = safeJsonRepair(rj).repairedJSON
  if (rj) return rj

  var flatj = rawString.replace(/(\r\n|\n|\r)/gm, " ")
  flatj = flatj.replace(/\u002F\u0022/g, "\u201C") //... replace any /" inside a string with “
  if (isJSON(flatj)) return flatj

  rj = safeJsonRepair(flatj).repairedJSON
  if (rj) return rj

  JSON.parse(flatj) //throw error?
  return flatj
}

function trimToJSON(textWithJson): { success: boolean; result: string } {
  const startCurlyBrace = textWithJson.indexOf("{")
  const startSquareBrace = textWithJson.indexOf("[")
  let start = -1
  let openBrace = ""
  let closeBrace = ""
  if (startCurlyBrace != -1 && startCurlyBrace < startSquareBrace) {
    start = startCurlyBrace
    openBrace = "{"
    closeBrace = "}"
  } else if (startSquareBrace != -1) {
    start = startSquareBrace
    openBrace = "["
    closeBrace = "]"
  }
  if (start === -1) throw new Error("No JSON object found")

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

const removeIncompatibleCharacters = (rawString) => {
  let cleanedString = rawString
    // Replace forward slash + quote with just quote
    .replace(/\/"/g, "\u201C")
    // Remove all control characters and non-printable characters
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    // Replace multiple spaces with single space
    .replace(/\s+/g, " ")
    // Remove any backslashes
    .replace(/\\/g, "")
    // Replace multiple consecutive quotes with single quote
    .replace(/"{2,}/g, '"')
    // Remove any remaining escape characters
    .replace(/[\b\f\n\r\t\v]/g, " ")
    // Trim any whitespace
    .trim()
  return cleanedString
}

export const escapeJsonStrings = (jsonRawStr, doTrimToBraces = true) => {
  let inString = false
  let escaped = false
  let result = ""

  let jsonStr = jsonRawStr
  if (doTrimToBraces) {
    const trimedResult = trimToJSON(jsonRawStr)
    jsonStr = trimedResult.success ? trimedResult.result : jsonRawStr
  }

  jsonStr = jsonStr.replace(/\/"/g, "\u201C") //... replace any /" special character “

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

//------------------------------------------- file processes ----------------------------------------------------------------//

import * as fs from "fs"
import * as path from "path"
import { devLog, devWarn } from "../logger"
import { raw } from "express"

export async function sanitizeJsonFile(
  filePath: string,
  doDeleteFailedRepairs: boolean = false,
): Promise<"altered" | "unchanged" | "deleted"> {
  var fileContent = ""
  var sanitizedContent = ""
  try {
    // Read the file content
    fileContent = await fs.promises.readFile(filePath, "utf8")

    // Sanitize the content
    sanitizedContent = jsonRepairAndFlatten(fileContent)

    // Check if the content was actually changed
    if (sanitizedContent !== fileContent) {
      // Write the sanitized content back to the file
      await fs.promises.writeFile(filePath, sanitizedContent, "utf8")
      return "altered"
    } else {
      //devLog(`No changes needed for file: ${filePath}`)
      return "unchanged"
    }
  } catch (error) {
    //console.error(`Error processing file ${filePath}:`, error)
    try {
      // Delete the file if we fail to repair it
      if (doDeleteFailedRepairs) {
        await fs.promises.unlink(filePath)
        devLog(`Deleted file that contained unrepairable malformatted JSON with file name: ${filePath}`, "high")
      }
      devWarn(`malformatted json at path: ${filePath}`)
      return "deleted"
    } catch (deleteError) {
      console.error(`Failed to delete unrepairable file ${filePath}:`, deleteError)
      return "deleted" // Still consider it deleted for counting purposes
    }
  }
}

export async function sanitizeJsonFilesInFolder(
  folderPath: string,
  doDeleteFailedRepairs: boolean = false,
): Promise<{
  alteredCount: number
  deletedCount: number
  validCount: number
}> {
  let alteredCount = 0
  let deletedCount = 0
  let validCount = 0

  async function processFolder(currentPath: string): Promise<void> {
    try {
      const entries = await fs.promises.readdir(currentPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name)

        if (entry.isDirectory()) {
          // Recursively process subfolders
          await processFolder(fullPath)
        } else if (entry.isFile() && entry.name !== "_file.txt") {
          // Process .json files
          const result = await sanitizeJsonFile(fullPath, doDeleteFailedRepairs)
          switch (result) {
            case "altered":
              alteredCount++
              validCount++
              break
            case "unchanged":
              validCount++
              break
            case "deleted":
              deletedCount++
              break
          }
        }
      }
    } catch (error) {
      console.error(`Error processing folder ${currentPath}:`, error)
    }
  }

  await processFolder(folderPath)
  return { alteredCount, deletedCount, validCount }
}
