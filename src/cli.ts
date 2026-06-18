export type SetupOptions = {
  target: 'claude' | 'codex' | 'opencode' | 'json';
  packageSpec: string;
  env: Record<string, string>;
};

const DEFAULT_PACKAGE_SPEC = 'mcp-reddit-publisher';

export function parseCliArgs(argv: string[]): { command: string; target?: string; flags: Record<string, string> } {
  const [command = 'serve', maybeTarget, ...rest] = argv;
  const flags: Record<string, string> = {};

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (!arg.startsWith('--')) continue;
    const withoutPrefix = arg.slice(2);
    const [key, inlineValue] = withoutPrefix.split('=', 2);
    if (inlineValue !== undefined) {
      flags[key] = inlineValue;
    } else {
      const next = rest[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i += 1;
      } else {
        flags[key] = 'true';
      }
    }
  }

  return { command, target: maybeTarget, flags };
}

export function buildEnvFromFlags(flags: Record<string, string>): Record<string, string> {
  const env: Record<string, string> = {
    REDDIT_CLIENT_ID: flags['client-id'] ?? '<REDDIT_CLIENT_ID>',
    REDDIT_CLIENT_SECRET: flags['client-secret'] ?? '<REDDIT_CLIENT_SECRET>',
    REDDIT_REFRESH_TOKEN: flags['refresh-token'] ?? '<REDDIT_REFRESH_TOKEN>',
    REDDIT_USER_AGENT:
      flags['user-agent'] ?? 'mcp-reddit-publisher/0.1.0 by u/<REDDIT_USERNAME>',
    REDDIT_DRY_RUN: flags['dry-run'] ?? 'true',
    REDDIT_REQUIRE_RULE_CHECK: flags['require-rule-check'] ?? 'true',
    REDDIT_MIN_SECONDS_BETWEEN_POSTS: flags['min-seconds-between-posts'] ?? '300'
  };

  if (flags.username) env.REDDIT_USERNAME = flags.username;
  if (flags.password) env.REDDIT_PASSWORD = flags.password;
  if (flags.allowed) env.REDDIT_ALLOWED_SUBREDDITS = flags.allowed;
  return env;
}

export function renderSetup(options: SetupOptions): string {
  const command = 'npx';
  const args = ['-y', options.packageSpec];
  const env = options.env;

  if (options.target === 'claude') {
    return [
      'Claude Desktop / Claude Code config:',
      '',
      JSON.stringify(
        {
          mcpServers: {
            'reddit-publisher': { command, args, env }
          }
        },
        null,
        2
      ),
      '',
      'Cole esse bloco no arquivo de configuração MCP do Claude e reinicie o app.'
    ].join('\n');
  }

  if (options.target === 'codex') {
    return [
      'Codex config.toml:',
      '',
      '[mcp_servers.reddit-publisher]',
      `command = "${command}"`,
      `args = ${JSON.stringify(args)}`,
      ...Object.entries(env).map(([key, value]) => `env.${key} = ${JSON.stringify(value)}`),
      '',
      'Adicione esse bloco ao config.toml do Codex e reinicie o Codex.'
    ].join('\n');
  }

  if (options.target === 'opencode') {
    return [
      'OpenCode MCP config:',
      '',
      JSON.stringify(
        {
          mcp: {
            'reddit-publisher': {
              type: 'local',
              command: [command, ...args].join(' '),
              enabled: true,
              environment: env
            }
          }
        },
        null,
        2
      ),
      '',
      'Adicione esse bloco ao arquivo de configuração do OpenCode e reinicie o OpenCode.'
    ].join('\n');
  }

  return JSON.stringify({ command, args, env }, null, 2);
}

export function renderHelp(): string {
  return `mcp-reddit-publisher

Uso como servidor MCP:
  npx -y ${DEFAULT_PACKAGE_SPEC}

Gerar configuração pronta:
  npx -y ${DEFAULT_PACKAGE_SPEC} setup claude --client-id ID --client-secret SECRET --refresh-token TOKEN --user-agent "mcp-reddit-publisher/0.1.0 by u/USER"
  npx -y ${DEFAULT_PACKAGE_SPEC} setup codex --client-id ID --client-secret SECRET --refresh-token TOKEN
  npx -y ${DEFAULT_PACKAGE_SPEC} setup opencode --client-id ID --client-secret SECRET --refresh-token TOKEN

Comandos:
  setup <claude|codex|opencode|json>  Gera snippet de configuração MCP
  doctor                              Mostra status da configuração atual
  serve                               Inicia o servidor MCP por stdio (padrão)

Flags úteis do setup:
  --client-id VALUE
  --client-secret VALUE
  --refresh-token VALUE
  --user-agent VALUE
  --allowed subreddit1,subreddit2
  --dry-run true|false
  --require-rule-check true|false
  --min-seconds-between-posts 300
`;
}

export const DEFAULT_NPX_PACKAGE_SPEC = DEFAULT_PACKAGE_SPEC;
