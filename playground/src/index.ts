import { createServer, type IncomingMessage } from 'node:http';
import { RPCHandler } from '@mini-orpc/server/fetch';
import { router } from './router/index';

const handler = new RPCHandler(router);

// Helper to read request body
function getRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);

  // Add CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (url.pathname.startsWith('/rpc/')) {
    // Handle RPC requests
    const body =
      req.method !== 'GET' && req.method !== 'HEAD'
        ? await getRequestBody(req)
        : undefined;

    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: req.headers as any,
      body,
    });

    const { response } = await handler.handle(request, {
      context: {},
      prefix: '/rpc',
    });

    if (response) {
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      res.writeHead(response.status, headers);
      const responseBody = await response.text();
      res.end(responseBody);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`🚀 API Server running at http://localhost:${port}`);
});
