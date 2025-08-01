# Design Document

## Overview

This design implements comprehensive TypeScript type safety for the Mini-ORPC contract builder. The solution uses advanced TypeScript type manipulation to enforce HTTP method constraints, validate status codes, infer path parameters, conditionally include input properties, and validate handler return types at compile time.

## Architecture

The type safety system is built around several key TypeScript utility types and constraints:

1. **ValidHttpStatusCode** - Union type of valid HTTP status codes
2. **ExtractPathParams** - Utility type to extract parameter names from route paths
3. **MethodConstrainedInput** - Conditional input type based on HTTP method
4. **ConditionalInputProperties** - Type that omits undefined input properties
5. **ConstrainedHandlerReturn** - Return type validation for handlers

## Components and Interfaces

### 1. HTTP Status Code Validation

```typescript
// Valid HTTP status codes as a union type
type ValidHttpStatusCode =
  | 200
  | 201
  | 202
  | 204
  | 300
  | 301
  | 302
  | 304
  | 400
  | 401
  | 403
  | 404
  | 405
  | 409
  | 422
  | 429
  | 500
  | 501
  | 502
  | 503
  | 504;

// Updated StatusCodeOutputs to only accept valid codes
export type StatusCodeOutputs = {
  [K in ValidHttpStatusCode]?: z.ZodTypeAny;
};
```

### 2. Path Parameter Extraction

```typescript
// Extract parameter names from route path strings
type ExtractPathParams<T extends string> =
  T extends `${string}/{${infer Param}}${infer Rest}`
    ? Record<Param, string> & ExtractPathParams<Rest>
    : Record<string, never>;

// Convert extracted params to Zod object schema constraint
type PathParamsSchema<T extends string> = ExtractPathParams<T> extends Record<
  string,
  never
>
  ? never // No params allowed if path has no parameters
  : z.ZodObject<{
      [K in keyof ExtractPathParams<T>]: z.ZodString;
    }>;
```

### 3. Method-Based Input Constraints

```typescript
// HTTP methods that cannot have a body
type MethodsWithoutBody = "GET" | "HEAD" | "DELETE";

// Base structured input interface
interface BaseStructuredInput {
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  body?: z.ZodTypeAny;
  headers?: z.ZodTypeAny;
}

// Method-constrained input type
type MethodConstrainedInput<TMethod extends HTTPMethod> =
  TMethod extends MethodsWithoutBody
    ? Omit<BaseStructuredInput, "body">
    : BaseStructuredInput;
```

### 4. Route-Aware Input Validation

```typescript
// Complete input validation combining method and path constraints
type RouteConstrainedInput<TRoute extends RouteConfig> = MethodConstrainedInput<
  TRoute["method"]
> & {
  params?: PathParamsSchema<TRoute["path"]>;
};
```

### 5. Conditional Input Properties

```typescript
// Helper to infer schema input or omit if not present
type InferSchemaOrOmit<T> = T extends z.ZodTypeAny ? z.input<T> : never;

// Only include properties that are actually defined
type PickDefined<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};

// Updated input inference that omits undefined properties
export type InferStructuredInput<T> = PickDefined<{
  params: InferSchemaOrOmit<T extends { params: infer P } ? P : never>;
  query: InferSchemaOrOmit<T extends { query: infer Q } ? Q : never>;
  body: InferSchemaOrOmit<T extends { body: infer B } ? B : never>;
  headers: InferSchemaOrOmit<T extends { headers: infer H } ? H : never>;
}>;
```

### 6. Handler Return Type Validation

```typescript
// Constrain handler return to only defined status codes
type ConstrainedHandlerReturn<TOutput extends StatusCodeOutputs> = {
  status: keyof TOutput;
  data: TOutput[keyof TOutput] extends z.ZodTypeAny
    ? z.output<TOutput[keyof TOutput]>
    : never;
};

// Updated contract handler interface
export interface ContractHandler<
  TRoute extends RouteConfig,
  TInput,
  TOutput extends StatusCodeOutputs
> {
  (options: ContractHandlerOptions<TInput, any>): Promise<
    ConstrainedHandlerReturn<TOutput>
  >;
}
```

## Data Models

### Updated Contract Builder Types

The ContractFirstBuilder class will be updated with enhanced generic constraints:

