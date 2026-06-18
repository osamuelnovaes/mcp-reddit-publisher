# mcp-reddit-publisher

Servidor MCP para publicar no Reddit com segurança, feito para ser instalado do jeito mais simples possível em Claude, Codex, OpenCode e qualquer cliente MCP via stdio.

Repo: https://github.com/osamuelnovaes/mcp-reddit-publisher
Pacote npm: mcp-reddit-publisher

## Instalação rápida

Você NÃO precisa clonar o projeto nem rodar build manual.

Use direto via npm/npx:

```bash
npx -y mcp-reddit-publisher --help
```

Para gerar uma configuração pronta para o seu cliente:

```bash
npx -y mcp-reddit-publisher setup claude \
  --client-id "SEU_REDDIT_CLIENT_ID" \
  --client-secret "SEU_REDDIT_CLIENT_SECRET" \
  --refresh-token "SEU_REDDIT_REFRESH_TOKEN" \
  --user-agent "mcp-reddit-publisher/0.1.0 by u/SEU_USUARIO" \
  --allowed "SideProject,saas,startups" \
  --dry-run true
```

Troque `claude` por `codex` ou `opencode`:

```bash
npx -y mcp-reddit-publisher setup codex ...
npx -y mcp-reddit-publisher setup opencode ...
```

O comando imprime o bloco de configuração MCP já pronto para copiar e colar.

Fallback sem npm registry, direto do GitHub:

```bash
npx -y github:osamuelnovaes/mcp-reddit-publisher --help
```

## Credenciais Reddit

Você precisa criar um app Reddit uma vez:

1. Acesse https://www.reddit.com/prefs/apps
2. Clique em `create another app`.
3. Escolha o tipo `script` para uso pessoal/local.
4. Copie:
   - `client_id`
   - `client_secret`
5. Configure um user agent descritivo, exemplo:

```text
mcp-reddit-publisher/0.1.0 by u/seu_usuario
```

Autenticação recomendada:

```text
REDDIT_REFRESH_TOKEN
```

Alternativa para app do tipo script:

```text
REDDIT_USERNAME + REDDIT_PASSWORD
```

## Claude Desktop / Claude Code

Gere o config:

```bash
npx -y mcp-reddit-publisher setup claude \
  --client-id "..." \
  --client-secret "..." \
  --refresh-token "..." \
  --user-agent "mcp-reddit-publisher/0.1.0 by u/SEU_USUARIO" \
  --allowed "SideProject,saas" \
  --dry-run true
```

Saída esperada:

```json
{
  "mcpServers": {
    "reddit-publisher": {
      "command": "npx",
      "args": ["-y", "mcp-reddit-publisher"],
      "env": {
        "REDDIT_CLIENT_ID": "...",
        "REDDIT_CLIENT_SECRET": "...",
        "REDDIT_REFRESH_TOKEN": "...",
        "REDDIT_USER_AGENT": "mcp-reddit-publisher/0.1.0 by u/SEU_USUARIO",
        "REDDIT_DRY_RUN": "true"
      }
    }
  }
}
```

Cole no arquivo de configuração MCP do Claude e reinicie o Claude.

## Codex

Gere o config:

```bash
npx -y mcp-reddit-publisher setup codex \
  --client-id "..." \
  --client-secret "..." \
  --refresh-token "..." \
  --user-agent "mcp-reddit-publisher/0.1.0 by u/SEU_USUARIO" \
  --dry-run true
```

Saída esperada em TOML:

```toml
[mcp_servers.reddit-publisher]
command = "npx"
args = ["-y", "mcp-reddit-publisher"]
env.REDDIT_CLIENT_ID = "..."
env.REDDIT_CLIENT_SECRET = "..."
env.REDDIT_REFRESH_TOKEN = "..."
env.REDDIT_USER_AGENT = "mcp-reddit-publisher/0.1.0 by u/SEU_USUARIO"
env.REDDIT_DRY_RUN = "true"
```

Adicione ao `config.toml` do Codex e reinicie o Codex.

## OpenCode

Gere o config:

```bash
npx -y mcp-reddit-publisher setup opencode \
  --client-id "..." \
  --client-secret "..." \
  --refresh-token "..." \
  --user-agent "mcp-reddit-publisher/0.1.0 by u/SEU_USUARIO" \
  --dry-run true
```

Saída esperada:

```json
{
  "mcp": {
    "reddit-publisher": {
      "type": "local",
      "command": "npx -y mcp-reddit-publisher",
      "enabled": true,
      "environment": {
        "REDDIT_CLIENT_ID": "...",
        "REDDIT_CLIENT_SECRET": "...",
        "REDDIT_REFRESH_TOKEN": "...",
        "REDDIT_USER_AGENT": "mcp-reddit-publisher/0.1.0 by u/SEU_USUARIO",
        "REDDIT_DRY_RUN": "true"
      }
    }
  }
}
```

Adicione ao arquivo de configuração do OpenCode e reinicie o OpenCode.

## OpenAI Agents / outros clientes MCP

Use o servidor stdio:

```json
{
  "command": "npx",
  "args": ["-y", "mcp-reddit-publisher"],
  "env": {
    "REDDIT_CLIENT_ID": "...",
    "REDDIT_CLIENT_SECRET": "...",
    "REDDIT_REFRESH_TOKEN": "...",
    "REDDIT_USER_AGENT": "mcp-reddit-publisher/0.1.0 by u/SEU_USUARIO",
    "REDDIT_DRY_RUN": "true"
  }
}
```

## Ferramentas MCP disponíveis

- `health`: valida a configuração sem expor secrets.
- `search_subreddits`: busca comunidades por termo.
- `get_subreddit_rules`: lê regras do subreddit e aponta riscos.
- `preview_text_post`: valida e mostra o post sem publicar.
- `submit_text_post`: publica o post, respeitando dry-run, allowlist, checagem de regras e rate limit.

## Segurança por padrão

Por padrão, nada é publicado:

```text
REDDIT_DRY_RUN=true
```

Recomendações:

```text
REDDIT_ALLOWED_SUBREDDITS=SideProject,saas,startups
REDDIT_REQUIRE_RULE_CHECK=true
REDDIT_MIN_SECONDS_BETWEEN_POSTS=300
```

Só mude para publicação real depois de testar:

```text
REDDIT_DRY_RUN=false
```

## Exemplo de prompt depois de instalar

```text
Use o reddit-publisher para buscar subreddits sobre SaaS, verificar as regras de r/SideProject e preparar um post pedindo feedback. Faça apenas preview, não publique.
```

Depois, se estiver tudo certo e `REDDIT_DRY_RUN=false`:

```text
Publique em r/SideProject somente se as regras permitirem e me retorne o permalink.
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


