import 'dotenv/config';

export type AppConfig = {
  redditClientId: string;
  redditClientSecret: string;
  redditUsername?: string;
  redditPassword?: string;
  redditRefreshToken?: string;
  redditUserAgent: string;
  dryRun: boolean;
  allowedSubreddits: string[];
  requireRuleCheck: boolean;
  minSecondsBetweenPosts: number;
  maxTitleLength: number;
};

function boolEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'y', 'on'].includes(value.toLowerCase());
}

function intEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function listEnv(name: string): string[] {
  return (process.env[name] ?? '')
    .split(',')
    .map((item) => item.trim().replace(/^r\//i, '').toLowerCase())
    .filter(Boolean);
}

export function loadConfig(): AppConfig {
  return {
    redditClientId: process.env.REDDIT_CLIENT_ID ?? '',
    redditClientSecret: process.env.REDDIT_CLIENT_SECRET ?? '',
    redditUsername: process.env.REDDIT_USERNAME,
    redditPassword: process.env.REDDIT_PASSWORD,
    redditRefreshToken: process.env.REDDIT_REFRESH_TOKEN,
    redditUserAgent:
      process.env.REDDIT_USER_AGENT ?? 'mcp-reddit-publisher/0.1.0 by u/unknown',
    dryRun: boolEnv('REDDIT_DRY_RUN', true),
    allowedSubreddits: listEnv('REDDIT_ALLOWED_SUBREDDITS'),
    requireRuleCheck: boolEnv('REDDIT_REQUIRE_RULE_CHECK', true),
    minSecondsBetweenPosts: Math.max(0, intEnv('REDDIT_MIN_SECONDS_BETWEEN_POSTS', 300)),
    maxTitleLength: Math.max(1, intEnv('REDDIT_MAX_TITLE_LENGTH', 300))
  };
}

export function validatePostCredentialConfig(config: AppConfig): string[] {
  const missing: string[] = [];
  if (!config.redditClientId) missing.push('REDDIT_CLIENT_ID');
  if (!config.redditClientSecret) missing.push('REDDIT_CLIENT_SECRET');

  const hasRefresh = Boolean(config.redditRefreshToken);
  const hasPasswordFlow = Boolean(config.redditUsername && config.redditPassword);
  if (!hasRefresh && !hasPasswordFlow) {
    missing.push('REDDIT_REFRESH_TOKEN or REDDIT_USERNAME + REDDIT_PASSWORD');
  }
  return missing;
}
