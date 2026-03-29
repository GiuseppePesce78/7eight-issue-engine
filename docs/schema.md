# JSON Schema Reference

The issue plan is an array of `BulkEntry` objects. The schema is enforced by Zod at load time — invalid entries halt execution before any GitHub API calls are made.

---

## BulkEntry

```typescript
interface BulkEntry {
  state: IssueState;
  issue: Issue;
  issueNumber?: string;
  createdAt?: string;
  failedAt?: string;
  error?: string;
}
```

### Root-level fields

| Field | Type | Required | Description |
|---|---|---|---|
| `state` | `IssueState` | ✅ | Execution state of this entry |
| `issue` | `Issue` | ✅ | The issue payload |
| `issueNumber` | `string` | Auto-set | GitHub issue number, written after creation |
| `createdAt` | `string` (ISO 8601) | Auto-set | Timestamp of successful creation |
| `failedAt` | `string` (ISO 8601) | Auto-set | Timestamp of failure |
| `error` | `string` | Auto-set | Error message if `state` is `"failed"` |

---

## IssueState

```typescript
type IssueState = "pending" | "created" | "failed" | "test";
```

| Value | Description |
|---|---|
| `pending` | Issue to be created on the next run |
| `created` | Successfully created — always skipped on subsequent runs |
| `failed` | Creation failed — check `error` field for details |
| `test` | Test plan entry — always skipped, used with `TEST_MODE=true` |

---

## Issue

```typescript
interface Issue {
  title: string;
  body: string;
  assignee?: string;
  labels?: string[];
}
```

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `title` | `string` | ✅ | 3–255 chars, trimmed | Issue title. Prefixed with `ISSUE-{N}:` after creation |
| `body` | `string` | ✅ | Min 1 char, trimmed | Issue body / description |
| `assignee` | `string` | ❌ | — | GitHub username. Use `"none"` or omit to skip |
| `labels` | `string[]` | ❌ | Defaults to `[]` | Label names. **Must already exist on GitHub** |

---

## State Machine

```
[pending] ──── success ───► [created]  (skipped on all future runs)
    │
    └───── failure ────────► [failed]   (check error field, reset to pending to retry)

[test]    ──────────────────► [SKIPPED] (never processed, used for TEST_MODE plans)
```

---

## Examples

### Minimal entry

```json
{
  "state": "pending",
  "issue": {
    "title": "Fix login redirect",
    "body": "OAuth callback returns 404 on production."
  }
}
```

### Full entry

```json
{
  "state": "pending",
  "issue": {
    "title": "Setup authentication module",
    "body": "Implement Clerk-based authentication with session management.\n\n- Configure Clerk provider\n- Add middleware\n- Protect routes",
    "assignee": "octocat",
    "labels": ["auth", "backend", "sprint-1"]
  }
}
```

### After successful creation (auto-updated)

```json
{
  "state": "created",
  "issueNumber": "42",
  "createdAt": "2026-03-29T10:15:30.000Z",
  "issue": {
    "title": "ISSUE-42: Setup authentication module",
    "body": "Implement Clerk-based authentication...",
    "assignee": "octocat",
    "labels": ["auth", "backend", "sprint-1"]
  }
}
```

### After failure (auto-updated)

```json
{
  "state": "failed",
  "failedAt": "2026-03-29T10:15:30.000Z",
  "error": "Failed to extract issue number",
  "issue": {
    "title": "Setup authentication module",
    ...
  }
}
```

### Test plan entry

```json
{
  "state": "test",
  "issue": {
    "title": "test: verify basic flow",
    "body": "Mock issue for TEST_MODE validation.",
    "assignee": "@me",
    "labels": ["bug"]
  }
}
```

---

## Validation Rules

All fields are validated by Zod before any GitHub call is made. Errors are reported with the exact path:

```
❌ Critical Error: Validation failed in [issues-plan.json]:
   Path "0.issue.title": Title must be at least 3 characters long
   Path "1.state": Invalid enum value. Expected 'created' | 'pending' | 'failed' | 'test'
```

### Shell Sanitization

After Zod validation, all string fields (`title`, `body`, `labels`) are passed through `sanitizeForShell()` which escapes:

- `\` → `\\`
- `"` → `\"`
- `` ` `` → `` \` ``

This happens automatically — you do not need to pre-escape content in the JSON file.

---

## Extending the Schema

To add new fields (e.g. `priority`, `milestone`), declare them in `BulkEntrySchema` in `lib/bulk-data.ts` **before** using them in any JSON plan. Undeclared fields cause a Zod strict-mode validation error.

```typescript
const BulkEntrySchema = z.object({
  state: StateEnum,
  issue: z.object({
    // existing fields...
    priority: z.enum(['low', 'medium', 'high']).optional(), // ← add here
  }),
  // ...
}).strict();
```

If the new field is passed to a `gh` CLI command, it must also be passed through `sanitizeForShell()` in `lib/bulk-data.ts`.
