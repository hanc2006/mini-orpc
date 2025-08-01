import type { Procedure } from "./procedure";
import type { Context } from "./types";

/**
 * Router can be either a single procedure or a nested object of routers.
 * This recursive structure allows for unlimited nesting depth.
 */
export type Router<T extends Context> =
  | Procedure<T, any, any, any>
  | { [k: string]: Router<T> };

export type AnyRouter = Router<any>;

/**
 * Utility type that extracts the initial context types
 * from all procedures within a router.
 */
export type InferRouterInitialContexts<T extends AnyRouter> =
  T extends Procedure<infer UInitialContext, any, any, any>
    ? UInitialContext
    : {
        [K in keyof T]: T[K] extends AnyRouter
          ? InferRouterInitialContexts<T[K]>
          : never;
      };
