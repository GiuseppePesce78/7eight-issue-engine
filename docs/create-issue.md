# 📁 create-issue.ts — Technical Documentation

> Single GitHub Issue Creator

---

## 🎯 Purpose

`create-issue.ts` is responsible for creating a **single GitHub issue** using the GitHub CLI.

It is designed to be:

* Reusable
* Callable from other scripts
* Executable standalone

---

## ⚙️ Responsibilities

* Parse CLI input
* Validate required fields
* Build GitHub CLI command
* Execute issue creation
* Apply naming convention

---

## 🔄 Execution Flow (Step-by-Step)

### 1. Parse CLI Arguments

```ts
const [title, body, assignee, ...labels] = process.argv.slice(2);
```

Extracts:

* `title`
* `body`
* `assignee`
* `labels` (rest arguments)

---

### 2. Determine Execution Mode

```ts
const isDryRun = process.env.DRY_RUN !== "false";
```

* Default: safe mode

---

### 3. Validate Input

```ts
if (!title || !body)
```

* Required fields check
* Exits if invalid

---

### 4. Extract Project Metadata

Reads `package.json`:

* Used for CLI output

---

### 5. Build GitHub Command

```ts
const createCmd = `gh issue create --title "${title}" --body "${body}" ...`;
```

Includes:

* Title
* Body
* Assignee (optional)
* Labels

---

### 6. DRY RUN Mode

* Prints command
* Does not execute

---

### 7. Execute Command

```ts
const rawOutput = execSync(createCmd, { encoding: "utf8" });
```

* Calls GitHub CLI
* Returns issue URL

---

### 8. Extract Issue Number

```ts
const issueNumber = newIssueUrl.split("/").pop();
```

* Parses ID from URL

---

### 9. Rename Issue

```ts
const newTitle = `ISSUE-${issueNumber}: ${title}`;
execSync(`gh issue edit ${issueNumber} --title "${newTitle}"`);
```

* Applies naming convention

---

### 10. Output Result

Displays:

* Issue number
* Final title
* Success message

---

### 11. Error Handling

* Catches CLI errors
* Stops execution

---

## 🧠 Key Concepts

### CLI-Based Integration

* Uses `gh` instead of API
* Simpler setup
* Leverages existing auth

---

### Naming Standardization

* Ensures consistent issue titles
* Easier tracking

---

### Composability

* Designed to be called by other scripts
* Works as a building block

---

## ⚠️ Limitations

* Depends on GitHub CLI
* No API fallback
* No retries
* Blocking execution

---

## 🚀 Possible Improvements

* Switch to GitHub REST/GraphQL API
* Add validation layer
* Improve error parsing
* Support templates

---

## 🏁 Summary

`create-issue.ts` is the **execution layer** that:

* Receives structured input
* Communicates with GitHub
* Creates and standardizes issues

---

**Core idea:**

> Receive → Execute → Standardize
