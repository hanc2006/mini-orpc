import uWS from 'uWebSockets.js';
import type { Router } from '../router';
import type { Context } from '../types';
import { createUWSHandler } from './handler';

export interface UWSServerOptions<T extends Context> {
  prefix: `/${string}`;
  context: T;
  port?: number;
  host?: string;
  cors: {
    origin?: string;
    methods?: string;
    headers?: string;
  };
  ssl?: uWS.AppOptions;
}

export class UWSServer<T extends Context> {
  private app: uWS.TemplatedApp;
  private opts: Required<UWSServerOptions<T>>;
  private catchFunction?: (
    error: any,
    req: uWS.HttpRequest,
    res: uWS.HttpResponse
  ) => void | Promise<void>;

  constructor(options: UWSServerOptions<T>) {
    this.app = uWS.App(options.ssl);
    this.opts = {
      port: options.port ?? 3001,
      host: options.host ?? '0.0.0.0',
      ...options,
      ...(options.ssl ?? ({} as uWS.AppOptions)),
      //...(options.ssl ?? undefined),
    };
  }

  private setupCORS(res: uWS.HttpResponse, options: UWSServerOptions<T>) {
    const cors = options.cors || {
      origin: '*',
      methods: 'GET, POST, PUT, DELETE, OPTIONS',
      headers: 'Content-Type, Authorization',
    };

    res.writeHeader('Access-Control-Allow-Origin', cors.origin || '*');
    res.writeHeader(
      'Access-Control-Allow-Methods',
      cors.methods || 'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.writeHeader(
      'Access-Control-Allow-Headers',
      cors.headers || 'Content-Type, Authorization'
    );
  }

  register(router: Router<T>) {
    const prefix = this.opts.prefix || '/rpc';
    const handler = createUWSHandler(router, this.opts);

    this.app.any(`${prefix}/*`, async (res, req) => {
      let aborted = false;

      res.onAborted(() => (aborted = true));

      this.setupCORS(res, this.opts);

      if (req.getMethod() === 'options') {
        res.end();
        return;
      }

      try {
        await handler(res, req);
      } catch (e) {
        if (this.catchFunction) {
          //TODO global error function
          this.catchFunction(e, req, res);
        }
      }

      if (!aborted) {
        if (res.hasHeaders || res.statusCode) {
          res.cork(() => {
            if (res.statusCode) {
              res.writeStatus(res.statusCode);
            }

            if (res.hasHeaders) {
              for (const value in res.headers) {
                if (Object.hasOwn(res.headers, value)) {
                  res.writeHeader(value, res.headers[value]);
                }
              }
            }

            res.end(res.body);
          });
        } else {
          res.end(res.body);
        }
      }
    });

    return this;
  }

  listen() {
    this.app.listen(this.opts.port, () => {
      console.log(
        `🚀 UWS API Server running at http://${this.opts.host}:${this.opts.port}`
      );
    });
  }

  async close() {
    // TODO graceful shutdown
    this.app.close();
    return Promise.resolve();
  }
}
