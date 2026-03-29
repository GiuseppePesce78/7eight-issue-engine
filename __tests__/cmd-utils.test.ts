import { buildCommandArgs, buildGitHubCommand } from '../lib/cmd-utils';
import { Issue } from '../types/types';

describe('buildCommandArgs()', () => {
  it('returns title and body as first two args', () => {
    const issue: Issue = { title: 'My title', body: 'My body' };
    const args = buildCommandArgs(issue);
    expect(args[0]).toBe('My title');
    expect(args[1]).toBe('My body');
  });

  it('returns assignee when defined and not "none"', () => {
    const issue: Issue = { title: 'T', body: 'B', assignee: 'octocat' };
    const args = buildCommandArgs(issue);
    expect(args[2]).toBe('octocat');
  });

  it('returns empty string for assignee when "none"', () => {
    const issue: Issue = { title: 'T', body: 'B', assignee: 'none' };
    const args = buildCommandArgs(issue);
    expect(args[2]).toBe('');
  });

  it('returns empty string for assignee when undefined', () => {
    const issue: Issue = { title: 'T', body: 'B' };
    const args = buildCommandArgs(issue);
    expect(args[2]).toBe('');
  });

  it('JSON-stringifies labels array', () => {
    const issue: Issue = { title: 'T', body: 'B', labels: ['bug', 'feature'] };
    const args = buildCommandArgs(issue);
    expect(args[3]).toBe('["bug","feature"]');
  });

  it('returns empty JSON array when labels is undefined', () => {
    const issue: Issue = { title: 'T', body: 'B' };
    const args = buildCommandArgs(issue);
    expect(args[3]).toBe('[]');
  });

  it('always returns exactly 4 arguments', () => {
    const issue: Issue = { title: 'T', body: 'B' };
    expect(buildCommandArgs(issue)).toHaveLength(4);
  });
});

describe('buildGitHubCommand()', () => {
  it('returns issue object with command property', () => {
    const issue: Issue = { title: 'T', body: 'B', labels: ['bug'] };
    const result = buildGitHubCommand(issue);
    expect(result.command).toBeDefined();
    expect(typeof result.command).toBe('string');
  });

  it('command string contains create-issue.ts', () => {
    const issue: Issue = { title: 'T', body: 'B' };
    const result = buildGitHubCommand(issue);
    expect(result.command).toContain('create-issue.ts');
  });

  it('preserves all original issue fields', () => {
    const issue: Issue = { title: 'T', body: 'B', assignee: 'octocat', labels: ['bug'] };
    const result = buildGitHubCommand(issue);
    expect(result.title).toBe(issue.title);
    expect(result.body).toBe(issue.body);
    expect(result.assignee).toBe(issue.assignee);
    expect(result.labels).toEqual(issue.labels);
  });
});
