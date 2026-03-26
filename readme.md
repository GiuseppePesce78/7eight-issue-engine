# 🛠️ GitHub Issue Automation Suite

<p align="center">
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/GitHub%20CLI-24292e?style=for-the-badge&logo=github&logoColor=white" />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge" />
</p>

> **Transform your JSON backlog into GitHub reality with one command.**

**7eight-issue-engine** is a lightweight, TypeScript-powered automation tool designed to bridge the gap between project planning and execution. Stop creating issues manually; define your sprint in a JSON file and let the engine handle the rest.

## 🚀 Features

- **Bulk Issue Creation**: Process JSON files to create multiple GitHub issues at once.
- **Single Issue Creation**: CLI command for individual issues.
- **Dry Run Mode**: Simulate without making changes.
- **State Tracking**: Automatic status updates in JSON (pending, created, failed).
- **Modular Architecture**: Clean, testable code with separated concerns.
- **Type Safety**: Full TypeScript support with strong typing.

## 📁 Project Structure

```
7eight-issue-engine/
├── bulk-issues.ts          # Main CLI entry for bulk processing
├── create-issue.ts         # Single issue creation script
├── lib/
│   ├── bulk-data.ts        # JSON load/save utilities
│   ├── cmd-utils.ts        # Command building utilities
│   ├── project-meta.ts     # Project metadata extraction
│   └── report.ts           # Logging and reporting functions
├── types/
│   └── types.ts            # TypeScript type definitions
├── docs/
│   ├── bulk-issue.md       # Bulk processing documentation
│   └── create-issue.md     # Single issue documentation
└── package.json
```

## ⚙️ Requirements

- Node.js (v16+)
- GitHub CLI (`gh`) installed and authenticated
- TypeScript runtime via `tsx`

Install GitHub CLI:
```bash
# macOS
brew install gh

# Or download from https://cli.github.com/
gh auth login
```

## 📦 Installation

```bash
npm install
```

## 🧠 How It Works

### Architecture Overview

The tool is built with a modular architecture:

- **Data Layer** (`lib/bulk-data.ts`): Handles JSON file operations with validation.
- **Command Layer** (`lib/cmd-utils.ts`): Safely builds CLI commands.
- **Metadata Layer** (`lib/project-meta.ts`): Extracts project info from `package.json`.
- **Reporting Layer** (`lib/report.ts`): Manages console output and summaries.
- **Types** (`types/types.ts`): Shared TypeScript interfaces.

### Bulk Issue Creator

**File**: `bulk-issues.ts`

Reads a JSON file, validates entries, and creates GitHub issues while tracking progress.

### Single Issue Creator

**File**: `create-issue.ts`

Creates individual issues via CLI with labels, assignee, and automatic naming.

## 🧪 Execution Modes

### 🔍 DRY RUN (Simulation)

No issues are created. Shows what would happen.

```bash
npm run issue:plan <file.json>
# or
DRY_RUN=true npx tsx bulk-issues.ts <file.json>
```

### 🚀 EXECUTION (Real Run)

Actually creates issues on GitHub.

```bash
npm run issue:run <file.json>
# or
DRY_RUN=false npx tsx bulk-issues.ts <file.json>
```

### 🎯 Single Issue

```bash
npm run issue:single -- "Title" "Description" "assignee" "label1" "label2"
```

## 🗂️ JSON File Structure

Example `issues.json`:

```json
[
  {
    "state": "pending",
    "issue": {
      "title": "Setup authentication",
      "body": "Implement Clerk authentication",
      "assignee": "username",
      "labels": ["auth", "backend"]
    }
  }
]
```

## 🔁 Supported States

| State    | Description |
|----------|-------------|
| pending  | Issue to be created |
| created  | Successfully created |
| failed   | Creation failed (with error details) |
| test     | Test mode entry |

## 🧾 CLI Output

During execution:

- Project metadata header
- Progress indicators: `[PENDING]`, `[CREATING...]`, `[SKIPPED]`, `[FAILED]`
- Final summary with counts

## 🧩 Automatic Naming

Created issues are renamed to: `ISSUE-<number>: <original title>`

## 🔐 Configuration

Ensure:

1. GitHub CLI is authenticated: `gh auth status`
2. You're in a GitHub repository
3. You have issue creation permissions

## 📁 Available Scripts

```json
{
  "scripts": {
    "issue:run": "DRY_RUN=false npx tsx bulk-issues.ts",
    "issue:plan": "DRY_RUN=true npx tsx bulk-issues.ts",
    "issue:single": "DRY_RUN=false npx tsx create-issue.ts"
  }
}
```

## 🧭 Recommended Workflow

1. Define issues in JSON
2. Dry run: `npm run issue:plan issues.json`
3. Review output
4. Execute: `npm run issue:run issues.json`

## 🛠️ Tech Stack

- **TypeScript**: Type safety and modern JS
- **Node.js**: Runtime
- **GitHub CLI**: Issue creation
- **Modular Design**: Separated concerns for maintainability

## 📄 License

MIT

## 👨‍💻 Author

7eightDev

## 💡 Philosophy

Built to remove manual repetition, standardize backlogs, and bridge planning to execution.

## 🚀 Future Ideas

- Multi-repository support
- Bidirectional GitHub sync
- Web UI dashboard
- Advanced templates
- CI/CD integration

**Build fast. Track better. Scale clean.**
