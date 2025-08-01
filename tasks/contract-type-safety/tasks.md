# Implementation Plan

- [x] 1. Implement HTTP Status Code Validation

  - Create ValidHttpStatusCode union type with all valid HTTP status codes
  - Update StatusCodeOutputs interface to only accept valid status codes
  - Add TypeScript compilation tests to verify invalid status codes are rejected
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Create Path Parameter Extraction Utilities

  - Implement ExtractPathParams utility type to extract parameter names from route paths
  - Create PathParamsSchema type to convert extracted params to Zod object schema constraint
  - Add unit tests for path parameter extraction with various route patterns
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3. Implement Method-Based Input Constraints

  - Create MethodsWithoutBody type for HTTP methods that cannot have a body
  - Implement MethodConstrainedInput type that omits body for GET/HEAD/DELETE methods
  - Update BaseStructuredInput interface to support method constraints
  - Add TypeScript compilation tests to verify body is rejected for GET requests
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 4. Create Route-Aware Input Validation

  - Implement RouteConstrainedInput type combining method and path constraints
  - Update the input method in ContractFirstBuilder to use route-aware constraints
  - Add tests to verify path parameters are enforced based on route definition
  - _Requirements: 3.1, 3.2, 3.3, 2.1, 2.2_

- [ ] 5. Implement Conditional Input Property Inclusion

  - Create InferSchemaOrOmit helper type to infer schema input or return never
  - Implement PickDefined utility type to only include properties that are actually defined
  - Update InferStructuredInput type to omit undefined properties instead of using never
  - Add tests to verify undefined input properties are omitted from handler input
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 6. Implement Handler Return Type Validation

  - Create ConstrainedHandlerReturn type to constrain return to only defined status codes
  - Update ContractHandler interface to use constrained return type
  - Modify handler method in ContractFirstBuilder to enforce return type validation
  - Add TypeScript compilation tests to verify invalid return types are rejected
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7. Update Contract Builder Generic Constraints

  - Update ContractFirstBuilder class generic constraints to use new types
  - Modify input method to accept RouteConstrainedInput when route is defined
  - Update handler method to use enhanced type validation
  - Ensure backward compatibility with existing API surface
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 4.1, 5.1_

- [ ] 8. Create Comprehensive Type-Level Test Suite

  - Write TypeScript compilation tests for valid contract definitions
  - Create @ts-expect-error tests for invalid status codes, method constraints, and path parameters
  - Add tests for handler return type validation and input property omission
  - Verify error messages are clear and helpful for common mistakes
  - _Requirements: 1.3, 2.3, 3.3, 4.3, 5.4_

- [ ] 9. Update Existing Runtime Tests

  - Modify existing test files to work with new type constraints
  - Update type inference validation tests to verify new conditional property behavior
  - Ensure all existing functionality continues to work with enhanced type safety
  - Add runtime tests for edge cases and error scenarios
  - _Requirements: 4.4, 5.5_

- [ ] 10. Integration Testing and Documentation
  - Test complete contract definition flow with all type constraints enabled
  - Verify performance impact is minimal with enhanced type checking
  - Update code examples and documentation to reflect new type safety features
  - Create migration guide for existing code that may be affected by stricter types
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_
