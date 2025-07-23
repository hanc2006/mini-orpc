import { ORPCError } from '@mini-orpc/client';
import { get, parseEmptyableJSON } from '@orpc/shared';
import { isProcedure } from '../procedure';
import { createProcedureClient } from '../procedure-client';
import type { Router } from '../router';
import type { Context } from '../types';

export interface JSONHandlerHandleOptions<T extends Context> {
  prefix?: `/${string}`;
  context: T;
}

export type JSONHandlerHandleResult =
  | { matched: true; response: Response }
  | { matched: false; response?: undefined };

export class JSONHandler<T extends Context> {
  private readonly router: Router<T>;

  constructor(router: Router<T>) {
    this.router = router;
  }

  async handle(
    request: Request,
    options: JSONHandlerHandleOptions<T>
  ): Promise<JSONHandlerHandleResult> {
    const prefix = options.prefix;
    const url = new URL(request.url);

    if (
      prefix &&
      !url.pathname.startsWith(`${prefix}/`) &&
      url.pathname !== prefix
    ) {
      return { matched: false, response: undefined };
    }

    const pathname = prefix ? url.pathname.replace(prefix, '') : url.pathname;

    const path = pathname
      .replace(/^\/|\/$/g, '')
      .split('/')
      .map(decodeURIComponent);

    const procedure = get(this.router, path);

    if (!isProcedure(procedure)) {
      return { matched: false, response: undefined };
    }

    const client = createProcedureClient(procedure, {
      context: options.context,
      path,
    });

    try {
      const input = parseEmptyableJSON(await request.text()); // body can be empty to represent undefined

      const output = await client(input, {
        signal: request.signal,
      });

      const response = Response.json(output);

      return {
        matched: true,
        response,
      };
    } catch (e) {
      const error =
        e instanceof ORPCError
          ? e
          : new ORPCError('INTERNAL_ERROR', {
              message: 'An error occurred while processing the request.',
              cause: e,
            });

      const response = new Response(JSON.stringify(error.toJSON()), {
        status: error.status,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return {
        matched: true,
        response,
      };
    }
  }
}
