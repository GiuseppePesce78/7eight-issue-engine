import { spawnSync, SpawnSyncReturns } from 'child_process';
import { buildCommandArgs } from './lib/cmd-utils';
import { BulkEntry } from './types/types';
import { saveBulkData } from './lib/bulk-data';


/**
 * Process a single issue entry: creates the GitHub issue if not already created.
 * Handles dry-run mode, error tracking, and updates entry state.
 *
 * @param entry - The issue entry to process
 * @param isDryRun - Flag to skip actual creation for testing
 * @param absolutePath - Absolute path to the JSON plan
 * @param fileName - File name of the JSON plan (for logging)
 * @returns boolean - true if issue was created, false if skipped
 */
export function processEntry(
  entry: BulkEntry,
  isDryRun: boolean,
  absolutePath: string,
  fileName: string
): boolean {

   // 1. Skip if the entry is already marked as created
  if (entry.state === 'created' || entry.state === 'test' ) {
    console.log(`\x1b[90m[SKIPPED]\x1b[0m ${entry.issue.title}`);
    return false;
  }

  // 2. Build CLI arguments array to safely pass to the child process
  // ⚠️ Ensure buildCommandArgs returns a string[]
  const args = buildCommandArgs(entry.issue);

  // 3. Dry-run mode: log and skip actual creation
  if (isDryRun) {
    console.log(`\x1b[33m[PENDING]\x1b[0m ${entry.issue.title}`);
    return false;
  }

  console.log(`\x1b[32m[CREATING...]\x1b[0m ${entry.issue.title}`);

  try {
    // Spawn a child process to execute create-issue.ts with safe arguments
    const result: SpawnSyncReturns<string> = spawnSync(
      'npx',
      ['tsx', 'create-issue.ts', ...args],
      {
        encoding: 'utf8',
        shell: process.platform === 'win32'
      }
    );
    const output = result.stdout;

    // Extract the GitHub issue number from the child process output
    const match = output.match(/##ISSUE_NUMBER##(\d+)##/);
    const issueNumber = match?.[1];

    if (!issueNumber) {
      throw new Error('Failed to extract issue number');
    }

    // Ensure child process exited successfully
    if (result.status !== 0) {
      throw new Error(
        `Il processo figlio è terminato con codice ${result.status}`
      );
    }

    // Update entry with issue number and mark as created
    entry.issueNumber = issueNumber;
    entry.state = 'created';
    entry.createdAt = new Date().toISOString();// Use ISO for consistency
    return true;
  } catch (e: any) {
    // Log error and mark entry as failed
    const errorMsg = e.message || 'Unknown error';
    console.error(`\x1b[31m[FAILED]\x1b[0m ${entry.issue.title}`);
    console.error(`   ${errorMsg}`);

    entry.state = 'failed';
    entry.error = errorMsg;
    entry.failedAt = new Date().toISOString();

    // Halt execution to preserve progress in the JSON file
    throw new Error(`Execution halted. Progress saved in: ${fileName}`);
  }
}

/**
 * Process all entries in a bulk issue plan.
 * Updates each entry's state, persists the plan after each iteration,
 * and counts created vs skipped entries.
 *
 * @param data - Array of BulkEntry objects
 * @param isDryRun - Flag to skip actual creation
 * @param absolutePath - Absolute path to the JSON plan
 * @param fileName - File name of the JSON plan
 * @returns Object with counts of created and skipped entries
 */
export function processAllEntries(data: BulkEntry[], isDryRun: boolean, absolutePath: string, fileName: string): { created: number; skipped: number } {
  let createdCount = 0;
  let skippedCount = 0;
  for (const entry of data) {
    try {
      // Proces s each entry individually
      if (processEntry(entry, isDryRun, absolutePath, fileName)) {
        createdCount++;
      } else {
        skippedCount++;
      }
      // Persist the JSON plan after each entry to avoid data loss
      if (!isDryRun) {
        saveBulkData(absolutePath, data);
      }
    } catch (e) {
      // Re-throw to halt execution; caller handles the critical error
      throw e;
    }
  }

  return { created: createdCount, skipped: skippedCount };
}