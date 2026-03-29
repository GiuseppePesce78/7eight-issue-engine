import fs from 'fs';
import path from 'path';
import { loadBulkData, saveBulkData, extractUniqueLabels } from '../lib/bulk-data';
import { BulkEntry } from '../types/types';

// ─── Helpers ───────────────────────────────────────────────────────────────

const TMP_DIR = path.resolve(__dirname, '__tmp__');

function writeTmp(filename: string, content: unknown): string {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);
  const filepath = path.join(TMP_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(content, null, 2));
  return filepath;
}

function cleanTmp() {
  if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true });
}

const VALID_ENTRY: BulkEntry = {
  state: 'pending',
  issue: { title: 'My title', body: 'My body', labels: ['bug'] }
};

// ─── loadBulkData ──────────────────────────────────────────────────────────

describe('loadBulkData()', () => {
  afterEach(cleanTmp);

  it('loads and returns a valid JSON plan', () => {
    const filepath = writeTmp('valid.json', [VALID_ENTRY]);
    const data = loadBulkData(filepath);
    expect(data).toHaveLength(1);
    expect(data[0].state).toBe('pending');
    expect(data[0].issue.title).toBe('My title');
  });

  it('throws if file does not exist', () => {
    expect(() => loadBulkData('/nonexistent/path/file.json')).toThrow('not found');
  });

  it('throws on malformed JSON', () => {
    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);
    const filepath = path.join(TMP_DIR, 'bad.json');
    fs.writeFileSync(filepath, '{ this is not json }');
    expect(() => loadBulkData(filepath)).toThrow('JSON Syntax Error');
  });

  it('throws if state is invalid', () => {
    const filepath = writeTmp('bad-state.json', [{ ...VALID_ENTRY, state: 'unknown' }]);
    expect(() => loadBulkData(filepath)).toThrow('Validation failed');
  });

  it('throws if title is too short', () => {
    const filepath = writeTmp('short-title.json', [{
      ...VALID_ENTRY,
      issue: { ...VALID_ENTRY.issue, title: 'ab' }
    }]);
    expect(() => loadBulkData(filepath)).toThrow('Validation failed');
  });

  it('throws if body is empty', () => {
    const filepath = writeTmp('empty-body.json', [{
      ...VALID_ENTRY,
      issue: { ...VALID_ENTRY.issue, body: '' }
    }]);
    expect(() => loadBulkData(filepath)).toThrow('Validation failed');
  });

  it('throws if input is not a string', () => {
    expect(() => loadBulkData(null as any)).toThrow('Invalid input');
  });

  it('accepts all valid states', () => {
    for (const state of ['pending', 'created', 'failed', 'test'] as const) {
      const filepath = writeTmp(`state-${state}.json`, [{ ...VALID_ENTRY, state }]);
      expect(() => loadBulkData(filepath)).not.toThrow();
    }
  });

  it('sanitizes backticks in title and body', () => {
    const filepath = writeTmp('backtick.json', [{
      ...VALID_ENTRY,
      issue: { ...VALID_ENTRY.issue, title: 'Fix `code`', body: 'Use `fn()` here' }
    }]);
    const data = loadBulkData(filepath);
    expect(data[0].issue.title).toContain('\\`');
    expect(data[0].issue.body).toContain('\\`');
  });

  it('sanitizes double quotes in body', () => {
    const filepath = writeTmp('quotes.json', [{
      ...VALID_ENTRY,
      issue: { ...VALID_ENTRY.issue, body: 'He said "hello"' }
    }]);
    const data = loadBulkData(filepath);
    expect(data[0].issue.body).toContain('\\"');
  });

  it('defaults labels to empty array when omitted', () => {
    const filepath = writeTmp('no-labels.json', [{
      state: 'pending',
      issue: { title: 'My title', body: 'My body' }
    }]);
    const data = loadBulkData(filepath);
    expect(data[0].issue.labels).toEqual([]);
  });
});

// ─── saveBulkData ──────────────────────────────────────────────────────────

describe('saveBulkData()', () => {
  afterEach(cleanTmp);

  it('writes data to JSON file', () => {
    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);
    const filepath = path.join(TMP_DIR, 'output.json');
    saveBulkData(filepath, [VALID_ENTRY]);
    const raw = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    expect(raw).toHaveLength(1);
    expect(raw[0].state).toBe('pending');
  });

  it('throws if path is not writable', () => {
    expect(() => saveBulkData('/nonexistent/dir/file.json', [VALID_ENTRY])).toThrow();
  });

  it('overwrites existing file with new data', () => {
    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);
    const filepath = path.join(TMP_DIR, 'overwrite.json');
    saveBulkData(filepath, [VALID_ENTRY]);
    const updated: BulkEntry = { ...VALID_ENTRY, state: 'created', issueNumber: '42' };
    saveBulkData(filepath, [updated]);
    const raw = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    expect(raw[0].state).toBe('created');
    expect(raw[0].issueNumber).toBe('42');
  });
});

// ─── extractUniqueLabels ───────────────────────────────────────────────────

describe('extractUniqueLabels()', () => {
  it('returns unique labels across all entries', () => {
    const data: BulkEntry[] = [
      { state: 'pending', issue: { title: 'T1', body: 'B1', labels: ['bug', 'feature'] } },
      { state: 'pending', issue: { title: 'T2', body: 'B2', labels: ['bug', 'docs'] } }
    ];
    const labels = extractUniqueLabels(data);
    expect(labels).toHaveLength(3);
    expect(labels).toContain('bug');
    expect(labels).toContain('feature');
    expect(labels).toContain('docs');
  });

  it('returns empty array when no labels are present', () => {
    const data: BulkEntry[] = [
      { state: 'pending', issue: { title: 'T', body: 'B', labels: [] } }
    ];
    expect(extractUniqueLabels(data)).toHaveLength(0);
  });

  it('trims whitespace from labels', () => {
    const data: BulkEntry[] = [
      { state: 'pending', issue: { title: 'T', body: 'B', labels: ['  bug  '] } }
    ];
    const labels = extractUniqueLabels(data);
    expect(labels).toContain('bug');
  });
});
