import uWS from 'uWebSockets.js';
import { ORPCError } from '@mini-orpc/client';
import { get, parseEmptyableJSON } from '@orpc/shared';
import { isProcedure } from '../procedure';
import { createProcedureClient } from '../procedure-client';
import { parseBody } from '../utils/parsers';
import type { Router } from '../router';
import type { Context } from '../types';
import type { UWSServerOptions } from './server';

export function createUWSHandler<T extends Context>(
  router: Router<T>,
  options: UWSServerOptions<T>
) {
  return async function handleRPCRequest(
    res: uWS.HttpResponse,
    req: uWS.HttpRequest
  ) {
    try {
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

      const procedure = get(router, path);

      if (!isProcedure(procedure)) {
        res.writeStatus('404').end('Not Found');
        return;
      }

      let input;
      if (req.getMethod() !== 'get' && req.getMethod() !== 'head') {
        const bodyData = await parseBody(req, res);
        input = bodyData ? parseEmptyableJSON(JSON.stringify(bodyData)) : undefined;
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
  };
}
