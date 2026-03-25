# 📁 bulk-issues.ts — Technical Documentation

> Bulk GitHub Issue Orchestrator

---

## 🎯 Purpose

`bulk-issues.ts` is responsible for orchestrating the creation of multiple GitHub issues starting from a structured JSON file.

It acts as the **main entry point** for batch operations.

---

## ⚙️ Responsibilities

* Parse input JSON file
* Skip already created issues
* Execute issue creation via child process
* Persist state updates
* Provide detailed CLI output

---

## 🔄 Execution Flow (Step-by-Step)

### 1. Parse CLI Argument

```ts
const [filePath] = process.argv.slice(2);
```

* Expects a JSON file path
* Throws error if missing

---

### 2. Determine Execution Mode

```ts
const isDryRun = process.env.DRY_RUN !== "false";
```

* Default: `true` (safe mode)
* `false` → real execution

---

### 3. Resolve Absolute Path

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
