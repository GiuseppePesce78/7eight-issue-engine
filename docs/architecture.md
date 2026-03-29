# Architecture & Data Flow

## Overview

7eight-issue-engine follows an **Orchestrator-Executor** pattern. Bulk processing and single issue creation are fully decoupled — the executor can run standalone without involving the orchestrator at all.

```
bulk-issues.ts          ← Orchestrator
    │
    ├── bulk-processor.ts   ← Iteration engine
    │       │
    │       └── create-issue.ts  ← Executor (spawned as child process)
    │
    └── lib/
        ├── bulk-data.ts    ← Zod validation + JSON I/O
        ├── cmd-utils.ts    ← Argument construction
        ├── project-meta.ts ← package.json reader
        ├── report.ts       ← Console output
        └── single-issue.ts ← GitHub CLI wrappers
```

---

## Module Responsibilities

### `bulk-issues.ts` — Orchestrator

Entry point for bulk processing. Responsible for:

- Reading the JSON plan path from CLI arguments
- Detecting `DRY_RUN` environment variable
- Calling `loadBulkData()` for Zod validation
- Running the label pre-flight check via `verifyLabelsOnGitHub()`
- Reading project metadata from `package.json`
- Delegating iteration to `processAllEntries()`
- Printing the final summary

Does **not** know how to create a single issue.

---

### `bulk-processor.ts` — Iteration Engine

Contains the core loop logic. Responsible for:

- Iterating over each `BulkEntry`
- Skipping entries with `state: "created"` or `state: "test"`
- Logging `[PENDING]` in dry run mode without spawning
- Spawning `create-issue.ts` as a child process via `spawnSync`
- Parsing the `##ISSUE_NUMBER##N##` tag from child stdout
- Updating `entry.state`, `entry.issueNumber`, `entry.createdAt`
- Calling `saveBulkData()` atomically after each successful creation
- Halting execution on failure, preserving JSON state

---

### `create-issue.ts` — Executor

Standalone script for single issue creation. Can be invoked directly or as a child process. Responsible for:

- Validating CLI arguments with Zod (`SingleIssueSchema`)
- Running pre-flight checks (`checkGitHubCLI`, `verifyLabelsOnGitHub`)
- Building the `gh issue create` call via `spawnSync` with array arguments (no shell interpolation)
- Parsing the issue number from the returned GitHub URL via regex
- Auto-renaming the issue title to `ISSUE-{N}: {title}`
- Printing `##ISSUE_NUMBER##N##` to stdout for the orchestrator to capture
- Handling dry run and test mode exits

---

### `lib/bulk-data.ts` — Validation & I/O

The data layer. Responsible for:

- Defining `StateEnum` and `BulkEntrySchema` with Zod
- Loading and validating JSON plans (`loadBulkData`)
- Sanitizing all string fields via `sanitizeForShell()` (escapes `\`, `"`, `` ` ``)
- Saving updated plans to disk (`saveBulkData`)
- Extracting unique labels across all entries (`extractUniqueLabels`)
- Enforcing file size limit (10MB max)

---

### `lib/single-issue.ts` — GitHub CLI Wrappers

Thin wrappers around `gh` CLI calls. Responsible for:

- Verifying GitHub CLI is installed (`checkGitHubCLI`)
- Verifying labels exist on the repository (`verifyLabelsOnGitHub`) — prints exact `gh label create` commands for any missing labels
- Creating issues (`createIssue`)
- Parsing issue numbers from URLs (`parseIssueNumber`)
- Renaming issue titles (`renameIssue`)

---

### `lib/cmd-utils.ts` — Argument Construction

Converts an `Issue` object into a positional CLI argument array for passing to `create-issue.ts` via `spawnSync`. Labels are JSON-stringified to preserve the array as a single argument.

---

### `lib/project-meta.ts` — Metadata Reader

Reads `name`, `version`, `author`, and `repository` from `package.json`. Returns safe defaults if the file is missing or malformed.

---

### `lib/report.ts` — Console Output

All user-facing output is centralized here. Functions cover: bulk header, bulk summary, single issue header, success block, dry run block, and test mode block.

---

## Data Flow — Bulk Execution

```
1. CLI: npm run issue:run
        │
        ▼
2. bulk-issues.ts
   ├── loadBulkData(path)         → Zod validation + shell sanitization
   ├── verifyLabelsOnGitHub()     → pre-flight: halt if labels missing
   └── processAllEntries()
            │
            ▼ for each entry
3. bulk-processor.ts / processEntry()
   ├── state === "created" | "test"  → SKIP
   ├── isDryRun === true             → log [PENDING], return
   └── spawnSync('npx tsx create-issue.ts', [...args])
            │
            ▼
4. create-issue.ts (child process)
   ├── Zod validation
   ├── verifyLabelsOnGitHub()
   ├── spawnSync('gh', ['issue', 'create', ...])
   ├── parse issue number from URL  → /\/issues\/(\d+)$/
   ├── execSync('gh issue edit N --title "ISSUE-N: title"')
   └── stdout: ##ISSUE_NUMBER##N##
            │
            ▼
5. bulk-processor.ts
   ├── parse ##ISSUE_NUMBER## from child stdout
   ├── entry.state = "created"
   ├── entry.issueNumber = "N"
   ├── entry.createdAt = ISO timestamp
   └── saveBulkData()              → atomic JSON write
```

---

## Environment Variables

| Variable | Default | Effect |
|---|---|---|
| `DRY_RUN` | `"true"` | `"false"` enables real execution. All other values = simulation |
| `TEST_MODE` | `"false"` | `"true"` returns mock issue #999, never calls GitHub |

---

## Design Principles

**Safe-by-Default.** `DRY_RUN` defaults to `true`. Execution requires an explicit opt-in.

**Atomic Persistence.** JSON is written to disk after every single issue, not at the end of the run. A crash mid-run preserves all progress.

**No Shell Interpolation.** `create-issue.ts` uses `spawnSync` with an argument array. Special characters in titles and bodies (backticks, quotes, brackets) are passed literally without shell interpretation.

**Idempotent Runs.** Entries with `state: "created"` or `state: "test"` are always skipped. Re-running the same plan is always safe.

**Halt on Failure.** If any issue creation fails, execution stops immediately. The JSON reflects the last known good state, and the next run resumes from the first unprocessed entry.
