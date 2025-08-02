/**
 * HTTP Methods and their allowed input types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/**
 * HTTP methods that allow body
 */
export type HttpMethodWithBody = 'POST' | 'PUT' | 'PATCH'

/**
 * HTTP methods that don't allow body
 */
export type HttpMethodWithoutBody = 'GET' | 'DELETE'

/**
 * Valid HTTP status codes
 */
export type HttpStatusCode = 
  // 1xx Informational
  | 100 | 101 | 102 | 103
  // 2xx Success
  | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
  // 3xx Redirection
  | 300 | 301 | 302 | 303 | 304 | 305 | 307 | 308
  // 4xx Client Error
  | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409
  | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421
  | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451
  // 5xx Server Error
  | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511

/**
 * Extract path parameters from a path string
 * Example: '/users/{id}/posts/{postId}' -> 'id' | 'postId'
 */
export type ExtractPathParams<T extends string> = 
  T extends `${string}{${infer Param}}${infer Rest}`
    ? Param | ExtractPathParams<Rest>
    : never

/**
 * Convert path parameters to an object type
 * Example: 'id' | 'postId' -> { id: string; postId: string }
 */
export type PathParamsToObject<T extends string> = 
  ExtractPathParams<T> extends never 
    ? Record<never, never>
    : { [K in ExtractPathParams<T>]: string }

/**
 * Check if a path has parameters
 */
export type HasPathParams<T extends string> = ExtractPathParams<T> extends never ? false : true