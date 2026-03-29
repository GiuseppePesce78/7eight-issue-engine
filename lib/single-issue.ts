import { execSync } from 'child_process';

/* =============================================
   INPUT VALIDATION
   - Ensures required arguments (title, body) are provided
   - Exits with usage instructions if missing
============================================= */
export function validateInput(title?: string, body?: string): void {
  if (!title || !body) {
    console.error(
      '\n❌ Usage: npx tsx create-issue.ts "title" "body" "assignee" "label1" "label2"'
    );
    process.exit(1);
  }
}

/* =============================================
   PRE-FLIGHT LABEL CHECK
   - Verifies that all labels exist in the GitHub repository
   - Throws error if any labels are missing, printing the exact
     gh commands needed to create them
============================================= */
export function verifyLabelsOnGitHub(labels: string[]): void {
  if (labels.length === 0) return;

  try {
    // Fetch all existing labels from GitHub CLI in JSON
    const rawOutput = execSync('gh label list --json name', {
      encoding: 'utf8'
    });
    const existingLabels = (JSON.parse(rawOutput) as { name: string }[]).map(
      (l) => l.name.toLowerCase()
    );

    // Determine missing labels
    const missing = labels.filter(
      (l) => !existingLabels.includes(l.toLowerCase())
    );

    if (missing.length > 0) {
      console.error(`\n❌ [PRE-FLIGHT] Missing labels on GitHub:`);
      missing.forEach((label) => {
        console.error(`   gh label create "${label}" --color "f0f0f0"`);
      });
      console.error(`\nCreate them and re-run.`);
      throw new Error(`Missing labels: ${missing.join(', ')}`);
    }
  } catch (e: any) {
    if (e.message.startsWith('Missing labels:')) throw e;
    throw new Error(
      `GitHub CLI Error: Unable to fetch labels. Check your 'gh' authentication.`
    );
  }
}

/* =============================================
   GITHUB CLI CHECK
   - Ensures 'gh' CLI is installed and available in PATH
   - Exits if CLI is not found
============================================= */
export function checkGitHubCLI(): void {
  try {
    execSync('gh --version', { stdio: 'ignore' });
  } catch {
    console.error(
      '\n❌ [GH_CLI_NOT_FOUND] GitHub CLI (gh) is not installed or not in PATH.'
    );
    console.error('   Install it from: https://cli.github.com');
    process.exit(1);
  }
}

/* =============================================
   CREATE ISSUE
   - Executes the provided GitHub CLI command
   - Returns the raw output from GH CLI
   - Handles invalid label errors gracefully
============================================= */
export function createIssue(command: string): string {
  try {
    const rawOutput = execSync(command, { encoding: 'utf8' });
    return rawOutput.trim();
  } catch (e: any) {
    const stderr = e.stderr?.toString() || e.message || 'Unknown error';
    if (stderr.includes('Label') || stderr.includes('label')) {
      console.error(
        `\n❌ [INVALID_LABEL] One or more labels do not exist in the repository.`
      );
      console.error(`   Details: ${stderr.trim()}`);
    } else {
      console.error(
        `\n❌ [ISSUE_CREATE_FAILED] Failed to create issue on GitHub.`
      );
      console.error(`   Details: ${stderr.trim()}`);
    }
    process.exit(1);
  }
}

/* =============================================
   PARSE ISSUE NUMBER
   - Extracts issue number from GitHub issue URL
   - Exits if parsing fails
============================================= */
export function parseIssueNumber(issueUrl: string): string {
  const issueNumber = issueUrl.split('/').pop();
  if (!issueNumber || isNaN(Number(issueNumber))) {
    console.error(
      `\n❌ [PARSE_FAILED] Could not extract issue number from URL: ${issueUrl}`
    );
    process.exit(1);
  }
  return issueNumber;
}

/* =============================================
   RENAME ISSUE
   - Prefix or rename issue title on GitHub
   - Logs warning if rename fails but does not block execution
============================================= */
export function renameIssue(issueNumber: string, newTitle: string): void {
  try {
    execSync(`gh issue edit ${issueNumber} --title "${newTitle}"`, {
      stdio: 'ignore'
    });
  } catch (e: any) {
    console.error(
      `\n⚠️  [RENAME_FAILED] Issue #${issueNumber} created but title rename failed.`
    );
    console.error(`   Details: ${e.message}`);
  }
}