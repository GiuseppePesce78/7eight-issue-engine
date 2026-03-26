export type IssueState = "pending" | "created" | "failed" | "test";

// types/types.ts
export interface Issue {
  title: string;
  body: string;
  assignee?: string;
  labels?: string[];
  command?: string;
}
export interface BulkEntry {
  state: IssueState;
  issue: Issue;
  createdAt?: string;
  failedAt?: string;
  issueNumber?: string;
  error?: string;
}

export interface ProjectMeta {
  name: string;
  version: string;
  author: string;
  repository: string;
}

export interface BulkEntry {
  state: IssueState;
  issue: Issue;
  createdAt?: string;
  failedAt?: string;
  issueNumber?: string;
  error?: string;
}