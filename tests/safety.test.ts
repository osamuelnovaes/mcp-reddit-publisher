import { describe, expect, it } from 'vitest';
import { RateLimiter, assertTextPostInput, checkRulesForPromotion, normalizeSubreddit } from '../src/safety.js';

describe('safety helpers', () => {
  it('normalizes subreddit names', () => {
    expect(normalizeSubreddit('r/SaaS')).toBe('saas');
    expect(normalizeSubreddit('  startups  ')).toBe('startups');
  });

  it('blocks obvious promotional rule risks', () => {
    const check = checkRulesForPromotion([
      { short_name: 'No vendor spam', description: 'No promotional SaaS posts.' }
    ]);
    expect(check.allowed).toBe(false);
    expect(check.matchedRules.length).toBe(1);
  });

  it('allows clean rules', () => {
    const check = checkRulesForPromotion([{ short_name: 'Be kind', description: 'Keep it civil.' }]);
    expect(check.allowed).toBe(true);
  });

  it('enforces allowlist', () => {
    expect(() =>
      assertTextPostInput({
        subreddit: 'marketing',
        title: 'Hello',
        body: 'World',
        maxTitleLength: 300,
        allowedSubreddits: ['saas']
      })
    ).toThrow(/não está/);
  });

  it('rate limits repeated posts', () => {
    const limiter = new RateLimiter(60);
    limiter.markPosted(1_000);
    expect(() => limiter.assertCanPost(10_000)).toThrow(/Rate limit/);
    expect(() => limiter.assertCanPost(62_000)).not.toThrow();
  });
});
