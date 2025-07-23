import type { AnyProcedure, Procedure } from './procedure';

export type Router = AnyProcedure | { [k: string]: Router };

export type InferRouterInitialContexts<T extends Router> = T extends Procedure<
  infer UInitialContext,
  any,
  any,
  any
>
  ? UInitialContext
  : {
      [K in keyof T]: T[K] extends Router
        ? InferRouterInitialContexts<T[K]>
        : never;
    };