```typescript
class ContractFirstBuilder<
  TRoute extends RouteConfig | undefined = undefined,
  TInput extends BaseStructuredInput | undefined = undefined,
  TOutput extends StatusCodeOutputs | undefined = undefined
> {
  // Route method with no changes to preserve existing API
  route<TRouteConfig extends RouteConfig>(
    config: TRouteConfig
  ): ContractFirstBuilder<TRouteConfig, TInput, TOutput>;

  // Input method with route-aware constraints
  input<
    TStructuredInput extends TRoute extends RouteConfig
      ? RouteConstrainedInput<TRoute>
      : BaseStructuredInput
  >(
    schema: TStructuredInput
  ): ContractFirstBuilder<TRoute, TStructuredInput, TOutput>;

  // Output method with valid status code constraints
  output<TStatusOutputs extends StatusCodeOutputs>(
    schemas: TStatusOutputs
  ): ContractFirstBuilder<TRoute, TInput, TStatusOutputs>;

  // Handler method with enhanced return type validation
  handler<THandler extends ConstrainedContractHandler<TRoute, TInput, TOutput>>(
    handler: THandler
  ): ContractFirstProcedure<TRoute, TInput, TOutput>;
}
```

### Type Validation Flow

1. **Route Definition**: No constraints, accepts any valid RouteConfig
2. **Input Definition**: Validates against route method and path parameters
3. **Output Definition**: Only accepts valid HTTP status codes
4. **Handler Definition**: Validates input access and return type constraints

## Error Handling

### Compile-Time Error Messages

The type system will provide clear error messages for common mistakes:

1. **Invalid Status Code**: "Type '999' is not assignable to type 'ValidHttpStatusCode'"
2. **Body in GET Request**: "Property 'body' does not exist on type 'MethodConstrainedInput<"GET">'"
3. **Invalid Path Params**: "Type does not satisfy the constraint 'PathParamsSchema<"/users">'"
4. **Invalid Handler Return**: "Type '{ status: 500 }' is not assignable to constraint"

### Runtime Validation

Existing runtime validation will be preserved and enhanced:

- Input validation continues to use Zod schemas
- Output validation continues to validate response structure
- Path parameter extraction continues to work with existing route parser

## Testing Strategy

### Type-Level Tests

Create comprehensive TypeScript compilation tests:

```typescript
// Test files that should compile successfully
const validContract = contractFirst
  .route({ method: "POST", path: "/users/{id}" })
  .input({
    params: z.object({ id: z.string() }),
    body: z.object({ name: z.string() }),
  })
  .output({
    200: z.object({ success: z.boolean() }),
    400: z.object({ error: z.string() }),
  })
  .handler(async ({ input }) => ({
    status: 200 as const,
    data: { success: true },
  }));

// Test files that should fail compilation
const invalidContract = contractFirst
  .route({ method: "GET", path: "/users" })
  .input({
    // @ts-expect-error - GET cannot have body
    body: z.object({ name: z.string() }),
    // @ts-expect-error - path has no params
    params: z.object({ id: z.string() }),
  })
  .output({
    // @ts-expect-error - invalid status code
    999: z.object({ error: z.string() }),
  })
  .handler(async () => ({
    // @ts-expect-error - status not defined in output
    status: 500 as const,
    data: { error: "test" },
  }));
```

### Runtime Tests

Enhance existing test suites to verify:

- Type inference works correctly with new constraints
- Runtime validation continues to work
- Error messages are helpful and accurate
- Performance is not significantly impacted

### Integration Tests

Test the complete flow:

- Route definition with various method/path combinations
- Input validation with different constraint scenarios
- Output validation with valid status codes only
- Handler execution with type-safe input/output

## Implementation Phases

### Phase 1: Status Code Validation

- Implement ValidHttpStatusCode type
- Update StatusCodeOutputs interface
- Add compilation tests for status code validation

### Phase 2: Path Parameter Extraction

- Implement ExtractPathParams utility type
- Create PathParamsSchema constraint
- Add tests for path parameter inference

### Phase 3: Method-Based Input Constraints

- Implement MethodConstrainedInput type
- Update input method with constraints
- Add tests for method-based validation

### Phase 4: Conditional Input Properties

- Implement PickDefined utility type
- Update InferStructuredInput type
- Add tests for property omission

### Phase 5: Handler Return Validation

- Implement ConstrainedHandlerReturn type
- Update ContractHandler interface
- Add tests for return type validation

### Phase 6: Integration and Testing

- Integrate all type constraints
- Update existing tests
- Add comprehensive type-level test suite
- Performance testing and optimization
