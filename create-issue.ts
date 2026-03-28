import { execSync } from "child_process";
import { z } from "zod";
import {
  validateInput,
  checkGitHubCLI,
  verifyLabelsOnGitHub,
} from "./lib/single-issue";

import { readPackageMeta } from "./lib/project-meta";
import { printDryRunBlock, printSingleIssueHeader, printSingleIssueSuccess, printTestModeBlock } from "./lib/report";

interface ExecError extends Error {
  stderr?: Buffer | string;
}



// Enforces strict rules for single issue creation
const SingleIssueSchema = z.object({
  title: z.string().trim().min(3, "Title too short").max(255),
  body: z.string().trim().min(1, "Body cannot be empty"),
  assignee: z.string().optional().transform(v => (v === "none" || !v) ? undefined : v),
  labels: z.array(z.string()).default([]),
});

// RAW ARGUMENTS EXTRACTION
const args = process.argv.slice(2);




// META DATA ENVIRONMENT
const isDryRun = process.env.DRY_RUN !== "false";
const isTestMode = process.env.TEST_MODE === "true";

// --- METADATA EXTRACTION FROM PACKAGE.JSON ---
const meta = readPackageMeta();

try {
  const validated = SingleIssueSchema.parse({
    title: args[0],
    body: args[1],
    assignee: args[2],
    labels: args.slice(3)
  });


  printSingleIssueHeader(meta, isDryRun, isTestMode);

  // --- TEST MODE ---
  if(isTestMode) {
      printTestModeBlock(args[0])
      process.exit(0);
  }

  checkGitHubCLI();
  if (!isDryRun) {
    console.log("🔍 [PRE-FLIGHT] Verifying labels compatibility...");
    verifyLabelsOnGitHub(validated.labels);
  }

  const labelsFlags = validated.labels.map((l) => `--label "${l}"`).join(" ");
  const assigneeFlag = validated.assignee ? `--assignee "${validated.assignee}"` : "";
  const createCmd = `gh issue create --title "${validated.title}" --body "${validated.body}" ${assigneeFlag} ${labelsFlags}`;


  if (isDryRun) {
    printDryRunBlock(createCmd);
    process.exit(0);
  }

  // --- EXECUTION
  console.log("⏳ Communicating with GitHub CLI...");
  const rawOutput = execSync(createCmd, { encoding: "utf8" });  
  const newIssueUrl = rawOutput.trim();
  const issueNumber = newIssueUrl.split("/").pop();

  if (!issueNumber || isNaN(Number(issueNumber))) {
    throw new Error(`[PARSE_FAILED] Could not extract issue number from: ${newIssueUrl}`);
  }

  // --- AUTO-RENAME (Issue Number Prefix)
  const newTitle = `ISSUE-${issueNumber}: ${validated.title}`;
  try {
    execSync(`gh issue edit ${issueNumber} --title "${newTitle}"`, { stdio: "ignore" });
  } catch (e: any) {
    console.error(`⚠️  [RENAME_FAILED] Issue #${issueNumber} created but title rename failed: ${e.message}`);
  }

  printSingleIssueSuccess(issueNumber, newTitle)
  
} catch (error:unknown) {
    if (error instanceof z.ZodError) {
    console.error("\n❌ [VALIDATION_ERROR] Check your arguments:");
    error.issues.forEach(e => console.error(`   - ${e.path.join(".")}: ${e.message}`));
    process.exit(1);
  }

  if (error instanceof Error) {
    const err = error as ExecError; // Casting sicuro dopo instanceof
    const stderr = err.stderr?.toString().trim();

    console.error(`\n❌ [CRITICAL_ERROR] ${err.message}`);
    if (stderr) {
      console.error(`   Details: ${stderr}`);
    }
    process.exit(1);
  }

  console.error("\n❌ [UNKNOWN_FATAL_ERROR] An unidentified error occurred.");
  process.exit(1);
}

