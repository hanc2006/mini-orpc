import { parseEmptyableJSON } from '@orpc/shared';
import { isORPCErrorJson, isORPCErrorStatus, ORPCError } from '../error';
import type { ClientOptions } from '../types';

export interface JSONLinkOptions {
  url: string | URL;
}

export class RPCLink {
  private readonly url: string | URL;

  constructor(options: JSONLinkOptions) {
    this.url = options.url;
  }

  async call(
    path: readonly string[],
    input: any,
    options: ClientOptions
  ): Promise<any> {
    const url = new URL(this.url);
    url.pathname = url.pathname.replace(/\/$/, '') + '/' + path.join('/');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal: options.signal,
    });

    /**
     * The request body may be empty, which is interpreted as `undefined` output/error.
     * Only JSON data is supported for output/error transfer.
     * For more complex data types, consider using a library like [SuperJSON](https://github.com/flightcontrolhq/superjson).
     * Note: oRPC uses its own optimized serialization for internal transfers.
     */
    const body = await parseEmptyableJSON(await response.text());

    if (isORPCErrorStatus(response.status) && isORPCErrorJson(body)) {
      throw new ORPCError(body.code, body);
    }

    if (!response.ok) {
      throw new Error(
        `[ORPC] Request failed with status ${response.status}: ${response.statusText}`,
        { cause: response }
      );
    }

    return body;
  }
}
