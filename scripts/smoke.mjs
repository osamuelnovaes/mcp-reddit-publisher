import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/index.js'],
  env: {
    ...process.env,
    REDDIT_DRY_RUN: 'true',
    REDDIT_USER_AGENT: 'mcp-reddit-publisher-test/0.1.0 by u/test'
  }
});

const client = new Client({ name: 'mcp-reddit-publisher-smoke-test', version: '0.1.0' });
await client.connect(transport);
const tools = await client.listTools();
console.log(JSON.stringify({ tools: tools.tools.map((tool) => tool.name).sort() }, null, 2));
const health = await client.callTool({ name: 'health', arguments: {} });
console.log(JSON.stringify(health, null, 2));
await client.close();
