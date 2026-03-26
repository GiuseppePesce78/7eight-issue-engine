# 📁 bulk-issues.ts — Technical Documentation

> Bulk GitHub Issue Orchestrator

---

## 🎯 Purpose

`bulk-issues.ts` orchestrates the creation of multiple GitHub issues from a structured JSON file. It serves as the main CLI entry point for batch operations, leveraging modular utilities for data handling, command execution, and reporting.

---

## 🏗️ Architecture

The script follows a modular design with separated concerns:

- **Data Management**: `lib/bulk-data.ts` (load/save JSON)
- **Command Building**: `lib/cmd-utils.ts` (safe command construction)
- **Metadata**: `lib/project-meta.ts` (project info extraction)
- **Reporting**: `lib/report.ts` (console output)
- **Types**: `types/types.ts` (TypeScript interfaces)

---

## ⚙️ Responsibilities

- Parse and validate input JSON file
- Extract project metadata from `package.json`
- Process each issue entry (skip created, execute pending)
- Update JSON state and persist changes
- Provide detailed CLI feedback and summaries

---

## 🔄 Execution Flow

### 1. CLI Setup
```ts
const [filePath] = process.argv.slice(2);
const isDryRun = process.env.DRY_RUN !== "false";
```
- Validates file path argument
- Determines execution mode (dry run vs real)

### 2. Metadata Extraction
```ts
const meta = readPackageMeta();
```
- Loads project info (name, version, author, repo) from `package.json`

### 3. Data Loading
```ts
const data = loadBulkData(absolutePath);
```
- Parses JSON with validation
- Ensures array structure and required fields

### 4. Header Display
```ts
printHeader(meta, fileName, absolutePath, isDryRun);
```
- Shows project details and mode

### 5. Batch Processing
```ts
const { created, skipped } = processAllEntries(data, isDryRun, absolutePath, fileName);
```
- Iterates through entries
- Calls `processEntry` for each
- Tracks counts and saves progress

### 6. Summary Report
```ts
printSummary(projectName, { created, skipped, total: data.length }, isDryRun);
```
- Displays final statistics

---

## 🔧 Key Functions

### `processEntry(entry, isDryRun, absolutePath, fileName)`
- Handles individual issue processing
- Skips if `state === "created"`
- Builds and executes command
- Updates entry state on success/failure
- Returns boolean for counting

### `processAllEntries(data, isDryRun, absolutePath, fileName)`
- Orchestrates the main loop
- Calls `processEntry` for each item
- Manages error propagation
- Saves data after each successful creation

---

## 🛡️ Error Handling

- **JSON Parsing**: Validates structure, throws descriptive errors
- **Command Execution**: Captures stderr, updates state to "failed"
- **File I/O**: Graceful fallbacks for missing files
- **Critical Errors**: Halts execution with clear messages

---

## 🔒 Security Considerations

- Commands built with array arguments to prevent injection
- Input validation on JSON structure
- No direct shell execution in unsafe ways

---

## 📊 State Management

Issues transition through states:
- `pending` → `created` (success)
- `pending` → `failed` (error)
- `created` → skipped
- `failed` → manually reset to `pending`

---

## 🚀 Performance

- Synchronous processing for reliability
- Incremental saves prevent data loss
- Minimal memory footprint

---

## 🧪 Testing

Unit tests cover:
- `loadBulkData` with valid/invalid JSON
- `processEntry` state transitions
- `saveBulkData` file operations
- Error scenarios

---

## 🔗 Dependencies

- `lib/bulk-data.ts`: Data operations
- `lib/cmd-utils.ts`: Command utilities
- `lib/project-meta.ts`: Metadata
- `lib/report.ts`: Output formatting
- `types/types.ts`: Type definitions

```ts
const absolutePath = path.resolve(process.cwd(), filePath);
```

* Ensures consistent file resolution

---

### 4. Extract Project Metadata

```ts
const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8")
);
```

* Reads project name for logging

---

### 5. Load JSON File

```ts
const data = JSON.parse(fs.readFileSync(absolutePath, "utf-8"));
```

* Expected: array of issue entries

---

### 6. Print Execution Header

Displays:

* Project name
* Owner
* Source file
* Execution mode

---

### 7. Iterate Over Issues

```ts
for (const entry of data)
```

Each entry:

```json
{
  "state": "pending",
  "issue": {
    "title": "...",
    "body": "...",
    "assignee": "...",
    "labels": []
  }
}
```

---

### 8. Skip Already Created Issues

```ts
if (entry.state === "created")
```

* Prevents duplication
* Marks as skipped

---

### 9. Build Command

```ts
const command = `npx tsx scripts/create-issue.ts ...`;
```

* Dynamically builds CLI command
* Passes issue data

---

### 10. Execution Logic

#### 🔍 DRY RUN

* Logs `[PENDING]`
* No execution

#### 🚀 REAL EXECUTION

```ts
execSync(command, { stdio: "inherit" });
```

* Calls `create-issue.ts`
* Executes synchronously

---

### 11. Update State

```ts
entry.state = "created";
entry.createdAt = new Date().toLocaleString("it-IT");
```

* Tracks progress

---

### 12. Persist Changes

```ts
fs.writeFileSync(absolutePath, JSON.stringify(data, null, 2));
```

* Writes updated JSON
* Ensures durability

---

### 13. Error Handling

* Stops execution on failure
* Prevents partial corruption

---

### 14. Final Summary

Outputs:

* Total issues
* Created issues
* Skipped issues

---

## 🧠 Key Concepts

### Idempotency

* Issues marked as `created` are skipped
* Safe to re-run multiple times

---

### State Persistence

* JSON acts as a lightweight database
* Tracks progress over time

---

### Sequential Execution

* Uses `execSync`
* Ensures predictable order

---

## ⚠️ Limitations

* Blocking execution (sync)
* No retry mechanism
* No schema validation
* Tight coupling with CLI

---

## 🚀 Possible Improvements

* Async execution (`spawn`)
* Parallel processing with limits
* JSON schema validation
* Logging system
* Retry strategy

---

## 🏁 Summary

`bulk-issues.ts` is the **orchestration layer** that:

* Reads structured data
* Delegates issue creation
* Tracks execution state
* Ensures safe and repeatable runs

---

**Core idea:**

> Orchestrate → Execute → Persist
