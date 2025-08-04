import uWS from 'uWebSockets.js';
import type { Router } from '../router';
import type { Context } from '../types';
import { createUWSHandler } from './handler';

export interface UWSServerOptions<T extends Context> {
  prefix?: `/${string}`;
  context: T;
  port?: number;
  host?: string;
  cors?: {
    origin?: string;
    methods?: string;
    headers?: string;
  };
}

export class UWSServer<T extends Context> {
  private readonly router: Router<T>;
  private app: uWS.TemplatedApp | null = null;
  private listenSocket: uWS.us_listen_socket | null = null;

  constructor(router: Router<T>) {
    this.router = router;
  }

  private setupCORS(res: uWS.HttpResponse, options: UWSServerOptions<T>) {
    const cors = options.cors || {
      origin: '*',
      methods: 'GET, POST, PUT, DELETE, OPTIONS',
      headers: 'Content-Type, Authorization'
    };
    
    res.writeHeader('Access-Control-Allow-Origin', cors.origin || '*');
    res.writeHeader('Access-Control-Allow-Methods', cors.methods || 'GET, POST, PUT, DELETE, OPTIONS');
    res.writeHeader('Access-Control-Allow-Headers', cors.headers || 'Content-Type, Authorization');
  }

  listen(options: UWSServerOptions<T>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.app) {
        reject(new Error('Server is already running'));
        return;
      }

      this.app = uWS.App();
      const prefix = options.prefix || '/rpc';
      const handler = createUWSHandler(this.router, options);

      this.app.any(`${prefix}/*`, (res, req) => {
        this.setupCORS(res, options);

        if (req.getMethod() === 'options') {
          res.end();
          return;
        }

        handler(res, req);
      });

      this.app.get('/*', (res, req) => {
        this.setupCORS(res, options);
        res.writeStatus('404').end('Not Found');
      });

      const port = options.port || 3001;
      const host = options.host || '0.0.0.0';

      this.app.listen(host, port, (token) => {
        if (token) {
          this.listenSocket = token;
          console.log(`🚀 UWS API Server running at http://${host}:${port}`);
          resolve();
        } else {
          reject(new Error(`Failed to listen on ${host}:${port}`));
        }
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.listenSocket) {
        uWS.us_listen_socket_close(this.listenSocket);
        this.listenSocket = null;
      }
      this.app = null;
      resolve();
    });
  }
}
