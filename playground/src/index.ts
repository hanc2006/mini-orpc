import { UWSServer } from '@mini-orpc/server/uws';
import { router } from './router/index';

const server = new UWSServer(router);

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

server.listen({
  context: {},
  prefix: '/rpc',
  port,
  cors: {
    origin: 'http://localhost:3000',
    methods: 'GET, POST, PUT, DELETE, OPTIONS',
    headers: 'Content-Type, Authorization'
  }
}).then(() => {
  console.log(`🚀 API Server running at http://localhost:${port}`);
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await server.close();
  process.exit(0);
});
