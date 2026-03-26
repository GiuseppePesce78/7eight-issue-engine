import { execSync } from "child_process";
import { buildGitHubCommand } from "./cmd-utils";
import { Issue } from "../types/types";

export function validateInput(title?: string, body?: string): void {
  if (!title || !body) {
    console.error(
      '\n❌ Usage: npx tsx create-issue.ts "title" "body" "assignee" "label1" "label2"'
    );
    process.exit(1);
  }
}

export function checkGitHubCLI(): void {
  try {
    execSync("gh --version", { stdio: "ignore" });
  } catch {
    console.error(
      "\n❌ [GH_CLI_NOT_FOUND] GitHub CLI (gh) is not installed or not in PATH."
    );
    console.error("   Install it from: https://cli.github.com");
    process.exit(1);
  }
}

export function createIssue(command: string): string {
  try {
    const rawOutput = execSync(command, { encoding: "utf8" });
    return rawOutput.trim();
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
}

export function parseIssueNumber(issueUrl: string): string {
  const issueNumber = issueUrl.split("/").pop();
  if (!issueNumber || isNaN(Number(issueNumber))) {
    console.error(
      `\n❌ [PARSE_FAILED] Could not extract issue number from URL: ${issueUrl}`
    );
    process.exit(1);
  }
  return issueNumber;
}

export function renameIssue(issueNumber: string, newTitle: string): void {
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
}









