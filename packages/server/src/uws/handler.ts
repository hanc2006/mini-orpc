import type uWS from 'uWebSockets.js';
import { get } from '@orpc/shared';
import { isProcedure } from '../procedure';
import { createProcedureClient } from '../procedure-client';
import type { Router } from '../router';
import type { Context } from '../types';
import { type ParsedBody, parseBody } from '../utils/parsers';
import type { UWSServerOptions } from './server';

interface ExtendedHttpResponse extends uWS.HttpResponse {
  body?: string;
  headers?: Record<string, string>;
  statusCode?: string;
  hasHeaders?: boolean;
}

export function createUWSHandler<T extends Context>(
  router: Router<T>,
  options: UWSServerOptions<T>
) {
  return async function handleRPCRequest(
    res: uWS.HttpResponse,
    req: uWS.HttpRequest
  ) {
    const url = req.getUrl();
    const prefix = options.prefix || '';

    if (!url.startsWith(`${prefix}/`) && url !== prefix) {
      (res as ExtendedHttpResponse).statusCode = '404';
      (res as ExtendedHttpResponse).body = 'Not Found';
      return;
    }

    const pathname = prefix ? url.replace(prefix, '') : url;
    const path = pathname
      .replace(/^\/|\/$/g, '')
      .split('/')
      .map(decodeURIComponent);

    const procedure = get(router, path);

    if (!isProcedure(procedure)) {
      (res as ExtendedHttpResponse).statusCode = '404';
      (res as ExtendedHttpResponse).body = 'Not Found';
      return;
    }

    let body: ParsedBody;
    if (req.getMethod() !== 'get' && req.getMethod() !== 'head') {
      body = await parseBody(req, res);
    }

    const output = await createProcedureClient(procedure, {
      context: options.context,
      path,
    })(body);
    
    (res as ExtendedHttpResponse).headers = { 'Content-Type': 'application/json' };
    (res as ExtendedHttpResponse).body = JSON.stringify(output);
    (res as ExtendedHttpResponse).hasHeaders = true;
  };
}
