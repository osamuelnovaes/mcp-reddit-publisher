export type RuleCheck = {
  allowed: boolean;
  reason: string;
  matchedRules: string[];
};

const BLOCK_PATTERNS = [
  /no\s+(self[-\s]?)?promo/i,
  /no\s+promotional/i,
  /no\s+advertis/i,
  /no\s+solicit/i,
  /no\s+spam/i,
  /vendor\s+spam/i,
  /weekly\s+thread/i,
  /megathread/i
];

export function normalizeSubreddit(subreddit: string): string {
  return subreddit.trim().replace(/^r\//i, '').toLowerCase();
}

export function checkRulesForPromotion(rules: Array<{ short_name?: string; description?: string }>): RuleCheck {
  const matchedRules: string[] = [];

  for (const rule of rules) {
    const text = `${rule.short_name ?? ''}\n${rule.description ?? ''}`.trim();
    if (!text) continue;
    if (BLOCK_PATTERNS.some((pattern) => pattern.test(text))) {
      matchedRules.push(text);
    }
  }

  if (matchedRules.length > 0) {
    return {
      allowed: false,
      reason: 'As regras do subreddit parecem restringir autopromoção, propaganda, spam, solicitação ou exigir thread fixa.',
      matchedRules
    };
  }

  return {
    allowed: true,
    reason: 'Nenhuma regra bloqueante óbvia foi encontrada automaticamente. Ainda assim, revise manualmente antes de publicar em comunidades sensíveis.',
    matchedRules: []
  };
}

export function assertTextPostInput(input: {
  subreddit: string;
  title: string;
  body: string;
  maxTitleLength: number;
  allowedSubreddits: string[];
}): void {
  const subreddit = normalizeSubreddit(input.subreddit);
  if (!subreddit) throw new Error('subreddit é obrigatório.');
  if (!input.title.trim()) throw new Error('title é obrigatório.');
  if (!input.body.trim()) throw new Error('body é obrigatório.');
  if (input.title.length > input.maxTitleLength) {
    throw new Error(`title excede ${input.maxTitleLength} caracteres.`);
  }
  if (input.allowedSubreddits.length > 0 && !input.allowedSubreddits.includes(subreddit)) {
    throw new Error(
      `Subreddit r/${subreddit} não está em REDDIT_ALLOWED_SUBREDDITS: ${input.allowedSubreddits.join(', ')}`
    );
  }
}

export class RateLimiter {
  private lastPostAt = 0;

  constructor(private readonly minSecondsBetweenPosts: number) {}

  assertCanPost(now = Date.now()): void {
    if (this.minSecondsBetweenPosts <= 0 || this.lastPostAt === 0) return;
    const elapsedSeconds = Math.floor((now - this.lastPostAt) / 1000);
    if (elapsedSeconds < this.minSecondsBetweenPosts) {
      throw new Error(
        `Rate limit de segurança: aguarde mais ${this.minSecondsBetweenPosts - elapsedSeconds}s antes de outro post.`
      );
    }
  }

  markPosted(now = Date.now()): void {
    this.lastPostAt = now;
  }
}
