import { UWSServer } from '@mini-orpc/server/uws';
import { router } from './router/index';

const server = new UWSServer({
  context: {},
  prefix: '/rpc',
  port: 3001,
  cors: {
    origin: 'http://localhost:3000',
    methods: 'GET, POST, PUT, DELETE, OPTIONS',
    headers: 'Content-Type, Authorization',
  }
});

server
  .register(router)
  .listen();
