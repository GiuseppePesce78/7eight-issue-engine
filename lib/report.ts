import { ProjectMeta } from "../types/types";

export function printHeader(meta: ProjectMeta, fileName: string, absolutePath: string, isDryRun: boolean): void {
  console.log("\n" + "━".repeat(65));
  console.log(`🚀 PROJECT: ${meta.name.toUpperCase()}`);
  console.log(`👤 OWNER:   7eightDev`);
  console.log(`✍️  AUTHOR:  ${meta.author}`);
  console.log(`🔗 REPO:    ${meta.repository}`);
  console.log(`📂 SOURCE:  ${fileName}`);
  console.log(`📍 PATH:    ${absolutePath}`);
  console.log(`🛠️  MODE:    ${isDryRun ? "🔍 DRY RUN (Simulation)" : "🚀 EXECUTION (Real)"}`);
  console.log("━".repeat(65));
}

export function printSummary(projectName: string, stats: { created: number; skipped: number; total: number }, isDryRun: boolean): void {
  console.log("\n" + "━".repeat(65));
  console.log(`🏁 SUMMARY FOR: ${projectName.toUpperCase()}`);
  console.log("━".repeat(65));

  if (isDryRun) {
    console.log(`📝 Simulation finished.`);
    console.log(`   Pending:  ${stats.total - stats.skipped}`);
    console.log(`   Skipped:  ${stats.skipped}`);
    console.log(`   Total:    ${stats.total}`);
  } else {
    console.log(`   ✅ Created:  ${stats.created}`);
    console.log(`   ⏭️  Skipped:  ${stats.skipped}`);
    console.log(`   📦 Total:    ${stats.total}`);

    if (stats.created > 0) {
      console.log("\n🎉 All issues created successfully!");
    } else if (stats.skipped === stats.total) {
      console.log("\n💡 All issues already created.");
    }
  }

  console.log("━".repeat(65) + "\n");
}

export function printSingleIssueHeader(meta: ProjectMeta, isDryRun: boolean, isTestMode: boolean): void {
  console.log("\n" + "━".repeat(60));
  console.log(`🚀 PROJECT: ${meta.name.toUpperCase()} v${meta.version}`);
  console.log(`👤 OWNER:   7eightDev`);
  console.log(`✍️  AUTHOR:  ${meta.author}`);
  console.log(`🔗 REPO:    ${meta.repository}`);
  console.log(`🎯 ACTION:  SINGLE ISSUE ${isDryRun ? "(SIMULATION)" : isTestMode ? "(TEST)" : "(REAL)"}`);
  console.log("━".repeat(60));
}

export function printSingleIssueSuccess(issueNumber: string, title: string): void {
  console.log("\n" + "━".repeat(60));
  console.log(`🚀 ISSUE #${issueNumber} CREATED SUCCESSFULLY!`);
  console.log(`📌 Title:  ${title}`);
  console.log("━".repeat(60));
  console.log(`##ISSUE_NUMBER##${issueNumber}##`);
}