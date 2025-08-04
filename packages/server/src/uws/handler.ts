import uWS from 'uWebSockets.js';
import { ORPCError } from '@mini-orpc/client';
import { get, parseEmptyableJSON } from '@orpc/shared';
import { isProcedure } from '../procedure';
import { createProcedureClient } from '../procedure-client';
import type { Router } from '../router';
import type { Context } from '../types';

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

  private readJsonBody(res: uWS.HttpResponse): Promise<any> {
    return new Promise((resolve, reject) => {
      let buffer: Buffer;
      
      res.onData((ab: ArrayBuffer, isLast: boolean) => {
        const chunk = Buffer.from(ab);
        if (isLast) {
          let json;
          if (buffer) {
            try {
              json = JSON.parse(Buffer.concat([buffer, chunk]).toString());
            } catch (e) {
              reject(e);
              return;
            }
            resolve(json);
          } else {
            try {
              json = JSON.parse(chunk.toString());
            } catch (e) {
              reject(e);
              return;
            }
            resolve(json);
          }
        } else {
          if (buffer) {
            buffer = Buffer.concat([buffer, chunk]);
          } else {
            buffer = Buffer.concat([chunk]);
          }
        }
      });

      res.onAborted(() => {
        reject(new Error('Request aborted'));
      });
    });
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

  private async handleRPCRequest(
    res: uWS.HttpResponse, 
    req: uWS.HttpRequest, 
    options: UWSServerOptions<T>
  ) {
    try {
      this.setupCORS(res, options);

      if (req.getMethod() === 'options') {
        res.end();
        return;
      }

      const url = req.getUrl();
      const prefix = options.prefix || '';
      
      if (!url.startsWith(`${prefix}/`) && url !== prefix) {
        res.writeStatus('404').end('Not Found');
        return;
      }

      const pathname = prefix ? url.replace(prefix, '') : url;
      const path = pathname
        .replace(/^\/|\/$/g, '')
        .split('/')
        .map(decodeURIComponent);

      const procedure = get(this.router, path);

      if (!isProcedure(procedure)) {
        res.writeStatus('404').end('Not Found');
        return;
      }

      let input;
      if (req.getMethod() !== 'get' && req.getMethod() !== 'head') {
        const bodyData = await this.readJsonBody(res);
        input = parseEmptyableJSON(JSON.stringify(bodyData));
      } else {
        input = undefined;
      }

      const client = createProcedureClient(procedure, {
        context: options.context,
        path,
      });

      const output = await client(input);
      
      res.writeHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(output));
    } catch (e) {
      const error =
        e instanceof ORPCError
          ? e
          : new ORPCError('INTERNAL_ERROR', {
              message: 'An error occurred while processing the request.',
              cause: e,
            });

      res.writeStatus(error.status.toString());
      res.writeHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(error.toJSON()));
    }
  }

  listen(options: UWSServerOptions<T>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.app) {
        reject(new Error('Server is already running'));
        return;
      }

      this.app = uWS.App();
      const prefix = options.prefix || '/rpc';

      this.app.any(`${prefix}/*`, (res, req) => {
        this.handleRPCRequest(res, req, options);
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
