# Design Document

## Overview

This design extends Mini-ORPC with contract-first development capabilities, allowing developers to define HTTP-aware procedures with explicit routing, structured input validation, and status-code-based output schemas. The design maintains backward compatibility with existing Mini-ORPC while adding new contract-based procedure definitions.

## Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Contract      │    │   Contract      │    │   HTTP          │
│   Builder (oc)  │───▶│   Procedure     │───▶│   Handler       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Route         │    │   Structured    │    │   Request       │
│   Definition    │    │   Input/Output  │    │   Router        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Integration with Existing Mini-ORPC

The contract system will extend the existing Mini-ORPC architecture:

```
Existing Mini-ORPC:
os.input(schema).handler(fn) → Procedure

New Contract System:
oc.route(config).input(structured).output(statusCodes).handler(fn) → ContractProcedure
```

## Components and Interfaces

### 1. Contract Builder (`oc`)

```typescript
export interface ContractBuilder<
  TRoute extends RouteConfig,
  TInput extends StructuredInput,
  TOutput extends StatusCodeOutputs
> {
  route<TRouteConfig extends RouteConfig>(
    config: TRouteConfig
  ): ContractBuilder<TRouteConfig, TInput, TOutput>
  
  input<TStructuredInput extends StructuredInput>(
    schema: TStructuredInput
  ): ContractBuilder<TRoute, TStructuredInput, TOutput>
  
  output<TStatusOutputs extends StatusCodeOutputs>(
    schemas: TStatusOutputs
  ): ContractBuilder<TRoute, TInput, TStatusOutputs>
  
  handler<THandler extends ContractHandler<TRoute, TInput, TOutput>>(
    handler: THandler
  ): ContractProcedure<TRoute, TInput, TOutput>
}
```

### 2. Route Configuration

```typescript
export interface RouteConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string // e.g., '/planets/{id}'
  summary?: string
  description?: string
}

export interface ParsedRoute {
  method: string
  pathPattern: string
  pathParams: string[] // extracted from {param} syntax
  summary?: string
  description?: string
}
```

### 3. Structured Input Schema

```typescript
export interface StructuredInput {
  params?: AnySchema
  query?: AnySchema
  body?: AnySchema
  headers?: AnySchema
}

export type InferStructuredInput<T extends StructuredInput> = {
  params: T['params'] extends AnySchema ? InferSchemaInput<T['params']> : never
  query: T['query'] extends AnySchema ? InferSchemaInput<T['query']> : never
  body: T['body'] extends AnySchema ? InferSchemaInput<T['body']> : never
  headers: T['headers'] extends AnySchema ? InferSchemaInput<T['headers']> : never
}
```

### 4. Status Code Outputs

```typescript
export interface StatusCodeOutputs {
  [statusCode: number]: AnySchema
}

export type InferStatusCodeOutputs<T extends StatusCodeOutputs> = {
  [K in keyof T]: T[K] extends AnySchema ? InferSchemaOutput<T[K]> : never
}
```

### 5. Contract Procedure

```typescript
export class ContractProcedure<
  TRoute extends RouteConfig,
  TInput extends StructuredInput,
  TOutput extends StatusCodeOutputs
> {
  '~contract': {
    route: ParsedRoute
    inputSchema: TInput
    outputSchemas: TOutput
    handler: ContractHandler<TRoute, TInput, TOutput>
  }
  
  // Integration methods
  toProcedure(): Procedure<any, any, any, any>
  toHttpHandler(): HttpHandler
}
```

### 6. Contract Handler

```typescript
export interface ContractHandlerOptions<
  TInput extends StructuredInput,
  TContext extends Context
> {
  input: InferStructuredInput<TInput>
  context: TContext
  path: readonly string[]
  signal?: AbortSignal
}

export interface ContractHandler<
  TRoute extends RouteConfig,
  TInput extends StructuredInput,
  TOutput extends StatusCodeOutputs
> {
  (
    options: ContractHandlerOptions<TInput, Context>
  ): Promise<ContractResponse<TOutput>>
}

export interface ContractResponse<TOutput extends StatusCodeOutputs> {
  status: keyof TOutput
  data: InferStatusCodeOutputs<TOutput>[keyof TOutput]
}
```

## Data Models

### Route Parsing

The system will parse route paths to extract parameters:

```typescript
// Input: '/planets/{id}/moons/{moonId}'
// Output: {
//   pathPattern: '/planets/([^/]+)/moons/([^/]+)',
//   pathParams: ['id', 'moonId']
// }
```

### Request Processing Pipeline

```
HTTP Request
    ↓
Route Matching (method + path)
    ↓
Parameter Extraction (path params)
    ↓
Input Validation (params, query, body, headers)
    ↓
Handler Execution
    ↓
Output Validation (status code + data)
    ↓
HTTP Response
```

### Integration with Existing Middleware

Contract procedures will support existing Mini-ORPC middleware through adapter pattern:

```typescript
const contractProcedure = oc
  .route({ method: 'POST', path: '/planets' })
  .input({ body: PlanetSchema })
  .output({ 201: PlanetSchema })
  .handler(async ({ input }) => ({
    status: 201,
    data: { id: 1, name: input.body.name }
  }))

// Convert to regular procedure for middleware compatibility
const regularProcedure = contractProcedure.toProcedure()
const withMiddleware = os.use(authMiddleware).use(regularProcedure)
```

## Error Handling

### Validation Errors

```typescript
export interface ContractValidationError extends ORPCError<'BAD_REQUEST', any> {
  data: {
    type: 'params' | 'query' | 'body' | 'headers'
    issues: ValidationIssue[]
  }
}
```

### Route Matching Errors

```typescript
export interface RouteNotFoundError extends ORPCError<'NOT_FOUND', any> {
  data: {
    method: string
    path: string
    availableRoutes: string[]
  }
}
```

## Testing Strategy

### Unit Tests

1. **Route Parsing**: Test path parameter extraction and pattern generation
2. **Input Validation**: Test structured input validation for each component
3. **Output Validation**: Test status code and response schema validation
4. **Handler Execution**: Test contract handler invocation and response formatting

### Integration Tests

1. **HTTP Handler**: Test end-to-end HTTP request processing
2. **Middleware Integration**: Test compatibility with existing Mini-ORPC middleware
3. **Client Integration**: Test client generation and type safety
4. **Error Scenarios**: Test various error conditions and responses

### Type Safety Tests

1. **Input Type Inference**: Verify correct TypeScript types for handler inputs
2. **Output Type Inference**: Verify correct TypeScript types for handler outputs
3. **Client Type Safety**: Verify client method signatures match contract definitions
4. **Compilation Tests**: Ensure invalid schemas cause TypeScript errors

## Implementation Phases

### Phase 1: Core Contract System
- Route configuration and parsing
- Structured input schema definition
- Status code output schemas
- Basic contract procedure implementation

### Phase 2: HTTP Integration
- HTTP handler generation
- Request routing and parameter extraction
- Response formatting with status codes
- Error handling and validation

### Phase 3: Mini-ORPC Integration
- Adapter for existing middleware system
- Client generation for contract procedures
- Router integration for mixed procedure types
- Backward compatibility testing

### Phase 4: Advanced Features
- OpenAPI schema generation
- Documentation generation
- Advanced validation features
- Performance optimizations