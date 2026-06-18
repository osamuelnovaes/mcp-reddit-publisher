#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadConfig, validatePostCredentialConfig } from './config.js';
import { RedditClient } from './reddit.js';
import {
  RateLimiter,
  assertTextPostInput,
  checkRulesForPromotion,
  normalizeSubreddit
} from './safety.js';

const config = loadConfig();
const reddit = new RedditClient(config);
const rateLimiter = new RateLimiter(config.minSecondsBetweenPosts);

function jsonText(value: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

const server = new McpServer({
  name: 'mcp-reddit-publisher',
  version: '0.1.0'
});

server.registerTool(
  'health',
  {
    title: 'Health check',
    description: 'Shows current configuration status without revealing secrets.',
    inputSchema: {}
  },
  async () => {
    const missing = validatePostCredentialConfig(config);
    return jsonText({
      ok: missing.length === 0,
      dryRun: config.dryRun,
      allowedSubreddits: config.allowedSubreddits,
      requireRuleCheck: config.requireRuleCheck,
      minSecondsBetweenPosts: config.minSecondsBetweenPosts,
      redditUserAgent: config.redditUserAgent,
      missing
    });
  }
);

server.registerTool(
  'get_subreddit_rules',
  {
    title: 'Get subreddit rules',
    description: 'Fetches subreddit rules and flags obvious promotional-posting risks.',
    inputSchema: {
      subreddit: z.string().describe('Subreddit name, with or without r/ prefix.')
    }
  },
  async ({ subreddit }) => {
    const normalized = normalizeSubreddit(subreddit);
    const rules = await reddit.listRules(normalized);
    return jsonText({
      subreddit: `r/${normalized}`,
      rules,
      promotionCheck: checkRulesForPromotion(rules)
    });
  }
);

server.registerTool(
  'search_subreddits',
  {
    title: 'Search subreddits',
    description: 'Searches Reddit communities by query to help find audience fit before posting.',
    inputSchema: {
      query: z.string().min(1),
      limit: z.number().int().min(1).max(50).default(10)
    }
  },
  async ({ query, limit }) => jsonText(await reddit.searchSubreddits(query, limit))
);

server.registerTool(
  'preview_text_post',
  {
    title: 'Preview text post',
    description: 'Validates and previews a Reddit text post without publishing.',
    inputSchema: {
      subreddit: z.string(),
      title: z.string(),
      body: z.string(),
      sendReplies: z.boolean().optional().default(true),
      nsfw: z.boolean().optional().default(false),
      spoiler: z.boolean().optional().default(false),
      flairId: z.string().optional()
    }
  },
  async (input) => {
    const subreddit = normalizeSubreddit(input.subreddit);
    assertTextPostInput({
      subreddit,
      title: input.title,
      body: input.body,
      maxTitleLength: config.maxTitleLength,
      allowedSubreddits: config.allowedSubreddits
    });

    let ruleCheck = undefined;
    if (config.requireRuleCheck) {
      const rules = await reddit.listRules(subreddit);
      ruleCheck = checkRulesForPromotion(rules);
    }

    return jsonText({
      dryRun: true,
      subreddit: `r/${subreddit}`,
      title: input.title,
      body: input.body,
      options: {
        sendReplies: input.sendReplies,
        nsfw: input.nsfw,
        spoiler: input.spoiler,
        flairId: input.flairId
      },
      ruleCheck
    });
  }
);

server.registerTool(
  'submit_text_post',
  {
    title: 'Submit text post',
    description:
      'Publishes a Reddit text post. By default REDDIT_DRY_RUN=true prevents real publishing; set false only after testing.',
    inputSchema: {
      subreddit: z.string(),
      title: z.string(),
      body: z.string(),
      sendReplies: z.boolean().optional().default(true),
      nsfw: z.boolean().optional().default(false),
      spoiler: z.boolean().optional().default(false),
      flairId: z.string().optional(),
      overrideRuleCheck: z
        .boolean()
        .optional()
        .default(false)
        .describe('If true, allows posting even when the automatic rule check flags promotional risks.')
    }
  },
  async (input) => {
    const subreddit = normalizeSubreddit(input.subreddit);
    assertTextPostInput({
      subreddit,
      title: input.title,
      body: input.body,
      maxTitleLength: config.maxTitleLength,
      allowedSubreddits: config.allowedSubreddits
    });

    const missing = validatePostCredentialConfig(config);
    if (missing.length > 0) {
      throw new Error(`Credenciais ausentes: ${missing.join(', ')}`);
    }

    let ruleCheck = undefined;
    if (config.requireRuleCheck) {
      const rules = await reddit.listRules(subreddit);
      ruleCheck = checkRulesForPromotion(rules);
      if (!ruleCheck.allowed && !input.overrideRuleCheck) {
        throw new Error(
          `Publicação bloqueada pela checagem de regras: ${ruleCheck.reason}. Use overrideRuleCheck=true apenas se você verificou manualmente.`
        );
      }
    }

    if (config.dryRun) {
      return jsonText({
        dryRun: true,
        message: 'REDDIT_DRY_RUN=true, então nada foi publicado.',
        subreddit: `r/${subreddit}`,
        title: input.title,
        body: input.body,
        ruleCheck
      });
    }

    rateLimiter.assertCanPost();
    const result = await reddit.submitTextPost({
      subreddit,
      title: input.title,
      body: input.body,
      sendReplies: input.sendReplies,
      nsfw: input.nsfw,
      spoiler: input.spoiler,
      flairId: input.flairId
    });
    rateLimiter.markPosted();

    return jsonText({ dryRun: false, subreddit: `r/${subreddit}`, result, ruleCheck });
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
