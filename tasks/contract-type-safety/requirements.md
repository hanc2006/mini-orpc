# Requirements Document

## Introduction

The Mini-ORPC contract builder currently has critical type safety issues that allow developers to create invalid contracts at compile time. This feature will implement comprehensive TypeScript type safety to prevent invalid HTTP status codes, enforce method-based input validation, infer path parameters from routes, conditionally include input properties, and validate handler return types.

## Requirements

### Requirement 1: HTTP Status Code Validation

**User Story:** As a developer, I want the contract builder to only accept valid HTTP status codes in the output schema, so that I cannot accidentally use invalid status codes like 999 or 2222222200.

#### Acceptance Criteria

1. WHEN I define an output schema with an invalid HTTP status code THEN TypeScript SHALL reject the code at compile time
2. WHEN I define an output schema with valid HTTP status codes (200, 201, 400, 404, 500, etc.) THEN TypeScript SHALL accept the schema
3. WHEN I try to use status codes outside the valid HTTP range THEN the system SHALL provide clear type errors

### Requirement 2: Method-Based Input Validation

**User Story:** As a developer, I want the contract builder to enforce HTTP method constraints on input schemas, so that GET requests cannot have a body and other method-specific rules are enforced.

#### Acceptance Criteria

1. WHEN I define a route with method "GET", "HEAD", or "DELETE" AND I try to include a body in the input schema THEN TypeScript SHALL reject the schema at compile time
2. WHEN I define a route with method "POST", "PUT", or "PATCH" AND I include a body in the input schema THEN TypeScript SHALL accept the schema
3. WHEN I define input for methods that don't support bodies THEN the body property SHALL not be available in the input type

### Requirement 3: Path Parameter Type Inference

**User Story:** As a developer, I want the contract builder to automatically infer path parameters from the route path and enforce them in the input schema, so that I cannot define params that don't exist in the path or miss required params.

#### Acceptance Criteria

1. WHEN I define a route path with parameters like "/users/{id}/posts/{postId}" THEN the input params schema SHALL only accept schemas that define "id" and "postId" as string properties
2. WHEN I define a route path without parameters like "/users" AND I try to define params in the input schema THEN TypeScript SHALL reject the schema
3. WHEN I define a route path with parameters AND I omit required parameters from the input schema THEN TypeScript SHALL reject the schema
4. WHEN path parameters are defined THEN they SHALL be inferred as string types in the handler input

### Requirement 4: Conditional Input Property Inclusion

**User Story:** As a developer, I want the handler function to only receive input properties that are actually defined in the input schema, so that undefined properties are omitted rather than having a "never" type.

#### Acceptance Criteria

1. WHEN I define an input schema with only body and query THEN the handler input SHALL only include body and query properties
2. WHEN I define an input schema without params THEN the handler input SHALL not include a params property
3. WHEN I access an undefined input property in the handler THEN TypeScript SHALL prevent access at compile time
4. WHEN input properties are defined THEN they SHALL maintain their correct inferred types in the handler

### Requirement 5: Handler Return Type Validation

**User Story:** As a developer, I want the handler function return type to be constrained to only the status codes defined in the output schema, so that I cannot return invalid status codes or data that doesn't match the schema.

#### Acceptance Criteria

1. WHEN I define output schemas for status codes 200 and 404 THEN the handler SHALL only be able to return status 200 or 404
2. WHEN I try to return a status code not defined in the output schema THEN TypeScript SHALL reject the handler at compile time
3. WHEN I return a status code THEN the data property SHALL be constrained to match the corresponding output schema type
4. WHEN I return data that doesn't match the output schema for a status code THEN TypeScript SHALL reject the handler at compile time
5. WHEN the handler returns a response THEN the status and data SHALL be type-safe and validated against the output schemas
