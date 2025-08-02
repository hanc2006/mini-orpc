import type { IntersectPick } from '@orpc/shared';
import type { z } from 'zod';
import type { Middleware } from './middleware';
import {
  Procedure,
  type ProcedureDef,
  type ProcedureHandler,
} from './procedure';
import type {
  AnySchema,
  Context,
  InferSchemaInput,
  InferSchemaOutput,
  Schema,
} from './types';

export interface BuilderDef<
  TInitialContext extends Context,
  TCurrentContext extends Context,
  TInputSchema extends AnySchema,
  TOutputSchema extends AnySchema,
> extends Omit<
    ProcedureDef<TInitialContext, TCurrentContext, TInputSchema, TOutputSchema>,
    'handler'
  > {}

export class Builder<
  TInitialContext extends Context,
  TCurrentContext extends Context,
  TInputSchema extends AnySchema,
  TOutputSchema extends AnySchema,
> {
  /**
   * This property holds the defined options.
   */
  '~orpc': BuilderDef<
    TInitialContext,
    TCurrentContext,
    TInputSchema,
    TOutputSchema
  >;

  constructor(
    def: BuilderDef<
      TInitialContext,
      TCurrentContext,
      TInputSchema,
      TOutputSchema
    >
  ) {
    this['~orpc'] = def;
  }

  /**
   * Override initial context.
   */
  $context<U extends Context>(): Builder<
    U & Record<never, never>,
    U,
    TInputSchema,
    TOutputSchema
  > {
    /**
     * We need `& Record<never, never>` to deal with `has no properties in common with type` error
     */

    return new Builder({
      ...this['~orpc'],
      middlewares: [],
    });
  }

  /**
   * Creates a middleware.
   */
  middleware<UOutContext extends IntersectPick<TCurrentContext, UOutContext>>(
    middleware: Middleware<TInitialContext, UOutContext>
  ): Middleware<TInitialContext, UOutContext> {
    /**
     * `extends IntersectPick<TCurrentContext, UOutContext>`
     *  Ensures that the UOutContext is not conflicting with the current context.
     */

    return middleware;
  }

  /**
   * Uses a middleware to modify the context or improve the pipeline.
   */
  use<UOutContext extends IntersectPick<TCurrentContext, UOutContext>>(
    middleware: Middleware<TCurrentContext, UOutContext>
  ): Builder<
    TInitialContext,
    Omit<TCurrentContext, keyof UOutContext> & UOutContext,
    TInputSchema,
    TOutputSchema
  > {
    /**
     * `extends IntersectPick<TCurrentContext, UOutContext>`
     *  Ensures that the UOutContext is not conflicting with the current context.
     */

    /**
     * `Omit<TCurrentContext, keyof UOutContext> & UOutContext`
     * UOutContext will merge with the current context.
     */

    return new Builder({
      ...this['~orpc'],
      middlewares: [...this['~orpc'].middlewares, middleware],
    });
  }

  /**
   * Defines the input validation schema.
   */
  input<USchema extends AnySchema>(
    schema: USchema
  ): Builder<TInitialContext, TCurrentContext, USchema, TOutputSchema> {
    return new Builder({
      ...this['~orpc'],
      inputSchema: schema,
    });
  }

  /**
   * Defines the output validation schema.
   */
  output<USchema extends AnySchema>(
    schema: USchema
  ): Builder<TInitialContext, TCurrentContext, TInputSchema, USchema> {
    return new Builder({
      ...this['~orpc'],
      outputSchema: schema,
    });
  }

  /**
   * Defines the handler of the procedure.
   */
  handler<UFuncOutput extends InferSchemaInput<TOutputSchema>>(
    handler: ProcedureHandler<
      TCurrentContext,
      InferSchemaOutput<TInputSchema>,
      UFuncOutput
    >
  ): Procedure<
    TInitialContext,
    TCurrentContext,
    TInputSchema,
    TOutputSchema extends { initial?: true }
      ? Schema<UFuncOutput>
      : TOutputSchema
  > {
    /**
     * `TOutputSchema extends { initial?: true }`
     * Means that the output schema is not defined yet,
     * so we can use the handler output as the output schema.
     */

    return new Procedure({
      ...this['~orpc'],
      handler,
    }) as any;
  }
}

export const os = new Builder<
  Record<never, never>,
  Record<never, never>,
  ReturnType<typeof z.unknown>,
  ReturnType<typeof z.unknown> & { initial?: true } // indicate that this is the initial schema
>({
  middlewares: [],
});
