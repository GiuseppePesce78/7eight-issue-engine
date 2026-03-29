import { execSync } from 'child_process';
import {
  checkGitHubCLI,
  verifyLabelsOnGitHub
} from '../lib/single-issue';

jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

const mockExecSync = execSync as jest.Mock;

// ─── checkGitHubCLI ────────────────────────────────────────────────────────

describe('checkGitHubCLI()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not throw when gh is available', () => {
    mockExecSync.mockReturnValue('gh version 2.0.0');
    expect(() => checkGitHubCLI()).not.toThrow();
  });

  it('calls process.exit(1) when gh is not found', () => {
    mockExecSync.mockImplementation(() => { throw new Error('not found'); });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
    expect(() => checkGitHubCLI()).toThrow('process.exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});

// ─── verifyLabelsOnGitHub ──────────────────────────────────────────────────

describe('verifyLabelsOnGitHub()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does nothing when labels array is empty', () => {
    expect(() => verifyLabelsOnGitHub([])).not.toThrow();
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  it('does not throw when all labels exist', () => {
    mockExecSync.mockReturnValue(
      JSON.stringify([{ name: 'bug' }, { name: 'feature' }])
    );
    expect(() => verifyLabelsOnGitHub(['bug', 'feature'])).not.toThrow();
  });

  it('is case-insensitive when comparing labels', () => {
    mockExecSync.mockReturnValue(JSON.stringify([{ name: 'Bug' }]));
    expect(() => verifyLabelsOnGitHub(['bug'])).not.toThrow();
  });

  it('throws with missing label names when labels are absent', () => {
    mockExecSync.mockReturnValue(JSON.stringify([{ name: 'bug' }]));
    expect(() => verifyLabelsOnGitHub(['bug', 'missing-label']))
      .toThrow('Missing labels: missing-label');
  });

  it('throws auth error when gh CLI call fails', () => {
    mockExecSync.mockImplementation(() => { throw new Error('command not found: gh'); });
    expect(() => verifyLabelsOnGitHub(['bug']))
      .toThrow('GitHub CLI Error');
  });

  it('prints gh create commands for each missing label', () => {
    mockExecSync.mockReturnValue(JSON.stringify([]));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      verifyLabelsOnGitHub(['bug', 'feature']);
    } catch {}
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('gh label create "bug"'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('gh label create "feature"'));
    consoleSpy.mockRestore();
  });
});
