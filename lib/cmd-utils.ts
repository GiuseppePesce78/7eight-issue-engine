import { Issue } from "../types/types";

/**
 * Converts a single Issue object into a CLI-safe array of arguments
 * for passing to the create-issue.ts script.
 *
 * Important:
 * - All arguments are strings.
 * - Labels are JSON-stringified so multiple labels can be safely passed as a single argument.
 * - Empty strings are used for optional fields to maintain argument positions.
 *
 * @param issue - The issue object to convert
 * @returns string[] - Array of CLI arguments
 */
export function buildCommandArgs(issue: Issue): string[] {
  // DEBUG: log the raw issue object to verify contents
  console.log(`ISSUES: ${JSON.stringify(issue)}`)

  return [
    issue.title,// Required: issue title
    issue.body,// Required: issue body
    // Optional: assignee if defined and not "none", otherwise empty string
    issue.assignee && issue.assignee !== "none" ? issue.assignee : "",
    // Optional: labels array is JSON-stringified to preserve multiple labels
    JSON.stringify(issue.labels ?? [])
  ];
}

/**
 * Generates a full GitHub CLI command string for creating an issue.
 * This can be useful for logging, debugging, or executing manually.
 *
 * @param issue - The issue object to generate command for
 * @returns Issue - The original issue object augmented with `command` property
 */
export function buildGitHubCommand(issue: Issue): Issue {
  // Convert the issue into CLI arguments
  const args = buildCommandArgs(issue);

  // Join arguments into a single command string (safe only for logging/debugging)
  const command = `npx tsx create-issue.ts ${args.join(" ")}`;

  // Return a new Issue object including the generated command string
  return {
    ...issue,
    command: command
  };
}
