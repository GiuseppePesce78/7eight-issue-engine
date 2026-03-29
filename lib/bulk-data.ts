import fs from 'fs';
import { BulkEntry } from '../types/types';
import path from 'path';
import { z } from 'zod';
import { spawnSync } from 'child_process';

/* =============================================
   SAVE BULK DATA
============================================= */

/**
 * Saves an array of BulkEntry objects to a JSON file.
 * @param pathToJson - Absolute or relative path to the JSON file.
 * @param data - Array of BulkEntry objects to save.
 * @throws Error if writing to file fails.
 */
export function saveBulkData(pathToJson: string, data: BulkEntry[]): void {
  try {
    fs.writeFileSync(pathToJson, JSON.stringify(data, null, 2));
  } catch (e: any) {
    throw new Error(`Could not save bulk data to ${pathToJson}: ${e.message}`);
  }
}

/* =============================================
   ZOD SCHEMAS
   - Validazione stretta dei dati in ingresso
   - StateEnum limita lo stato a created/pending/failed
   - BulkEntrySchema garantisce title/body/labels corretti
============================================= */
const StateEnum = z.enum(['created', 'pending', 'failed']);

const BulkEntrySchema = z
  .object({
    // Now 'state' can ONLY be one of the values defined above
    state: StateEnum,

    issue: z.object({
      title: z
        .string()
        .trim()
        .min(3, 'Title must be at least 3 characters long'),
      body: z.string().trim().min(1, 'Body cannot be empty'),
      assignee: z.string().optional(),
      labels: z.array(z.string()).default([])
    }),

    // Metadata fields are optional because they are added after the first run
    createdAt: z.string().optional(),
    failedAt: z.string().optional(),
    error: z.string().optional()
  })
  .strict();

const BulkDataSchema = z.array(BulkEntrySchema);

/* =============================================
   LOAD & VALIDATE BULK DATA
   - Carica JSON
   - Controlla esistenza file e dimensione (<10MB)
   - Esegue validazione Zod
   - Sanitizza titoli, body e labels per CLI
============================================= */

/**
 * Loads a JSON file and validates it as an array of BulkEntry objects.
 * Sanitizes text fields for safe CLI usage.
 * @param pathToJson - Relative or absolute path to the JSON file.
 * @returns Array of validated and sanitized BulkEntry objects.
 * @throws Error if file is missing, too large (>10MB), invalid JSON, or fails schema validation.
 */
export function loadBulkData(pathToJson: string): BulkEntry[] {
  if (!pathToJson || typeof pathToJson !== 'string') {
    throw new Error('Invalid input: pathToJson must be a string.');
  }

  const absolutePath = path.resolve(pathToJson);
  const fileName = path.basename(pathToJson);

  try {
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File [${fileName}] not found.`);
    }

    const stats = fs.statSync(absolutePath);
    if (stats.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit.');
    }

    const raw = fs.readFileSync(absolutePath, 'utf-8');
    const json = JSON.parse(raw);

    const result = BulkDataSchema.safeParse(json);
    if (!result.success) {
      const errorDetails = result.error.issues
        .map((err) => `Path "${err.path.join('.')}": ${err.message}`)
        .join('; ');

      throw new Error(`Validation failed in [${fileName}]: ${errorDetails}`);
    }

    const sanitizedData = result.data.map((entry: any) => {

      const sanitizedLabels =
        entry.issue.labels?.map((l: string) => sanitizeForShell(l)) || [];

      return {
        ...entry,
        issue: {
          ...entry.issue,
          title: sanitizeForShell(entry.issue.title),
          body: sanitizeForShell(entry.issue.body),
          labels: sanitizedLabels
        }
      };
    });
    return sanitizedData as BulkEntry[];
  } catch (e: any) {
    // 5. Secure Error Reporting
    if (e instanceof SyntaxError) {
      throw new Error(`JSON Syntax Error in [${fileName}]: ${e.message}`);
    }

    throw new Error(e.message);
  }
}

/* =============================================
   EXTRACT UNIQUE LABELS
   - Utility per ottenere solo labels uniche da array di BulkEntry
   - Utile per pre-flight check su GitHub
============================================= */

/**
 * Extracts all unique, trimmed labels from an array of BulkEntry objects.
 * @param data - Array of BulkEntry objects.
 * @returns Array of unique label strings.
 */
export function extractUniqueLabels(data: BulkEntry[]): string[] {
  const labelsSet = new Set<string>();

  data.forEach((entry) => {
    if (entry.issue.labels && Array.isArray(entry.issue.labels)) {
      entry.issue.labels.forEach((label) => {
        const trimmed = label.trim();
        if (trimmed) labelsSet.add(trimmed);
      });
    }
  });

  return Array.from(labelsSet);
}

/* =============================================
   SANITIZE FOR SHELL
   - Previene interpretazione indesiderata di CLI
   - Escapa backslash e doppi apici
============================================= */

/**
 * Escapes special characters in text to prevent shell interpretation errors.
 * - Doubles backslashes
 * - Escapes double quotes
 * - Escapes backticks (prevents command substitution)
 * - Trims whitespace
 * @param text - Raw string input
 * @returns Sanitized, shell-safe string
 */
function sanitizeForShell(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\') 
    .replace(/"/g, '\\"')
    .replace(/`/g, '\\`')
    .trim();
}

/* =============================================
   ENSURE LABELS EXIST ON GITHUB
   - Verifica labels sul repo GitHub
   - Crea automaticamente quelle mancanti
============================================= */

/**
 * Checks if the specified labels exist in the GitHub repository.
 * Creates missing labels automatically with default gray color.
 * @param labels - Array of label strings to check.
 * @param repo - GitHub repository in format "owner/repo".
 */
export function ensureLabelsExist(labels: string[], repo: string) {
  const result = spawnSync('gh', ['label', 'list', '--repo', repo], {
    encoding: 'utf8'
  });
  const existingLabels = result.stdout
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const missing = labels.filter((l) => !existingLabels.includes(l));

  missing.forEach((label) => {
    console.log(`⚡ Creating missing label: ${label}`);
    spawnSync(
      'gh',
      ['label', 'create', label, '--color', 'f0f0f0', '--repo', repo],
      {
        stdio: 'inherit'
      }
    );
  });
}
