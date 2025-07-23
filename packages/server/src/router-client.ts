import {
  get,
  type MaybeOptionalOptions,
  resolveMaybeOptionalOptions,
  toArray,
} from '@orpc/shared';
import { isProcedure, type Procedure } from './procedure';
import {
  type CreateProcedureClientOptions,
  createProcedureClient,
  type ProcedureClient,
} from './procedure-client';
import type { InferRouterInitialContexts, Router } from './router';

export type RouterClient<TRouter extends Router> = TRouter extends Procedure<
  any,
  any,
  infer UInputSchema,
  infer UOutputSchema
>
  ? ProcedureClient<UInputSchema, UOutputSchema>
  : {
      [K in keyof TRouter]: TRouter[K] extends Router
        ? RouterClient<TRouter[K]>
        : never;
    };

export function createRouterClient<T extends Router>(
  router: Router,
  ...rest: MaybeOptionalOptions<
    CreateProcedureClientOptions<InferRouterInitialContexts<T>>
  >
): RouterClient<T> {
  const options = resolveMaybeOptionalOptions(rest);

  if (isProcedure(router)) {
    const caller = createProcedureClient(router, options);

    return caller as RouterClient<T>;
  }

  const recursive = new Proxy(router, {
    get(target, key) {
      if (typeof key !== 'string') {
        return Reflect.get(target, key);
      }

      const next = get(router, [key]) as Router | undefined;

      if (!next) {
        return Reflect.get(target, key);
      }

      return createRouterClient(next, {
        ...options,
        path: [...toArray(options.path), key],
      });
    },
  });

  return recursive as RouterClient<T>;
}
