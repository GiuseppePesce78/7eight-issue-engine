import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const [filePath] = process.argv.slice(2);
const isDryRun = process.env.DRY_RUN !== "false";

if (!filePath) {
  console.error("\n❌ Error: Specify the JSON file path.");
  process.exit(1);
}

const absolutePath = path.resolve(process.cwd(), filePath);
const fileName = path.basename(absolutePath);

// --- METADATA EXTRACTION ---
let projectName = "Unknown Project";
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8")
  );
  projectName = packageJson.name || "Unknown Project";
} catch (e) {
  // Silent fallback if package.json is missing
}

const OWNER = "7eightDev";

try {
  const data = JSON.parse(fs.readFileSync(absolutePath, "utf-8"));

  // --- START HEADER ---
  console.log("\n" + "━".repeat(65));
  console.log(`🚀 PROJECT: ${projectName.toUpperCase()}`);
  console.log(`👤 OWNER:   ${OWNER}`);
  console.log(`📂 SOURCE:  ${fileName}`);
  console.log(`📍 PATH:    ${absolutePath}`);
  console.log(
    `🛠️  MODE:    ${isDryRun ? "🔍 DRY RUN (Simulation)" : "🚀 EXECUTION (Real)"}`
  );
  console.log("━".repeat(65));

  let createdCount = 0;
  let skippedCount = 0;
  const totalIssues = data.length;

  for (const entry of data) {
    if (entry.state === "created") {
      console.log(`\x1b[90m[SKIPPED]\x1b[0m ${entry.issue.title}`);
      skippedCount++;
      continue;
    }

    const { issue } = entry;
    const labelsStr =
      issue.labels?.map((l: string) => `"${l}"`).join(" ") || "";
    const command = `npx tsx scripts/create-issue.ts "${issue.title}" "${issue.body}" "${issue.assignee}" ${labelsStr}`;

    if (isDryRun) {
      console.log(`\x1b[33m[PENDING]\x1b[0m ${issue.title}`);
    } else {
      try {
        console.log(`\x1b[32m[CREATING...]\x1b[0m ${issue.title}`);
        execSync(command, { stdio: "inherit" });

        entry.state = "created";
        entry.createdAt = new Date().toLocaleString("it-IT");
        createdCount++;

        fs.writeFileSync(absolutePath, JSON.stringify(data, null, 2));
      } catch (e) {
        console.error(`\n❌ Execution halted. Progress saved in: ${fileName}`);
        process.exit(1);
      }
    }
  }

  // --- FINAL SUMMARY ---
  console.log("\n" + "━".repeat(65));
  console.log(`🏁 SUMMARY FOR: ${projectName.toUpperCase()}`);
  if (skippedCount === totalIssues) {
    console.log(`💡 All issues in "${fileName}" have already been created.`);
  } else if (isDryRun) {
    console.log(
      `📝 Simulation finished. Ready to create: ${totalIssues - skippedCount} issues.`
    );
  } else {
    console.log(
      `✅ Success! New issues: ${createdCount} | Total in file: ${totalIssues}`
    );
  }
  console.log("━".repeat(65) + "\n");
} catch (error: any) {
  console.error("\n❌ Critical Error:", error.message);
}
