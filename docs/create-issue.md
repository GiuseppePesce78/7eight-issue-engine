# 📁 create-issue.ts — Technical Documentation

> Modular Single GitHub Issue Creator

---

## 🎯 Purpose

`create-issue.ts` is the **orchestrator** for creating a single GitHub issue, now refactored into a modular architecture with extracted functions in the `lib/` directory.

It coordinates between:
- **Metadata extraction** (`lib/project-meta.ts`)
- **Command building** (`lib/cmd-utils.ts`)
- **Issue operations** (`lib/single-issue.ts`)
- **Output formatting** (`lib/report.ts`)

---

## ⚙️ Responsibilities

* Parse and validate CLI input
* Coordinate metadata extraction and display
* Orchestrate issue creation workflow
* Handle different execution modes (test, dry-run, real)
* Provide clean error handling and user feedback

---

## 🔄 Execution Flow (Step-by-Step)

### 1. Parse CLI Arguments

```ts
const [title, body, assignee, ...labels] = process.argv.slice(2);
```

Extracts required and optional parameters.

---

### 2. Determine Execution Mode

```ts
const isDryRun = process.env.DRY_RUN !== "false";
const isTestMode = process.env.TEST_MODE === "true";
```

Supports three modes: test, dry-run, and real execution.

---

### 3. Extract Project Metadata

```ts
const { name: projectName, version: projectVersion, author: projectAuthor, repository: projectRepo } = readPackageMeta();
```

Uses `lib/project-meta.ts` for consistent metadata handling.

---

### 4. Validate Input

```ts
validateInput(title, body);
```

Uses `lib/single-issue.ts` for input validation with clear error messages.

---

### 5. Display Project Header

```ts
printSingleIssueHeader(meta, isDryRun, isTestMode);
```

Uses `lib/report.ts` for formatted header display.

---

### 6. Test Mode Handling

```ts
if (isTestMode) {
  // Simulate creation without API calls
}
```

Provides mock output for development testing.

---

### 7. Check GitHub CLI Availability

```ts
checkGitHubCLI();
```

Uses `lib/single-issue.ts` to verify GitHub CLI installation.

---

### 8. Build GitHub Command

```ts
const createCmd = buildGitHubCommand(title, body, assignee, labels);
```

Uses `lib/cmd-utils.ts` for safe command construction.

---

### 9. Dry Run Mode

Displays the command that would be executed without running it.

---

### 10. Execute Issue Creation

```ts
const newIssueUrl = createIssue(createCmd);
```

Uses `lib/single-issue.ts` for GitHub CLI execution with error handling.

---

### 11. Parse Issue Number

```ts
const issueNumber = parseIssueNumber(newIssueUrl);
```

Uses `lib/single-issue.ts` to extract issue number from GitHub URL.

---

### 12. Apply Naming Convention

```ts
const newTitle = `ISSUE-${issueNumber}: ${title}`;
renameIssue(issueNumber, newTitle);
```

Uses `lib/single-issue.ts` for title standardization.

---

### 13. Display Success

```ts
printSingleIssueSuccess(issueNumber, newTitle);
```

Uses `lib/report.ts` for formatted success output.

---

## 🧠 Key Concepts

### Modular Architecture

**Separation of Concerns:**
- `lib/project-meta.ts`: Metadata extraction and fallbacks
- `lib/cmd-utils.ts`: Command building utilities
- `lib/single-issue.ts`: Issue-specific operations
- `lib/report.ts`: Output formatting and display
- `create-issue.ts`: Orchestration and coordination

---

### Multi-Mode Operation

* **Test Mode**: Development simulation with mock data
* **Dry Run**: Command preview without execution
* **Real Mode**: Actual GitHub API interaction

---

### Error Handling Strategy

* **Input Validation**: Early failure with clear messages
* **CLI Availability**: Pre-flight checks
* **API Errors**: Specific error types (labels, permissions, network)
* **Graceful Degradation**: Non-critical failures don't block success

---

### Standardized Issue Management

* ISSUE-XXX prefix for consistent tracking
* Machine-readable output for bulk operations
* Structured error codes for debugging

---

## 📂 Module Dependencies

### lib/project-meta.ts
- `readPackageMeta()`: Extracts project information

### lib/cmd-utils.ts
- `buildGitHubCommand()`: Constructs GitHub CLI commands

### lib/single-issue.ts
- `validateInput()`: Input validation
- `checkGitHubCLI()`: CLI availability check
- `createIssue()`: Issue creation execution
- `parseIssueNumber()`: URL parsing
- `renameIssue()`: Title standardization

### lib/report.ts
- `printSingleIssueHeader()`: Formatted header display
- `printSingleIssueSuccess()`: Success confirmation

---

## ⚠️ Limitations

* Depends on GitHub CLI installation
* Synchronous execution (blocking)
* No retry logic for transient failures
* Limited to GitHub issues (no PRs, discussions)

---

## 🚀 Possible Improvements

* Switch to GitHub REST API for better error handling
* Add retry logic with exponential backoff
* Support issue templates
* Add validation for assignee/label existence
* Implement async execution for better UX
* Add progress indicators for long operations

---

## 🏁 Summary

`create-issue.ts` is now a **clean orchestrator** that:

* Delegates to specialized modules for each concern
* Maintains simple, readable flow
* Enables easy testing and maintenance
* Provides consistent user experience
* Supports multiple execution modes

---

**Core idea:**

> Orchestrate → Delegate → Succeed
