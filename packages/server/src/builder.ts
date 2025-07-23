import type { IntersectPick } from '@orpc/shared';
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
   * Set or override the initial context.
   *
   * @see {@link https://orpc.unnoq.com/docs/context Context Docs}
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
   *
   * @see {@link https://orpc.unnoq.com/docs/middleware Middleware Docs}
   */
  middleware<UOutContext extends IntersectPick<TCurrentContext, UOutContext>>(
    middleware: Middleware<TInitialContext, UOutContext>
  ): Middleware<TInitialContext, UOutContext> {
    return middleware;
  }

  /**
   * Uses a middleware to modify the context or improve the pipeline.
   *
   * @info Supports both normal middleware and inline middleware implementations.
   * @note The current context must be satisfy middleware dependent-context
   * @see {@link https://orpc.unnoq.com/docs/middleware Middleware Docs}
   */
  use<
    UOutContext extends IntersectPick<TCurrentContext, UOutContext>,
    UInContext extends Context = TCurrentContext,
  >(
    middleware: Middleware<UInContext | TCurrentContext, UOutContext>
  ): Builder<
    TInitialContext,
    Omit<TCurrentContext, keyof UOutContext> & UOutContext,
    TInputSchema,
    TOutputSchema
  > {
    return new Builder({
      ...this['~orpc'],
      middlewares: [...this['~orpc'].middlewares, middleware],
    });
  }

  /**
   * Defines the input validation schema.
   *
   * @see {@link https://orpc.unnoq.com/docs/procedure#input-output-validation Input Validation Docs}
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
   *
   * @see {@link https://orpc.unnoq.com/docs/procedure#input-output-validation Output Validation Docs}
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
   *
   * @see {@link https://orpc.unnoq.com/docs/procedure Procedure Docs}
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
    TOutputSchema extends { initial?: true } // infer handler output if output is not defined
      ? Schema<UFuncOutput>
      : TOutputSchema
  > {
    return new Procedure({
      ...this['~orpc'],
      handler,
    }) as any;
  }
}

export const os = new Builder<
  Record<never, never>,
  Record<never, never>,
  Schema<unknown, unknown>,
  Schema<unknown, unknown> & { initial?: true }
>({
  middlewares: [],
});
