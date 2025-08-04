import type uWS from 'uWebSockets.js';
import { ORPCError } from '@mini-orpc/client';
import { get } from '@orpc/shared';
import { isProcedure } from '../procedure';
import { createProcedureClient } from '../procedure-client';
import type { Router } from '../router';
import type { Context } from '../types';
import { type ParsedBody, parseBody } from './parsers';

export type RouteHandleResult = {
  status: 'notfound' | 'error' | 'found' | 'invalid';
  body?: any;
};

export function createUWSHandler<T extends Context>(
  context: T,
  router: Router<T>,
  prefix: string
) {
  return async function handle(
    res: uWS.HttpResponse,
    req: uWS.HttpRequest
  ): Promise<RouteHandleResult> {
    try {
      const url = req.getUrl();

      if (!url.startsWith(`${prefix}/`) && url !== prefix) {
        return { status: 'notfound' };
      }

      const pathname = prefix ? url.replace(prefix, '') : url;
      const path = pathname
        .replace(/^\/|\/$/g, '')
        .split('/')
        .map(decodeURIComponent);

      const procedure = get(router, path);

      if (!isProcedure(procedure)) {
        return { status: 'invalid' };
      }

      let body: ParsedBody;
      if (req.getMethod() !== 'get' && req.getMethod() !== 'head') {
        body = await parseBody(req, res);
      }

      const output = createProcedureClient(procedure, {
        context,
        path,
      })(body, { signal: undefined });

      return {
        status: 'found',
        body: output,
      };
    } catch (e) {
      // TODO check if this code should be removed from here

      const error =
        e instanceof ORPCError
          ? e
          : new ORPCError('INTERNAL_ERROR', {
              message: 'An error occurred while processing the request.',
              cause: e,
            });

      return {
        status: 'error',
        body: JSON.stringify(error.toJSON()),
      };
    }
  };
}
