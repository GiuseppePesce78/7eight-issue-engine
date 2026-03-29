# 🛠️ 7eight-issue-engine

<p align="center">
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/GitHub%20CLI-24292e?style=for-the-badge&logo=github&logoColor=white" />
  <img src="https://img.shields.io/badge/zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white" />
  <img src="https://img.shields.io/badge/jest-C21325?style=for-the-badge&logo=jest&logoColor=white" />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge" />
</p>

> **Transform your JSON backlog into GitHub reality with one command — safely, atomically, and with full traceability.**

Stop creating GitHub issues by hand. Define your entire sprint in a JSON file, validate it with a dry run, then execute. The engine handles label verification, issue creation, auto-renaming, and real-time state persistence — without ever touching GitHub unless you explicitly tell it to.

---

## ✨ Features

- **Bulk Issue Creation** — process a JSON plan and create dozens of issues in one command
- **Single Issue CLI** — create individual issues from the terminal with full validation
- **Dry Run Mode** — simulate every run before execution, zero risk
- **Atomic JSON Persistence** — state saved after each issue, safe to interrupt and resume
- **Label Pre-flight Check** — verifies labels exist before touching GitHub, prints exact fix commands if missing
- **Auto-renaming** — issues are automatically prefixed with `ISSUE-{N}:` after creation
- **Full Test Suite** — Jest + ts-jest coverage across all core modules
- **Type Safe** — strict TypeScript + Zod validation on all data inputs

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Authenticate GitHub CLI
gh auth login

# 3. Define your issues
vim issues-plan/issues-plan.json

# 4. Dry run — validate without touching GitHub
npm run issue:plan

# 5. Execute — create real issues
npm run issue:run
```

---

## 📋 JSON Plan Format

```json
[
  {
    "state": "pending",
    "issue": {
      "title": "Setup authentication module",
      "body": "Implement Clerk-based authentication with session management.",
      "assignee": "octocat",
      "labels": ["auth", "backend"]
    }
  }
]
```

After execution, the file is updated automatically:

```json
{
  "state": "created",
  "issueNumber": "42",
  "createdAt": "2026-03-29T10:15:30.000Z",
  "issue": {
    "title": "ISSUE-42: Setup authentication module",
    ...
  }
}
```

---

## 🧭 Commands

| Command | Description |
|---|---|
| `npm run issue:plan` | Dry run — validate and preview |
| `npm run issue:run` | Execute — create real issues |
| `npm run issue:single -- "Title" "Body" "assignee" '["label"]'` | Create a single issue |
| `npm test` | Run the test suite |
| `npm run test:coverage` | Run tests with coverage report |

---

## ⚙️ Requirements

- Node.js v18+
- GitHub CLI (`gh`) — [cli.github.com](https://cli.github.com)
- `gh auth login` completed

---

## 📁 Project Structure

```
7eight-issue-engine/
├── bulk-issues.ts        # Orchestrator: bulk processing entry point
├── bulk-processor.ts     # Iteration engine and state management
├── create-issue.ts       # Executor: single issue creation
├── lib/
│   ├── bulk-data.ts      # Zod validation and JSON I/O
│   ├── cmd-utils.ts      # CLI argument construction
│   ├── project-meta.ts   # package.json metadata reader
│   ├── report.ts         # Console output and formatting
│   └── single-issue.ts   # GitHub CLI wrappers
├── types/
│   └── types.ts          # Shared TypeScript interfaces
├── __tests__/            # Jest test suite
├── issues-plan/          # Your JSON issue plans (gitignored)
└── docs/                 # Technical documentation
```

---

## 📖 Documentation

- [Architecture & Data Flow](./docs/architecture.md)
- [JSON Schema Reference](./docs/schema.md)
- [Testing Guide](./docs/testing.md)

---

## 📄 License

MIT © 2026 [7eightDev](https://github.com/7eightDev)

---

**Build fast. Track better. Scale clean.**
