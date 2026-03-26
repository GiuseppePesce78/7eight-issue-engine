import { readPackageMeta } from '../lib/project-meta';
import { Issue } from "../types/types";

export function buildCommandArgsOld(issue: Issue): string[] {
  const args = [ issue.title, issue.body];
  //const args = ["tsx", "scripts/create-issue.ts", issue.title, issue.body];
  if (issue.assignee) args.push(issue.assignee);
  if (issue.labels) args.push(...issue.labels);
  return args;
}

export function buildCommandArgs(issue: Issue): string[] {
  const args: string[] = [
    issue.title,
    issue.body
  ];

  if (issue.assignee && issue.assignee !== "none") {
    args.push(issue.assignee);
  }

  if (issue.labels && issue.labels.length > 0) {
    // Aggiungiamo le label alla fine dell'array
    args.push(...issue.labels);
  }

  return args;
}

export function buildGitHubCommand(issue: Issue): Issue {
  const args = buildCommandArgs(issue);
  const command = `npx tsx create-issue.ts ${args.join(" ")}`;
  return {
    ...issue,
    command:command
  };
}

