import { describe, expect, it } from 'vitest';
import { buildEnvFromFlags, parseCliArgs, renderSetup } from '../src/cli.js';

describe('cli helpers', () => {
  it('parses setup args', () => {
    const parsed = parseCliArgs([
      'setup',
      'claude',
      '--client-id',
      'id',
      '--client-secret=secret',
      '--allowed',
      'SideProject,saas'
    ]);
    expect(parsed.command).toBe('setup');
    expect(parsed.target).toBe('claude');
    expect(parsed.flags['client-id']).toBe('id');
    expect(parsed.flags['client-secret']).toBe('secret');
    expect(parsed.flags.allowed).toBe('SideProject,saas');
  });

  it('builds env defaults', () => {
    const env = buildEnvFromFlags({ 'client-id': 'id', 'client-secret': 'secret' });
    expect(env.REDDIT_CLIENT_ID).toBe('id');
    expect(env.REDDIT_CLIENT_SECRET).toBe('secret');
    expect(env.REDDIT_DRY_RUN).toBe('true');
  });

  it('renders claude config using npx github package', () => {
    const rendered = renderSetup({
      target: 'claude',
      packageSpec: 'github:uptrixbr/mcp-reddit-publisher',
      env: { REDDIT_CLIENT_ID: 'id' }
    });
    expect(rendered).toContain('mcpServers');
    expect(rendered).toContain('npx');
    expect(rendered).toContain('github:uptrixbr/mcp-reddit-publisher');
  });
});
