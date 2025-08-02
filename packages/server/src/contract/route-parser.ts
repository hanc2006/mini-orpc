import type { ParsedRoute, RouteConfig } from './types';

/**
 * Parse a route configuration into a parsed route with regex pattern and parameters
 */
export function parseRoute(config: RouteConfig): ParsedRoute {
  const { method, path, summary, description } = config;

  // Extract path parameters from {param} syntax
  const pathParams: string[] = [];
  const pathPattern = path.replace(/\{([^}]+)\}/g, (match, paramName) => {
    pathParams.push(paramName);
    return '([^/]+)'; // Match any characters except forward slash
  });

  return {
    method,
    pathPattern,
    pathParams,
    summary,
    description,
  };
}

/**
 * Extract path parameters from a URL using a parsed route
 */
export function extractPathParams(
  url: string,
  parsedRoute: ParsedRoute
): Record<string, string> | null {
  const regex = new RegExp(`^${parsedRoute.pathPattern}$`);
  const match = url.match(regex);

  if (!match) {
    return null;
  }

  const params: Record<string, string> = {};

  // Skip the first match (full string) and map parameter names to values
  for (let i = 0; i < parsedRoute.pathParams.length; i++) {
    const paramName = parsedRoute.pathParams[i];
    const paramValue = match[i + 1];
    if (paramName && paramValue !== undefined) {
      params[paramName] = decodeURIComponent(paramValue);
    }
  }

  return params;
}

/**
 * Check if a route matches a given method and path
 */
export function matchesRoute(
  method: string,
  path: string,
  parsedRoute: ParsedRoute
): boolean {
  if (method.toLowerCase() !== parsedRoute.method.toLowerCase()) {
    return false;
  }

  const regex = new RegExp(`^${parsedRoute.pathPattern}$`);
  return regex.test(path);
}
