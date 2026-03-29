import { processEntry, processAllEntries } from '../bulk-processor';
import { saveBulkData } from '../lib/bulk-data';
import { BulkEntry } from '../types/types';
import { spawnSync } from 'child_process';

jest.mock('child_process', () => ({
  spawnSync: jest.fn()
}));

jest.mock('../lib/bulk-data', () => ({
  saveBulkData: jest.fn()
}));

const mockSpawnSync = spawnSync as jest.Mock;
const mockSaveBulkData = saveBulkData as jest.Mock;

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<BulkEntry> = {}): BulkEntry {
  return {
    state: 'pending',
    issue: { title: 'Test issue', body: 'Test body', labels: ['bug'] },
    ...overrides
  };
}

function mockSuccess(issueNumber: string = '42') {
  mockSpawnSync.mockReturnValue({
    status: 0,
    stdout: `🚀 ISSUE #${issueNumber} CREATED SUCCESSFULLY!\n##ISSUE_NUMBER##${issueNumber}##\n`,
    stderr: ''
  });
}

// ─── processEntry ──────────────────────────────────────────────────────────

describe('processEntry()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('skips entry with state "created"', () => {
    const entry = makeEntry({ state: 'created' });
    const result = processEntry(entry, false, '/path/plan.json', 'plan.json');
    expect(result).toBe(false);
    expect(mockSpawnSync).not.toHaveBeenCalled();
  });

  it('skips entry with state "test"', () => {
    const entry = makeEntry({ state: 'test' });
    const result = processEntry(entry, false, '/path/plan.json', 'plan.json');
    expect(result).toBe(false);
    expect(mockSpawnSync).not.toHaveBeenCalled();
  });

  it('skips without spawning in dry run mode', () => {
    const entry = makeEntry();
    const result = processEntry(entry, true, '/path/plan.json', 'plan.json');
    expect(result).toBe(false);
    expect(mockSpawnSync).not.toHaveBeenCalled();
  });

  it('returns true and updates entry on successful creation', () => {
    const entry = makeEntry();
    mockSuccess('99');
    const result = processEntry(entry, false, '/path/plan.json', 'plan.json');
    expect(result).toBe(true);
    expect(entry.state).toBe('created');
    expect(entry.issueNumber).toBe('99');
    expect(entry.createdAt).toBeDefined();
  });

  it('marks entry as failed and throws when issue number not found', () => {
    const entry = makeEntry();
    mockSpawnSync.mockReturnValue({ status: 0, stdout: 'no tag here', stderr: '' });
    expect(() => processEntry(entry, false, '/path/plan.json', 'plan.json')).toThrow('Execution halted');
    expect(entry.state).toBe('failed');
    expect(entry.failedAt).toBeDefined();
    expect(entry.error).toBeDefined();
  });

  it('marks entry as failed when child process exits with non-zero status', () => {
    const entry = makeEntry();
    mockSpawnSync.mockReturnValue({ status: 1, stdout: '', stderr: 'gh error' });
    expect(() => processEntry(entry, false, '/path/plan.json', 'plan.json')).toThrow('Execution halted');
    expect(entry.state).toBe('failed');
  });
});

// ─── processAllEntries ─────────────────────────────────────────────────────

describe('processAllEntries()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns correct created and skipped counts', () => {
    mockSuccess('1');
    const data: BulkEntry[] = [
      makeEntry(),
      makeEntry({ state: 'created' }),
      makeEntry()
    ];
    // Make second call return a different issue number
    mockSpawnSync
      .mockReturnValueOnce({ status: 0, stdout: '##ISSUE_NUMBER##1##', stderr: '' })
      .mockReturnValueOnce({ status: 0, stdout: '##ISSUE_NUMBER##2##', stderr: '' });

    const { created, skipped } = processAllEntries(data, false, '/path/plan.json', 'plan.json');
    expect(created).toBe(2);
    expect(skipped).toBe(1);
  });

  it('saves JSON after each successful creation', () => {
    mockSpawnSync.mockReturnValue({ status: 0, stdout: '##ISSUE_NUMBER##42##', stderr: '' });
    const data: BulkEntry[] = [makeEntry(), makeEntry()];
    processAllEntries(data, false, '/path/plan.json', 'plan.json');
    expect(mockSaveBulkData).toHaveBeenCalledTimes(2);
  });

  it('does not save JSON in dry run mode', () => {
    const data: BulkEntry[] = [makeEntry(), makeEntry()];
    processAllEntries(data, true, '/path/plan.json', 'plan.json');
    expect(mockSaveBulkData).not.toHaveBeenCalled();
  });

  it('halts execution on first failure', () => {
    mockSpawnSync
      .mockReturnValueOnce({ status: 0, stdout: '##ISSUE_NUMBER##1##', stderr: '' })
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: 'error' });

    const data: BulkEntry[] = [makeEntry(), makeEntry(), makeEntry()];
    expect(() => processAllEntries(data, false, '/path/plan.json', 'plan.json')).toThrow('Execution halted');
    // Third entry never processed
    expect(data[2].state).toBe('pending');
  });
});
