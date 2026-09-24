import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

/**
 * Creates an authenticated MCP client connected to a Swiggy MCP server
 * using StreamableHTTP transport (plain HTTP POST, no SSE stream).
 *
 * StreamableHTTP is simpler and more reliable than SSE — no EventSource
 * polyfill needed, no stream lifecycle issues.
 *
 * @param serverUrl  Full URL of the MCP POST endpoint (e.g. http://localhost:3001/mcp/v1/food)
 * @param userToken  Bearer token for authentication
 */
export async function createAuthenticatedMcpClient(
  serverUrl: string,
  userToken: string
): Promise<Client> {
  const transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
    },
  });

  const client = new Client(
    { name: 'autonom-meal-engine', version: '1.0.0' },
    { capabilities: {} }
  );

  // 10-second connection handshake timeout
  const connectPromise = client.connect(transport);
  const timeoutPromise = new Promise<void>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`MCP Client connection timed out for server: ${serverUrl}`));
    }, 10000);
  });

  try {
    await Promise.race([connectPromise, timeoutPromise]);
  } catch (error) {
    try { await transport.close(); } catch { /* ignore */ }
    throw error;
  }

  return client;
}
