import type { AppConfig } from './config.js';

export type RedditRule = {
  short_name?: string;
  description?: string;
  kind?: string;
};

export type RedditPostResult = {
  id?: string;
  name?: string;
  url?: string;
  permalink?: string;
  raw: unknown;
};

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

export class RedditClient {
  private token?: { value: string; expiresAt: number };

  constructor(private readonly config: AppConfig) {}

  async listRules(subreddit: string): Promise<RedditRule[]> {
    const data = await this.requestJson<{ rules?: RedditRule[] }>(
      `https://oauth.reddit.com/r/${encodeURIComponent(subreddit)}/about/rules`,
      { method: 'GET' }
    );
    return data.rules ?? [];
  }

  async getSubredditAbout(subreddit: string): Promise<unknown> {
    return this.requestJson(`https://oauth.reddit.com/r/${encodeURIComponent(subreddit)}/about`, {
      method: 'GET'
    });
  }

  async searchSubreddits(query: string, limit = 10): Promise<unknown> {
    const url = new URL('https://oauth.reddit.com/subreddits/search');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', String(limit));
    return this.requestJson(url.toString(), { method: 'GET' });
  }

  async submitTextPost(input: {
    subreddit: string;
    title: string;
    body: string;
    sendReplies?: boolean;
    nsfw?: boolean;
    spoiler?: boolean;
    flairId?: string;
  }): Promise<RedditPostResult> {
    const form = new URLSearchParams();
    form.set('api_type', 'json');
    form.set('kind', 'self');
    form.set('sr', input.subreddit);
    form.set('title', input.title);
    form.set('text', input.body);
    form.set('sendreplies', input.sendReplies === false ? 'false' : 'true');
    if (input.nsfw) form.set('nsfw', 'true');
    if (input.spoiler) form.set('spoiler', 'true');
    if (input.flairId) form.set('flair_id', input.flairId);

    const data = await this.requestJson<{
      json?: {
        errors?: unknown[];
        data?: { id?: string; name?: string; url?: string };
      };
    }>('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    });

    const errors = data.json?.errors ?? [];
    if (Array.isArray(errors) && errors.length > 0) {
      throw new Error(`Reddit retornou erro ao publicar: ${JSON.stringify(errors)}`);
    }

    const post = data.json?.data ?? {};
    const permalink = post.url?.startsWith('/r/') ? `https://www.reddit.com${post.url}` : post.url;
    return { ...post, permalink, raw: data };
  }

  private async requestJson<T = unknown>(url: string, init: RequestInit): Promise<T> {
    const accessToken = await this.getAccessToken();
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': this.config.redditUserAgent,
        Accept: 'application/json',
        ...(init.headers ?? {})
      }
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { text };
    }

    if (!response.ok) {
      throw new Error(`Reddit API ${response.status}: ${JSON.stringify(data)}`);
    }

    return data as T;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.token && this.token.expiresAt > now + 30_000) {
      return this.token.value;
    }

    const auth = Buffer.from(
      `${this.config.redditClientId}:${this.config.redditClientSecret}`
    ).toString('base64');

    const form = new URLSearchParams();
    if (this.config.redditRefreshToken) {
      form.set('grant_type', 'refresh_token');
      form.set('refresh_token', this.config.redditRefreshToken);
    } else if (this.config.redditUsername && this.config.redditPassword) {
      form.set('grant_type', 'password');
      form.set('username', this.config.redditUsername);
      form.set('password', this.config.redditPassword);
    } else {
      throw new Error('Configure REDDIT_REFRESH_TOKEN ou REDDIT_USERNAME + REDDIT_PASSWORD.');
    }

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': this.config.redditUserAgent,
        Accept: 'application/json'
      },
      body: form.toString()
    });

    const data = (await response.json()) as TokenResponse & { error?: string };
    if (!response.ok || data.error || !data.access_token) {
      throw new Error(`Falha ao obter token Reddit: ${JSON.stringify(data)}`);
    }

    this.token = {
      value: data.access_token,
      expiresAt: now + data.expires_in * 1000
    };
    return data.access_token;
  }
}
