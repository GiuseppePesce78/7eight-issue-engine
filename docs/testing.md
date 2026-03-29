# Testing Guide

## Stack

- **Jest** `^29` — test runner
- **ts-jest** `^29` — TypeScript transformer for Jest
- **`@types/jest`** `^29` — type definitions

All tests are located in `__tests__/` and use `jest.mock` for full isolation from the GitHub CLI and filesystem where needed.

---

## Running Tests

```bash
# Run full suite
npm test

# Watch mode (re-runs on file change)
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## Test Files

### `__tests__/cmd-utils.test.ts`

Tests `buildCommandArgs()` and `buildGitHubCommand()` in `lib/cmd-utils.ts`.

No mocks required — these are pure functions.

**Covered cases:**
- Title and body returned as first two arguments
- Assignee returned correctly when defined
- Assignee returns empty string for `"none"` and `undefined`
- Labels are JSON-stringified
- Labels default to `[]` when undefined
- Always returns exactly 4 arguments
- `buildGitHubCommand` returns issue with `command` property
- `command` string contains `create-issue.ts`
- All original issue fields are preserved

---

### `__tests__/bulk-data.test.ts`

Tests `loadBulkData()`, `saveBulkData()`, and `extractUniqueLabels()` in `lib/bulk-data.ts`.

Uses a temporary `__tests__/__tmp__/` directory for file I/O, cleaned up after each test.

**Covered cases:**

`loadBulkData`:
- Loads and returns a valid JSON plan
- Throws if file does not exist
- Throws on malformed JSON (reports `JSON Syntax Error`)
- Throws if `state` is invalid
- Throws if `title` is too short (< 3 chars)
- Throws if `body` is empty
- Throws if input is not a string
- Accepts all valid states: `pending`, `created`, `failed`, `test`
- Sanitizes backticks in title and body
- Sanitizes double quotes in body
- Defaults `labels` to `[]` when omitted

`saveBulkData`:
- Writes data to JSON file
- Throws if path is not writable
- Overwrites existing file with new data

`extractUniqueLabels`:
- Returns unique labels across all entries
- Returns empty array when no labels present
- Trims whitespace from labels

---

### `__tests__/single-issue.test.ts`

Tests `checkGitHubCLI()` and `verifyLabelsOnGitHub()` in `lib/single-issue.ts`.

Mocks `child_process` entirely via `jest.mock`.

**Covered cases:**

`checkGitHubCLI`:
- Does not throw when `gh` is available
- Calls `process.exit(1)` when `gh` is not found

`verifyLabelsOnGitHub`:
- Does nothing when labels array is empty
- Does not throw when all labels exist on GitHub
- Is case-insensitive when comparing labels
- Throws with missing label names when labels are absent
- Throws auth error when `gh` CLI call fails
- Prints `gh label create` commands for each missing label

---

### `__tests__/bulk-processor.test.ts`

Tests `processEntry()` and `processAllEntries()` in `bulk-processor.ts`.

Mocks `child_process` (`spawnSync`) and `lib/bulk-data` (`saveBulkData`).

**Covered cases:**

`processEntry`:
- Skips entry with `state: "created"`
- Skips entry with `state: "test"`
- Skips without spawning in dry run mode
- Returns `true` and updates entry on successful creation
- Marks entry as `failed` and throws when issue number not found in stdout
- Marks entry as `failed` when child process exits with non-zero status

`processAllEntries`:
- Returns correct `created` and `skipped` counts
- Calls `saveBulkData` after each successful creation
- Does not call `saveBulkData` in dry run mode
- Halts execution on first failure, leaving subsequent entries untouched

---

## Mocking Strategy

All external dependencies (`gh` CLI, filesystem) are mocked at the module level using `jest.mock`. This ensures:

- Tests run without a GitHub CLI installation
- Tests run without network access
- Tests run without writing to the real filesystem (except `bulk-data.test.ts` which uses a controlled temp directory)
- Each test is fully isolated and deterministic

### Mocking `child_process`

```typescript
jest.mock('child_process', () => ({
  spawnSync: jest.fn(),
  execSync: jest.fn()
}));

const mockSpawnSync = spawnSync as jest.Mock;

// simulate success
mockSpawnSync.mockReturnValue({
  status: 0,
  stdout: '##ISSUE_NUMBER##42##',
  stderr: ''
});

// simulate failure
mockSpawnSync.mockReturnValue({
  status: 1,
  stdout: '',
  stderr: 'gh error message'
});
```

### Mocking `saveBulkData`

```typescript
jest.mock('../lib/bulk-data', () => ({
  saveBulkData: jest.fn()
}));
```

---

## Adding New Tests

1. Create a new file in `__tests__/` with the `.test.ts` extension
2. Mock all external dependencies at the top of the file
3. Use `beforeEach(() => jest.clearAllMocks())` to reset mock state between tests
4. Follow the `describe / it` structure already used in the suite

When testing a function that touches the filesystem, use a temp directory pattern:

```typescript
const TMP_DIR = path.resolve(__dirname, '__tmp__');

function writeTmp(filename: string, content: unknown): string {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);
  const filepath = path.join(TMP_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(content, null, 2));
  return filepath;
}

afterEach(() => {
  if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true });
});
```
