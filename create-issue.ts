import { execSync } from 'child_process';
import { z } from 'zod';
import { checkGitHubCLI, verifyLabelsOnGitHub } from './lib/single-issue';

import { readPackageMeta } from './lib/project-meta';
import {
  printDryRunBlock,
  printSingleIssueHeader,
  printSingleIssueSuccess,
  printTestModeBlock
} from './lib/report';

interface ExecError extends Error {
  stderr?: Buffer | string;
}

/* =============================================
   Zod Schema Definition: Enforce strict rules
   for creating a single GitHub issue
   - title: required, trimmed, 3-255 chars
   - body: required, trimmed, non-empty
   - assignee: optional, transform "none" or empty to undefined
   - labels: optional string array, defaults to []
============================================= */
const SingleIssueSchema = z.object({
  title: z.string().trim().min(3, 'Title too short').max(255),
  body: z.string().trim().min(1, 'Body cannot be empty'),
  assignee: z
    .string()
    .optional()
    .transform((v) => (v === 'none' || !v ? undefined : v)),
  labels: z.array(z.string()).default([])
});

/* ===============================
   RAW CLI ARGUMENT EXTRACTION
   - Extract arguments: [title, body, assignee, labels]
================================ */
const args = process.argv.slice(2);

/* ===============================
   ENVIRONMENT FLAGS
   - DRY_RUN: skip execution, just print commands
   - TEST_MODE: simulate execution, exit early
================================ */
const isDryRun = process.env.DRY_RUN !== 'false';
const isTestMode = process.env.TEST_MODE === 'true';

/* ===============================
   PROJECT METADATA
   - Extract info from package.json
================================ */
const meta = readPackageMeta();

try {
  /* ===============================
     VALIDATE INPUT WITH ZOD
  ================================= */
  const validated = SingleIssueSchema.parse({
    title: args[0],
    body: args[1],
    assignee: args[2] || undefined,
    labels: args[3] ? JSON.parse(args[3]) : []
  });

  /* ===============================
     PRINT HEADER
     - Display project & environment info
  ================================= */
  printSingleIssueHeader(meta, isDryRun, isTestMode);

  /* ===============================
     TEST MODE BLOCK
     - Print test info and exit if TEST_MODE
  ================================= */
  if (isTestMode) {
    printTestModeBlock(args[0]);
    process.exit(0);
  }

  /* ===============================
     PRE-FLIGHT CHECKS
     - Ensure GitHub CLI is installed & authenticated
     - Verify all labels exist on GitHub
  ================================= */
  checkGitHubCLI();
  if (!isDryRun) {
    console.log('🔍 [PRE-FLIGHT] Verifying labels compatibility...');
    verifyLabelsOnGitHub(validated.labels);
  }

  /* ===============================
     BUILD GITHUB CLI COMMAND
     - Convert labels array to --label flags
     - Add optional --assignee flag
  ================================= */
  const labelsFlags = validated.labels.map((l) => `--label "${l}"`).join(' ');
  const assigneeFlag = validated.assignee
    ? `--assignee "${validated.assignee}"`
    : '';
  const createCmd = `gh issue create --title "${validated.title}" --body "${validated.body}" ${assigneeFlag} ${labelsFlags}`;

  /* ===============================
     DRY RUN BLOCK
     - Print command and exit if DRY_RUN
  ================================= */
  if (isDryRun) {
    printDryRunBlock(createCmd);
    process.exit(0);
  }

  /* ===============================
     EXECUTE COMMAND
     - Run GitHub CLI
     - Extract issue number from returned URL
  ================================= */
  console.log('⏳ Communicating with GitHub CLI...');
  const rawOutput = execSync(createCmd, { encoding: 'utf8' });
  const newIssueUrl = rawOutput.trim();
  const issueNumber = newIssueUrl.split('/').pop();

  if (!issueNumber || isNaN(Number(issueNumber))) {
    throw new Error(
      `[PARSE_FAILED] Could not extract issue number from: ${newIssueUrl}`
    );
  }

  /* ===============================
     AUTO-RENAME ISSUE TITLE
     - Prefix title with ISSUE-<number>
     - Failures logged but do not block execution
  ================================= */
  const newTitle = `ISSUE-${issueNumber}: ${validated.title}`;
  try {
    execSync(`gh issue edit ${issueNumber} --title "${newTitle}"`, {
      stdio: 'ignore'
    });
  } catch (e: any) {
    console.error(
      `⚠️  [RENAME_FAILED] Issue #${issueNumber} created but title rename failed: ${e.message}`
    );
  }

  /* ===============================
     SUCCESS OUTPUT
  ================================= */
  printSingleIssueSuccess(issueNumber, newTitle);

  /* ===============================
     ERROR HANDLING
     - Zod validation errors
     - GitHub CLI execution errors
     - Unknown fatal errors
  ================================= */
} catch (error: unknown) {
  if (error instanceof z.ZodError) {
    console.error('\n❌ [VALIDATION_ERROR] Check your arguments:');
    error.issues.forEach((e) =>
      console.error(`   - ${e.path.join('.')}: ${e.message}`)
    );
    process.exit(1);
  }

  if (error instanceof Error) {
    const err = error as ExecError; // Safe cast after instanceof
    const stderr = err.stderr?.toString().trim();

    console.error(`\n❌ [CRITICAL_ERROR] ${err.message}`);
    if (stderr) {
      console.error(`   Details: ${stderr}`);
    }
    process.exit(1);
  }

  console.error('\n❌ [UNKNOWN_FATAL_ERROR] An unidentified error occurred.');
  process.exit(1);
}
