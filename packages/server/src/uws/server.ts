import uWS from 'uWebSockets.js';
import type { RequiredDeep } from 'type-fest';
import type { Router } from '../router';
import type { Context } from '../types';
import { createUWSHandler } from './handler';

export interface UWSServerSettings {
  prefix: `/${string}`;
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
  private instance: uWS.TemplatedApp;
  private settings: RequiredDeep<UWSServerSettings>;
  private catchFunction?: (
    error: any,
    req: uWS.HttpRequest,
    res: uWS.HttpResponse
  ) => void | Promise<void>;

  constructor(app: UWSServerSettings) {
    this.instance = uWS.App(app.ssl);
    this.settings = {
      ...app,
      port: app.port ?? 3001,
      host: app.host ?? '0.0.0.0',
      cors: {
        origin: app.cors.origin ?? '*',
        methods: app.cors.methods ?? 'GET, POST, PUT, DELETE, OPTIONS',
        headers: app.cors.headers ?? 'Content-Type, Authorization',
      },
      ssl: {
        ca_file_name: app.ssl?.ca_file_name ?? '',
        cert_file_name: app.ssl?.cert_file_name ?? '',
        dh_params_file_name: app.ssl?.dh_params_file_name ?? '',
        key_file_name: app.ssl?.key_file_name ?? '',
        passphrase: app.ssl?.passphrase ?? '',
        ssl_ciphers: app.ssl?.ssl_ciphers ?? '',
        ssl_prefer_low_memory_usage: app.ssl?.ssl_prefer_low_memory_usage ?? false,
      },
    };
  }

  private cors(res: uWS.HttpResponse) {
    const { cors } = this.settings;

    res.writeHeader('Access-Control-Allow-Origin', cors.origin);
    res.writeHeader(
      'Access-Control-Allow-Methods',
      cors.methods || 'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.writeHeader(
      'Access-Control-Allow-Headers',
      cors.headers || 'Content-Type, Authorization'
    );
  }

  register(context: T, router: Router<T>) {
    const prefix = this.settings.prefix || '/rpc';

    const handler = createUWSHandler(context, router, prefix);

    this.instance.any(`${prefix}/*`, async (res, req) => {
      let aborted = false;

      res.onAborted(() => (aborted = true));

      this.cors(res);

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
    this.instance.listen(this.settings.port, () => {
      console.log(
        `🚀 UWS API Server running at http://${this.settings.host}:${this.settings.port}`
      );
    });
  }

  async close() {
    // TODO graceful shutdown
    this.instance.close();
    return Promise.resolve();
  }
}
