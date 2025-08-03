import type {
  AnySchema,
  Context,
  InferSchemaInput,
  InferSchemaOutput,
} from '../types';
import type {
  HasPathParams,
  HttpMethod,
  HttpMethodWithBody,
  HttpStatusCode,
  PathParamsToObject,
} from './http-types';

/**
 * Utility type to omit properties of type never
 */
export type ExcludeNever<T> = T extends any[] | Date
  ? T
  : { [K in keyof T as T[K] extends never ? never : K]: T[K] } & {};

/**
 * Utility type to simplify and prettify types for better display
 */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Utility type for deep array simplification
 */
export type SimplifyDeepArray<T> = T extends any[]
  ? { [E in keyof T]: SimplifyDeepArray<T[E]> }
  : Simplify<T>;

/**
 * A utility type that deeply resolves and prettifies nested types
 */
export type DeepResolve<T> = T extends (...args: any[]) => any
  ? T
  : T extends Array<any>
  ? T extends Array<infer U>
    ? Array<DeepResolve<U>>
    : never
  : T extends Date
  ? T
  : T extends object
  ? { [K in keyof T]: DeepResolve<T[K]> }
  : T;

/**
 * HTTP route configuration for contract procedures
 */
export interface RouteConfig<
  TMethod extends HttpMethod = HttpMethod,
  TPath extends string = string,
> {
  method: TMethod;
  path: TPath;
  summary?: string;
  description?: string;
}

/**
 * Parsed route with extracted parameters and regex pattern
 */
export interface ParsedRoute {
  method: string;
  pathPattern: string;
  pathParams: string[]; // extracted from {param} syntax
  summary?: string | undefined;
  description?: string | undefined;
}

/**
 * Structured input schema with separate validation for different HTTP parts
 * Conditional based on HTTP method and path parameters
 */
export interface StructuredInput<
  TMethod extends HttpMethod = HttpMethod,
  TPath extends string = string,
> {
  // Params are required if path has parameters, otherwise not allowed
  params?: HasPathParams<TPath> extends true ? AnySchema : never;
  query?: AnySchema;
  // Body is only allowed for certain HTTP methods
  body?: TMethod extends HttpMethodWithBody ? AnySchema : never;
  headers?: AnySchema;
}

/**
 * Type inference for structured input schemas
 * Uses ExcludeNever to omit properties that are not defined instead of including them as never
 */
export type InferStructuredInput<
  T extends StructuredInput<any, any>,
  TMethod extends HttpMethod = HttpMethod,
  TPath extends string = string,
> = ExcludeNever<{
  // Only include params if they exist and are allowed
  params: T['params'] extends AnySchema
    ? InferSchemaInput<T['params']>
    : HasPathParams<TPath> extends true
      ? PathParamsToObject<TPath>
      : never;
  query: T['query'] extends AnySchema ? InferSchemaInput<T['query']> : never;
  body: T['body'] extends AnySchema ? InferSchemaInput<T['body']> : never;
  headers: T['headers'] extends AnySchema
    ? InferSchemaInput<T['headers']>
    : never;
}>;

/**
 * Helper type to validate that all keys in an object are valid HTTP status codes
 * This ensures that only objects with valid status code keys are accepted
 */
export type ValidateStatusCodeKeys<T> = keyof T extends HttpStatusCode
  ? T
  : {
      [K in keyof T]: K extends HttpStatusCode
        ? T[K]
        : never
    };

/**
 * Status code to schema mapping for responses
 * Only allows valid HTTP status codes
 */
export type StatusCodeOutputs = {
  [K in HttpStatusCode]?: AnySchema;
};

/**
 * Type inference for status code outputs
 */
export type InferStatusCodeOutputs<T extends StatusCodeOutputs> = {
  [K in keyof T]: T[K] extends AnySchema ? InferSchemaOutput<T[K]> : never;
};

/**
 * Contract response with status code and data
 * Ensures the data matches the schema for the given status code
 */
export type ContractResponse<TOutput extends StatusCodeOutputs> = {
  [K in keyof TOutput]: {
    status: K;
    data: TOutput[K] extends AnySchema ? InferSchemaOutput<TOutput[K]> : never;
  };
}[keyof TOutput];

/**
 * Options passed to contract handlers
 */
export interface ContractHandlerOptions<
  TInput extends StructuredInput<any, any>,
  TContext extends Context,
  TMethod extends HttpMethod = HttpMethod,
  TPath extends string = string,
> {
  input: Simplify<InferStructuredInput<TInput, TMethod, TPath>>;
  context: TContext;
  path: readonly string[];
  signal?: AbortSignal;
}

/**
 * Contract handler function signature
 */
export interface ContractHandler<
  TRoute extends RouteConfig<any, any>,
  TInput extends StructuredInput<any, any>,
  TOutput extends StatusCodeOutputs
> {
  (
    options: ContractHandlerOptions<
      TInput,
      Context,
      TRoute['method'],
      TRoute['path']
    >
  ): Promise<ContractResponse<TOutput>>;
}

/**
 * Any contract handler type
 */
export type AnyContractHandler = ContractHandler<any, any, any>;
