import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

export type SetupOptions = {
  target: 'claude' | 'codex' | 'opencode' | 'json';
  packageSpec: string;
  env: Record<string, string>;
};

export type InstallTarget = 'claude-code' | 'claude-desktop';

const DEFAULT_PACKAGE_SPEC = 'github:osamuelnovaes/mcp-reddit-publisher';
const SERVER_NAME = 'reddit-publisher';

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

export function serverConfig(packageSpec: string, env: Record<string, string>) {
  return {
    command: 'npx',
    args: ['-y', packageSpec],
    env
  };
}

export function renderSetup(options: SetupOptions): string {
  const config = serverConfig(options.packageSpec, options.env);
  const { command, args, env } = config;

  if (options.target === 'claude') {
    return [
      'Claude Desktop / Claude Code config:',
      '',
      JSON.stringify(
        {
          mcpServers: {
            [SERVER_NAME]: config
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
      `[mcp_servers.${SERVER_NAME}]`,
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
            [SERVER_NAME]: {
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

  return JSON.stringify(config, null, 2);
}

function claudeDesktopConfigPath(): string {
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  }
  if (process.platform === 'win32') {
    return join(process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json');
  }
  return join(homedir(), '.config', 'Claude', 'claude_desktop_config.json');
}

export function installClaudeDesktop(packageSpec: string, env: Record<string, string>): string {
  const path = claudeDesktopConfigPath();
  let config: { mcpServers?: Record<string, unknown>; [key: string]: unknown } = {};
  if (existsSync(path)) {
    const raw = readFileSync(path, 'utf8').trim();
    if (raw) config = JSON.parse(raw);
  }
  config.mcpServers = {
    ...(config.mcpServers ?? {}),
    [SERVER_NAME]: serverConfig(packageSpec, env)
  };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`);
  return `Instalado no Claude Desktop: ${path}\nReinicie o Claude Desktop para carregar o MCP.`;
}

export function installClaudeCode(packageSpec: string, env: Record<string, string>, scope = 'user'): string {
  const config = JSON.stringify(serverConfig(packageSpec, env));
  const result = spawnSync('claude', ['mcp', 'add-json', SERVER_NAME, config, '--scope', scope], {
    encoding: 'utf8'
  });
  if (result.error) {
    throw new Error(`Não consegui executar 'claude'. Instale o Claude Code ou use: setup claude\n${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Claude Code retornou erro:\n${result.stderr || result.stdout}`);
  }
  return `${result.stdout.trim()}\nInstalado no Claude Code. Reinicie o Claude Code se ele já estava aberto.`.trim();
}

export function renderHelp(): string {
  return `mcp-reddit-publisher

Instalação mais simples:
  npx -y ${DEFAULT_PACKAGE_SPEC} install claude-code --client-id ID --client-secret SECRET --refresh-token TOKEN --user-agent "mcp-reddit-publisher/0.1.0 by u/USER"

Claude Desktop:
  npx -y ${DEFAULT_PACKAGE_SPEC} install claude-desktop --client-id ID --client-secret SECRET --refresh-token TOKEN --user-agent "mcp-reddit-publisher/0.1.0 by u/USER"

Testar se o pacote roda:
  npx -y ${DEFAULT_PACKAGE_SPEC} --help

Gerar configuração para copiar/colar:
  npx -y ${DEFAULT_PACKAGE_SPEC} setup claude --client-id ID --client-secret SECRET --refresh-token TOKEN --user-agent "mcp-reddit-publisher/0.1.0 by u/USER"
  npx -y ${DEFAULT_PACKAGE_SPEC} setup codex --client-id ID --client-secret SECRET --refresh-token TOKEN
  npx -y ${DEFAULT_PACKAGE_SPEC} setup opencode --client-id ID --client-secret SECRET --refresh-token TOKEN

Comandos:
  install <claude-code|claude-desktop> Instala automaticamente quando possível
  setup <claude|codex|opencode|json>   Gera snippet de configuração MCP
  doctor                               Mostra status da configuração atual
  serve                                Inicia o servidor MCP por stdio (padrão)

Flags úteis:
  --client-id VALUE
  --client-secret VALUE
  --refresh-token VALUE
  --user-agent VALUE
  --allowed subreddit1,subreddit2
  --dry-run true|false                 Padrão: true
  --require-rule-check true|false      Padrão: true
  --min-seconds-between-posts 300      Padrão: 300
`;
}

export const DEFAULT_NPX_PACKAGE_SPEC = DEFAULT_PACKAGE_SPEC;
