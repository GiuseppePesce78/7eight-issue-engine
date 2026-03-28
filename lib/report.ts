import { ProjectMeta } from "../types/types";

/**
 * Prints a professional decorative header for bulk issue operations.
 * It displays project metadata, source file information, and the current execution mode.
 * * @param {ProjectMeta} meta - Object containing project metadata (name, author, repository).
 * @param {string} fileName - The name of the JSON file being processed.
 * @param {string} absolutePath - The full system path to the source file.
 * @param {boolean} isDryRun - Flag to indicate if the execution is a simulation or real.
 * @returns {void}
 */
export function printHeader(meta: ProjectMeta, fileName: string, absolutePath: string, isDryRun: boolean): void {
  console.log("\n" + "━".repeat(65));
  console.log("\n" + "━".repeat(65));
  console.log(`🚀 PROJECT: ${meta.name.toUpperCase()}`);
  console.log(`👤 OWNER:   7eightDev`);
  console.log(`✍️  AUTHOR:  ${meta.author}`);
  console.log(`🔗 REPO:    ${meta.repository}`);
  console.log(`📂 SOURCE:  ${fileName}`);
  console.log(`📍 PATH:    ${absolutePath}`);
  console.log(`🛠️  MODE:    ${isDryRun ? "🔍 DRY RUN (Simulation)" : "🚀 EXECUTION (Real)"}`);
  console.log("━".repeat(65));
  console.log("━".repeat(65));
  console.log(" ".repeat(65));
}


/**
 * Prints a final execution summary for bulk issue operations.
 * Shows statistics for created, skipped, and total issues, with different layouts for Dry Run and Real modes.
 * * @param {string} projectName - The name of the project being processed.
 * @param {Object} stats - An object containing the execution statistics.
 * @param {number} stats.created - The number of issues successfully created on GitHub.
 * @param {number} stats.skipped - The number of issues skipped (e.g., already existing).
 * @param {number} stats.total - The total number of issues defined in the plan.
 * @param {boolean} isDryRun - Flag to indicate if the summary refers to a simulation.
 * @returns {void}
 */
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

/**
 * @function printSingleIssueHeader
 * @description Prints a professional decorative header for single issue operations.
 * * @param {ProjectMeta} projectMeta - Object containing project name, version, author, and repository.
 * @param {boolean} isDryRun - Flag to indicate if the current execution is a simulation.
 * @param {boolean} isTestMode - Flag to indicate if the script is running in automated test mode.
 * @returns {void}
 */
export function printSingleIssueHeader(
  meta: ProjectMeta, 
  isDryRun: boolean, 
  isTestMode: boolean,
): void {
  console.log("\n" + "━".repeat(60));
  console.log(`🚀 PROJECT: ${meta.name.toUpperCase()} v${meta.version}`);
  console.log(`✍️  AUTHOR:  ${meta.author}`);
  console.log(`🔗 REPO:    ${meta.repository}`);
  console.log(
    `🎯 ACTION:  SINGLE ISSUE ${isDryRun ? "(SIMULATION)" : isTestMode ? "(TEST)" : "(REAL)"}`
  );
  console.log("━".repeat(60));
}

/**
 * @function printSingleIssueSuccess
 * @description Prints a visual success report and a machine-readable tag after a GitHub issue is created.
 * * @param {string} issueNumber - The unique identifier assigned by GitHub to the new issue.
 * @param {string} title - The final prefixed title of the created issue (e.g., 'ISSUE-123: title').
 * @returns {void}
 */
export function printSingleIssueSuccess(issueNumber: string, title: string): void {
  console.log("\n" + "━".repeat(60));
  console.log(`🚀 ISSUE #${issueNumber} CREATED SUCCESSFULLY!`);
  console.log(`📌 Title:  ${title}`);
  console.log("━".repeat(60));
  console.log(`##ISSUE_NUMBER##${issueNumber}##`);
}

/**
 * @function printTestModeBlock
 * @description Displays a simulated issue creation block for automated testing.
 * *Outputs a mock issue number (999) and the required machine-readable tags.
 * @param {string} title - The final prefixed title of the created issue (e.g., 'ISSUE-123: title').
 * @returns {void}
 */
export function printTestModeBlock(title: string): void {
  console.log("🧪 [TEST_MODE] Simulating issue creation...");
  console.log(`📌 Mock Title: ISSUE-999: ${title}`);
  console.log("━".repeat(60));
  console.log("##ISSUE_NUMBER##999##");
}

/**
 * @function printDryRunBlock
 * @description Displays the simulation summary during a Dry Run, showing the exact command that would be executed.
 * * @param {string} command - The full gh CLI command string generated by the script.
 * @returns {void}
 */
export function printDryRunBlock(command: string): void {
  console.log("🔍 [SIMULATION] Command to be executed:");
  console.log(`\x1b[33m${command}\x1b[0m`);
  console.log("\n✅ Simulation successful. No changes were made to GitHub.");
}