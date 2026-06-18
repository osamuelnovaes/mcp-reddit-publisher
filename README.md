# mcp-reddit-publisher

Servidor MCP para automação segura de publicações no Reddit.

Compatível com qualquer cliente MCP via stdio, incluindo Claude Desktop/Claude Code, OpenAI Agents, OpenCode, Cursor, Hermes e outros clientes que aceitam servidores MCP locais.

## O que ele faz

Ferramentas MCP expostas:

- `health`: valida configuração sem expor segredos.
- `search_subreddits`: busca comunidades por termo.
- `get_subreddit_rules`: busca regras do subreddit e aponta riscos de autopromoção.
- `preview_text_post`: valida e mostra o post sem publicar.
- `submit_text_post`: publica um text post, respeitando dry-run, allowlist, checagem de regras e rate limit.

## Salvaguardas

Por padrão, nada é publicado:

- `REDDIT_DRY_RUN=true`: `submit_text_post` só retorna preview.
- `REDDIT_ALLOWED_SUBREDDITS`: quando definido, bloqueia qualquer subreddit fora da lista.
- `REDDIT_REQUIRE_RULE_CHECK=true`: bloqueia posts quando regras parecem proibir promoção/spam/solicitação.
- `REDDIT_MIN_SECONDS_BETWEEN_POSTS=300`: evita várias publicações seguidas.

Use automação com responsabilidade: adapte o texto a cada comunidade, leia as regras e evite spam/cross-posting em massa.

## Instalação local

```bash
git clone https://github.com/uptrixbr/mcp-reddit-publisher.git
cd mcp-reddit-publisher
npm install
npm run build
cp .env.example .env
```

Preencha `.env`:

```bash
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_REFRESH_TOKEN=...
REDDIT_USER_AGENT=mcp-reddit-publisher/0.1.0 by u/SEU_USUARIO
REDDIT_DRY_RUN=true
REDDIT_ALLOWED_SUBREDDITS=saas,startups,SideProject
```

Também é possível usar `REDDIT_USERNAME` + `REDDIT_PASSWORD` no lugar de `REDDIT_REFRESH_TOKEN` para apps Reddit do tipo script.

## Criar app no Reddit

1. Acesse https://www.reddit.com/prefs/apps
2. Clique em "create another app".
3. Escolha tipo "script" para uso pessoal/local.
4. Copie `client_id` e `client_secret`.
5. Defina um user agent descritivo, por exemplo:
   `mcp-reddit-publisher/0.1.0 by u/seu_usuario`

## Rodar manualmente

```bash
npm run build
node dist/index.js
```

O processo fala MCP por stdio, então normalmente será iniciado pelo cliente MCP, não diretamente por você.

## Claude Desktop

Adicione ao `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "reddit-publisher": {
      "command": "node",
      "args": ["/CAMINHO/ABSOLUTO/mcp-reddit-publisher/dist/index.js"],
      "env": {
        "REDDIT_CLIENT_ID": "...",
        "REDDIT_CLIENT_SECRET": "...",
        "REDDIT_REFRESH_TOKEN": "...",
        "REDDIT_USER_AGENT": "mcp-reddit-publisher/0.1.0 by u/SEU_USUARIO",
        "REDDIT_DRY_RUN": "true",
        "REDDIT_ALLOWED_SUBREDDITS": "saas,startups"
      }
    }
  }
}
```

## Claude Code / OpenCode / outros clientes MCP

Use configuração equivalente de servidor stdio:

```json
{
  "reddit-publisher": {
    "command": "node",
    "args": ["/CAMINHO/ABSOLUTO/mcp-reddit-publisher/dist/index.js"],
    "env": {
      "REDDIT_CLIENT_ID": "...",
      "REDDIT_CLIENT_SECRET": "...",
      "REDDIT_REFRESH_TOKEN": "...",
      "REDDIT_USER_AGENT": "mcp-reddit-publisher/0.1.0 by u/SEU_USUARIO",
      "REDDIT_DRY_RUN": "true"
    }
  }
}
```

## OpenAI Agents SDK

Se o seu runtime OpenAI suporta MCP stdio, configure um servidor stdio apontando para:

```bash
node /CAMINHO/ABSOLUTO/mcp-reddit-publisher/dist/index.js
```

Mantenha as mesmas variáveis de ambiente do exemplo acima.

## Exemplo de uso por agente

Peça ao agente:

> Busque subreddits sobre SaaS, leia as regras de r/SideProject, gere uma versão nativa do post pedindo feedback e faça preview. Não publique ainda.

Depois, com `REDDIT_DRY_RUN=false`, você pode pedir:

> Publique em r/SideProject somente se as regras permitirem e me retorne o permalink.

## Desenvolvimento

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Licença

MIT
