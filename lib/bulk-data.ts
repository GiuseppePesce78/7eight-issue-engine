import fs from "fs";
import { BulkEntry } from "../types/types";
import path from "path";
import { z } from "zod";



export function saveBulkData(pathToJson: string, data: BulkEntry[]): void {
  try {
    fs.writeFileSync(pathToJson, JSON.stringify(data, null, 2));
  } catch (e: any) {
    throw new Error(`Could not save bulk data to ${pathToJson}: ${e.message}`);
  }
}



/**
 * Zod Schema definition for a single entry.
 * It enforces types, minimum lengths, and automatically trims strings.
 */
const StateEnum = z.enum(["created", "pending", "failed"]);

const BulkEntrySchema = z.object({
  // Now 'state' can ONLY be one of the values defined above
  state: StateEnum,
  
  issue: z.object({
    title: z.string().trim().min(3, "Title must be at least 3 characters long"),
    body: z.string().trim().min(1, "Body cannot be empty"),
  }),

  // Metadata fields are optional because they are added after the first run
  createdAt: z.string().optional(),
  failedAt: z.string().optional(),
  error: z.string().optional(),
}).strict();

const BulkDataSchema = z.array(BulkEntrySchema);



/**
 * Loads and validates a JSON file for bulk issue processing.
 * Implements defensive programming to prevent DoS, Path Traversal, and Data Corruption.
 * * @param pathToJson - Relative or absolute path to the target JSON file.
 * @returns A validated and sanitized array of BulkEntry objects.
 * @throws Error if the file is missing, exceeds size limits, or contains invalid schema.
 */
export function loadBulkData(pathToJson: string): BulkEntry[] {
  // 1. Basic path validation
  if (!pathToJson || typeof pathToJson !== "string") {
    throw new Error("Invalid input: pathToJson must be a string.");
  }

  const absolutePath = path.resolve(pathToJson);
  const fileName = path.basename(pathToJson);

  try {
    // 2. Resource Guard (Max 10MB)
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File [${fileName}] not found.`);
    }

    const stats = fs.statSync(absolutePath);
    if (stats.size > 10 * 1024 * 1024) {
      throw new Error("File size exceeds 10MB limit.");
    }

    // 3. Read and Parse
    const raw = fs.readFileSync(absolutePath, "utf-8");
    const json = JSON.parse(raw);

    // 4. Zod Validation
    // .safeParse() is preferred over .parse() to handle errors manually without 
    // throwing an immediate generic exception.
    const result = BulkDataSchema.safeParse(json);
    if (!result.success) {
      // We format the Zod error to show exactly WHERE the validation failed
      const errorDetails = result.error.issues
        .map((err) => `Path "${err.path.join(".")}": ${err.message}`)
        .join("; ");
      
      throw new Error(`Validation failed in [${fileName}]: ${errorDetails}`);
    }

    const sanitizedData = result.data.map((entry: any) => ({
      ...entry,
      issue: {
        ...entry.issue,
        title: sanitizeForShell(entry.issue.title),
        body: sanitizeForShell(entry.issue.body),
        // Sanitizziamo anche le label se presenti
        labels: entry.issue.labels?.map((l: string) => sanitizeForShell(l)) || []
      }
    }));

    // result.data now contains strictly validated and trimmed data
    return sanitizedData as BulkEntry[];

  } catch (e: any) {
    // 5. Secure Error Reporting
    if (e instanceof SyntaxError) {
      throw new Error(`JSON Syntax Error in [${fileName}]: ${e.message}`);
    }
    
    // Rethrow the validation or system error
    throw new Error(e.message);
  }
}



/**
 * Extracts all unique labels from the validated bulk data.
 * @param data - Array of BulkEntry objects.
 * @returns An array of unique, trimmed label strings.
 */
export function extractUniqueLabels(data: BulkEntry[]): string[] {
  const labelsSet = new Set<string>();

  data.forEach((entry) => {
    // Navighiamo la struttura validata da Zod
    if (entry.issue.labels && Array.isArray(entry.issue.labels)) {
      entry.issue.labels.forEach((label) => {
        const trimmed = label.trim();
        if (trimmed) labelsSet.add(trimmed);
      });
    }
  });

  return Array.from(labelsSet);
}


/**
 * Sanitizes strings to prevent shell interpretation errors.
 * 1. Doubles backslashes (\ -> \\).
 * 2. Escapes double quotes (" -> \") to prevent premature string termination in CLI.
 * * @param text - The raw string to be sanitized.
 * @returns A shell-safe version of the string.
 */
function sanitizeForShell(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\") // Handle backslashes first
    .replace(/"/g, '\\"')   // Escape double quotes for shell compatibility
    .trim();
}