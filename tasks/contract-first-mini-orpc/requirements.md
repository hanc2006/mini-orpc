# Requirements Document

## Introduction

This feature will extend Mini-ORPC to support contract-first development by integrating HTTP-aware contract definitions. The goal is to allow developers to define procedures with explicit HTTP routing information (method, path, headers, query parameters) while maintaining the existing Mini-ORPC architecture and type safety.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to define procedures with explicit HTTP routing information, so that I can create REST-like APIs with clear endpoint specifications.

#### Acceptance Criteria

1. WHEN I use `oc.route()` THEN I SHALL be able to specify HTTP method, path, and summary
2. WHEN I define a route path with parameters THEN the system SHALL extract and validate path parameters
3. WHEN I specify an HTTP method THEN the procedure SHALL only respond to requests with that method
4. WHEN I provide a summary THEN it SHALL be available for documentation generation

### Requirement 2

**User Story:** As a developer, I want to define structured input schemas with separate validation for params, query, body, and headers, so that I can have fine-grained control over request validation.

#### Acceptance Criteria

1. WHEN I use `.input()` with structured schema THEN I SHALL be able to define separate schemas for params, query, body, and headers
2. WHEN a request is processed THEN each input type SHALL be validated against its respective schema
3. WHEN validation fails for any input type THEN the system SHALL return a descriptive error indicating which part failed
4. WHEN all validations pass THEN the handler SHALL receive a typed input object with all parts

### Requirement 3

**User Story:** As a developer, I want to define output schemas with HTTP status codes, so that I can specify different response types for different scenarios.

#### Acceptance Criteria

1. WHEN I use `.output()` THEN I SHALL be able to map HTTP status codes to response schemas
2. WHEN a handler returns a response THEN the system SHALL validate it against the appropriate status code schema
3. WHEN multiple status codes are defined THEN the handler SHALL be able to specify which status code to return
4. WHEN no status code is specified THEN the system SHALL default to 200

### Requirement 4

**User Story:** As a developer, I want the contract-first procedures to integrate seamlessly with existing Mini-ORPC middleware and builder patterns, so that I can use both approaches in the same application.

#### Acceptance Criteria

1. WHEN I define a contract procedure THEN I SHALL be able to apply existing Mini-ORPC middleware
2. WHEN I use contract procedures alongside regular procedures THEN they SHALL work together in the same router
3. WHEN I create clients THEN they SHALL work with both contract and regular procedures
4. WHEN I use the builder pattern THEN contract procedures SHALL support the same fluent API

### Requirement 5

**User Story:** As a developer, I want contract procedures to maintain full type safety, so that I get compile-time checking and IDE autocompletion.

#### Acceptance Criteria

1. WHEN I define input schemas THEN TypeScript SHALL infer the correct types for handler parameters
2. WHEN I define output schemas THEN TypeScript SHALL enforce return type compliance
3. WHEN I use the client THEN it SHALL provide type-safe method calls with proper input/output types
4. WHEN I make errors in schema definitions THEN TypeScript SHALL catch them at compile time

### Requirement 6

**User Story:** As a developer, I want to generate HTTP handlers from contract procedures, so that I can serve REST APIs alongside RPC endpoints.

#### Acceptance Criteria

1. WHEN I create an HTTP handler from a contract router THEN it SHALL route requests based on method and path
2. WHEN a request matches a route THEN it SHALL extract params, query, body, and headers according to the schema
3. WHEN the handler executes THEN it SHALL return the response with the appropriate HTTP status code
4. WHEN no route matches THEN the handler SHALL return a 404 response