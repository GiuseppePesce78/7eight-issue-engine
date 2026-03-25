import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const [title, body, assignee, ...labels] = process.argv.slice(2);
const isDryRun = process.env.DRY_RUN !== "false"; // Default a true se non specificato diversamente

// --- METADATA EXTRACTION ---
let projectName = "Unknown Project";
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8")
  );
  projectName = packageJson.name || "Unknown Project";
} catch (e) {}

const OWNER = "7eightDev";

if (!title || !body) {
  console.error(
    '\n❌ Usage: npx tsx create-issue.ts "title" "body" "assignee" "label1" "label2"'
  );
  process.exit(1);
}

// --- START HEADER ---
console.log("\n" + "━".repeat(60));
console.log(`🚀 PROJECT: ${projectName.toUpperCase()}`);
console.log(`👤 OWNER:   ${OWNER}`);
console.log(`🎯 ACTION:  SINGLE ISSUE ${isDryRun ? "(SIMULATION)" : "(REAL)"}`);
console.log("━".repeat(60));

try {
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
  const rawOutput = execSync(createCmd, { encoding: "utf8" });
  const newIssueUrl = rawOutput.trim();
  const issueNumber = newIssueUrl.split("/").pop();

  const newTitle = `ISSUE-${issueNumber}: ${title}`;
  execSync(`gh issue edit ${issueNumber} --title "${newTitle}"`);

  console.log("\n" + "━".repeat(60));
  console.log(`🚀 ISSUE #${issueNumber} CREATED SUCCESSFULLY!`);
  console.log(`📌 Title:  ${newTitle}`);
  console.log("━".repeat(60));

  console.log(`ISSUE #${issueNumber}`);
} catch (error: any) {
  console.error("\n❌ Error during execution:");
  console.error(error.message);
  process.exit(1);
}
