import { RPCHandler } from '@mini-orpc/server/fetch';
import { serve } from 'bun';
import index from './index.html';
import { router } from './router';

const handler = new RPCHandler(router);

const server = serve({
  routes: {
    '/*': index,
    '/rpc/*': async (req) => {
      const { response } = await handler.handle(req, {
        context: {},
        prefix: '/rpc',
      });

      return response ?? new Response('Not Found', { status: 404 });
    },
  },

  development: process.env.NODE_ENV !== 'production' && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
