import { type Client, ORPCError } from '@mini-orpc/client';
import {
  type MaybeOptionalOptions,
  resolveMaybeOptionalOptions,
} from '@orpc/shared';
import { ValidationError } from './error';
import type {
  AnyProcedure,
  Procedure,
  ProcedureHandlerOptions,
} from './procedure';
import type {
  AnySchema,
  Context,
  InferSchemaInput,
  InferSchemaOutput,
} from './types';

export type ProcedureClient<
  TInputSchema extends AnySchema,
  TOutputSchema extends AnySchema,
> = Client<InferSchemaInput<TInputSchema>, InferSchemaOutput<TOutputSchema>>;

export type CreateProcedureClientOptions<TInitialContext extends Context> = {
  path?: readonly string[];
} & (Record<never, never> extends TInitialContext
  ? {
      context?: TInitialContext;
    }
  : {
      context: TInitialContext;
    });

export function createProcedureClient<
  TInitialContext extends Context,
  TInputSchema extends AnySchema,
  TOutputSchema extends AnySchema,
>(
  procedure: Procedure<TInitialContext, any, TInputSchema, TOutputSchema>,
  ...rest: MaybeOptionalOptions<CreateProcedureClientOptions<TInitialContext>>
): ProcedureClient<TInputSchema, TOutputSchema> {
  const options = resolveMaybeOptionalOptions(rest);

  return (...[input, callerOptions]) => {
    return executeProcedureInternal(procedure, {
      context: options.context ?? {},
      input,
      path: options.path ?? [],
      procedure,
      signal: callerOptions?.signal,
    });
  };
}

async function validateInput(
  procedure: AnyProcedure,
  input: unknown
): Promise<any> {
  const schema = procedure['~orpc'].inputSchema;

  if (!schema) {
    return input;
  }

  const result = await schema['~standard'].validate(input);
  if (result.issues) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Input validation failed',
      data: {
        issues: result.issues,
      },
      cause: new ValidationError({
        message: 'Input validation failed',
        issues: result.issues,
      }),
    });
  }

  return result.value;
}

async function validateOutput(
  procedure: AnyProcedure,
  output: unknown
): Promise<any> {
  const schema = procedure['~orpc'].outputSchema;

  if (!schema) {
    return output;
  }

  const result = await schema['~standard'].validate(output);
  if (result.issues) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'Output validation failed',
      cause: new ValidationError({
        message: 'Output validation failed',
        issues: result.issues,
      }),
    });
  }

  return result.value;
}

function executeProcedureInternal(
  procedure: AnyProcedure,
  options: ProcedureHandlerOptions<any, any>
): Promise<any> {
  const middlewares = procedure['~orpc'].middlewares;
  const inputValidationIndex = 0;
  const outputValidationIndex = 0;

  const next = async (
    index: number,
    context: Context,
    input: unknown
  ): Promise<unknown> => {
    let currentInput = input;

    if (index === inputValidationIndex) {
      currentInput = await validateInput(procedure, currentInput);
    }

    const mid = middlewares[index];

    const output = mid
      ? (
          await mid({
            ...options,
            context,
            next: async (...[nextOptions]) => {
              const nextContext: Context = nextOptions?.context ?? {};

              return {
                output: await next(
                  index + 1,
                  { ...context, ...nextContext },
                  currentInput
                ),
                context: nextContext,
              };
            },
          })
        ).output
      : await procedure['~orpc'].handler({
          ...options,
          context,
          input: currentInput,
        });

    if (index === outputValidationIndex) {
      return await validateOutput(procedure, output);
    }

    return output;
  };

  return next(0, options.context, options.input);
}
