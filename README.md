# mcp-reddit-publisher

MCP para Claude/Codex/OpenCode publicar no Reddit com segurança.

- Repo: https://github.com/osamuelnovaes/mcp-reddit-publisher
- npm: `mcp-reddit-publisher` (ainda não publicado; por enquanto use `github:osamuelnovaes/mcp-reddit-publisher`)
- Por padrão é seguro: `REDDIT_DRY_RUN=true`, então nada é publicado de verdade até você trocar para `false`.

## Instalação rápida

Você não precisa clonar o projeto, instalar dependências nem rodar build.

### Claude Code

Rode uma vez:

```bash
npx -y github:osamuelnovaes/mcp-reddit-publisher install claude-code \
  --client-id "SEU_REDDIT_CLIENT_ID" \
  --client-secret "SEU_REDDIT_CLIENT_SECRET" \
  --refresh-token "SEU_REDDIT_REFRESH_TOKEN" \
  --user-agent "mcp-reddit-publisher/0.1.0 by u/SEU_USUARIO" \
  --allowed "SideProject,saas,startups"
```

Depois reinicie o Claude Code e peça:

```text
Use o reddit-publisher para verificar o health e buscar subreddits sobre SaaS.
```

### Claude Desktop

Rode uma vez:

```bash
npx -y github:osamuelnovaes/mcp-reddit-publisher install claude-desktop \
  --client-id "SEU_REDDIT_CLIENT_ID" \
  --client-secret "SEU_REDDIT_CLIENT_SECRET" \
  --refresh-token "SEU_REDDIT_REFRESH_TOKEN" \
  --user-agent "mcp-reddit-publisher/0.1.0 by u/SEU_USUARIO" \
  --allowed "SideProject,saas,startups"
```

Depois reinicie o Claude Desktop.

### Só testar se o pacote roda

```bash
npx -y github:osamuelnovaes/mcp-reddit-publisher --help
```

Se apareceu a ajuda, o pacote baixou e executou corretamente.

## O que o comando `install` faz

- `install claude-code`: chama o CLI oficial do Claude Code e adiciona o MCP automaticamente.
- `install claude-desktop`: edita/cria o arquivo `claude_desktop_config.json` automaticamente.
- Não publica nada no Reddit durante a instalação.
- Mantém `REDDIT_DRY_RUN=true` por padrão.

## Credenciais Reddit

Crie um app no Reddit uma vez:

1. Acesse https://www.reddit.com/prefs/apps
2. Clique em `create another app`.
3. Escolha o tipo `script` para uso pessoal/local.
4. Copie:
   - `client_id`
   - `client_secret`
5. Configure um user agent, por exemplo:

```text
mcp-reddit-publisher/0.1.0 by u/seu_usuario
```

A forma recomendada é usar:

```text
REDDIT_REFRESH_TOKEN
```

Alternativa para app `script`:

```text
--username "SEU_USUARIO" --password "SUA_SENHA"
```

## Codex, OpenCode ou outros clientes MCP

Se o cliente não tem instalador automático ainda, gere o bloco pronto:

```bash
npx -y github:osamuelnovaes/mcp-reddit-publisher setup codex \
  --client-id "..." \
  --client-secret "..." \
  --refresh-token "..." \
  --user-agent "mcp-reddit-publisher/0.1.0 by u/SEU_USUARIO"
```

Troque `codex` por:

```bash
setup opencode
setup claude
setup json
```

## Ferramentas MCP disponíveis

- `health`: valida a configuração sem expor secrets.
- `search_subreddits`: busca comunidades por termo.
- `get_subreddit_rules`: lê regras do subreddit e aponta riscos.
- `preview_text_post`: valida e mostra o post sem publicar.
- `submit_text_post`: publica o post respeitando dry-run, allowlist, regras e rate limit.

## Segurança por padrão

Nada é publicado por padrão:

```text
REDDIT_DRY_RUN=true
```

Para publicar de verdade, só depois de testar:

```bash
npx -y github:osamuelnovaes/mcp-reddit-publisher install claude-code \
  --client-id "..." \
  --client-secret "..." \
  --refresh-token "..." \
  --user-agent "mcp-reddit-publisher/0.1.0 by u/SEU_USUARIO" \
  --dry-run false
```

Recomendações:

```text
REDDIT_ALLOWED_SUBREDDITS=SideProject,saas,startups
REDDIT_REQUIRE_RULE_CHECK=true
REDDIT_MIN_SECONDS_BETWEEN_POSTS=300
```

## Desenvolvimento local

```bash
git clone https://github.com/osamuelnovaes/mcp-reddit-publisher.git
cd mcp-reddit-publisher
npm install
npm run typecheck
npm test
npm run build
node scripts/smoke.mjs
```

## Licença

MIT
