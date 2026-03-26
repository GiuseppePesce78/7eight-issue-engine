import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const [title, body, assignee, ...labels] = process.argv.slice(2);
const isDryRun = process.env.DRY_RUN !== "false";
const isTestMode = process.env.TEST_MODE === "true";

// --- METADATA EXTRACTION ---
interface PackageJson {
  name?: string;
  version?: string;
  author?: string;
  repository?: { url?: string } | string;
}

let projectName = "Unknown Project";
let projectVersion = "0.0.0";
let projectAuthor = "Unknown Author";
let projectRepo = "Unknown Repo";

try {
  const packageJson: PackageJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8")
  );
  projectName = packageJson.name || projectName;
  projectVersion = packageJson.version || projectVersion;
  projectAuthor =
    typeof packageJson.author === "string" ? packageJson.author : projectAuthor;
  projectRepo =
    typeof packageJson.repository === "object"
      ? packageJson.repository?.url || projectRepo
      : packageJson.repository || projectRepo;
} catch {
  // Silent fallback
}

const OWNER = "7eightDev";

if (!title || !body) {
  console.error(
    '\n❌ Usage: npx tsx create-issue.ts "title" "body" "assignee" "label1" "label2"'
  );
  process.exit(1);
}

// --- START HEADER ---
console.log("\n" + "━".repeat(60));
console.log(`🚀 PROJECT: ${projectName.toUpperCase()} v${projectVersion}`);
console.log(`👤 OWNER:   ${OWNER}`);
console.log(`✍️  AUTHOR:  ${projectAuthor}`);
console.log(`🔗 REPO:    ${projectRepo}`);
console.log(
  `🎯 ACTION:  SINGLE ISSUE ${isDryRun ? "(SIMULATION)" : isTestMode ? "(TEST)" : "(REAL)"}`
);
console.log("━".repeat(60));

// --- TEST MODE ---
if (isTestMode) {
  console.log("🧪 TEST MODE: Simulating issue creation...");
  console.log(`📌 Title:  ISSUE-999: ${title}`);
  console.log("━".repeat(60));
  console.log("##ISSUE_NUMBER##999##");
  process.exit(0);
}

try {
  // --- CHECK GH CLI ---
  try {
    execSync("gh --version", { stdio: "ignore" });
  } catch {
    console.error(
      "\n❌ [GH_CLI_NOT_FOUND] GitHub CLI (gh) is not installed or not in PATH."
    );
    console.error("   Install it from: https://cli.github.com");
    process.exit(1);
  }

  const labelsFlags = labels.map((l) => `--label "${l}"`).join(" ");
  const assigneeFlag =
    assignee && assignee !== "none" ? `--assignee "${assignee}"` : "";
  const createCmd = `gh issue create --title "${title}" --body "${body}" ${assigneeFlag} ${labelsFlags}`;

  if (isDryRun) {
    console.log("🔍 SIMULATION MODE: The following command would be executed:");
    console.log(`\x1b[33m${createCmd}\x1b[0m`);
    console.log("\n" + "━".repeat(60));
    console.log("✅ Simulation successful. No issue was created.");
    process.exit(0);
  }

  // --- REAL EXECUTION ---
  console.log("⏳ Communicating with GitHub CLI...");

  let rawOutput: string;
  try {
    rawOutput = execSync(createCmd, { encoding: "utf8" });
  } catch (e: any) {
    const stderr = e.stderr?.toString() || e.message || "Unknown error";
    if (stderr.includes("Label") || stderr.includes("label")) {
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

  const newIssueUrl = rawOutput.trim();
  const issueNumber = newIssueUrl.split("/").pop();

  if (!issueNumber || isNaN(Number(issueNumber))) {
    console.error(
      `\n❌ [PARSE_FAILED] Could not extract issue number from URL: ${newIssueUrl}`
    );
    process.exit(1);
  }

  const newTitle = `ISSUE-${issueNumber}: ${title}`;

  try {
    execSync(`gh issue edit ${issueNumber} --title "${newTitle}"`, {
      stdio: "ignore",
    });
  } catch (e: any) {
    console.error(
      `\n⚠️  [RENAME_FAILED] Issue #${issueNumber} created but title rename failed.`
    );
    console.error(`   Details: ${e.message}`);
    // Non blocchiamo — l'issue è stata creata
  }

  console.log("\n" + "━".repeat(60));
  console.log(`🚀 ISSUE #${issueNumber} CREATED SUCCESSFULLY!`);
  console.log(`📌 Title:  ${newTitle}`);
  console.log("━".repeat(60));

  // Output machine-readable per bulk-issues.ts
  console.log(`##ISSUE_NUMBER##${issueNumber}##`);
} catch (error: any) {
  console.error("\n❌ [UNEXPECTED_ERROR]", error.message);
  process.exit(1);
}
