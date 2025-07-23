import type { Procedure } from './procedure';
import type { Context } from './types';

export type Router<T extends Context> =
  | Procedure<T, any, any, any>
  | { [k: string]: Router<T> };

export type AnyRouter = Router<any>;

export type InferRouterInitialContexts<T extends AnyRouter> =
  T extends Procedure<infer UInitialContext, any, any, any>
    ? UInitialContext
    : {
        [K in keyof T]: T[K] extends AnyRouter
          ? InferRouterInitialContexts<T[K]>
          : never;
      };
