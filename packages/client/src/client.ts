import type { JSONLink } from './fetch';
import type { Client, ClientOptions, NestedClient } from './types';

export interface createORPCClientOptions {
  /**
   * Use as base path for all procedure, useful when you only want to call a subset of the procedure.
   */
  path?: readonly string[];
}

/**
 * Create a oRPC client-side client from a link.
 *
 * @see {@link https://orpc.unnoq.com/docs/client/client-side Client-side Client Docs}
 */
export function createORPCClient<T extends NestedClient>(
  link: JSONLink,
  options: createORPCClientOptions = {}
): T {
  const path = options.path ?? [];

  const procedureClient: Client<unknown, unknown> = async (
    ...[input, clientOptions = {} as ClientOptions]
  ) => {
    return await link.call(path, input, clientOptions);
  };

  const recursive = new Proxy(procedureClient, {
    get(target, key) {
      if (typeof key !== 'string') {
        return Reflect.get(target, key);
      }

      return createORPCClient(link, {
        ...options,
        path: [...path, key],
      });
    },
  });

  return recursive as any;
}
