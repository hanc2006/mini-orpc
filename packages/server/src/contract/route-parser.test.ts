import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractPathParams, matchesRoute, parseRoute } from './route-parser';
import type { RouteConfig } from './types';

describe('Route Parser', () => {
  describe('parseRoute', () => {
    it('should parse simple route without parameters', () => {
      const config: RouteConfig = {
        method: 'GET',
        path: '/planets',
        summary: 'List planets',
      };

      const result = parseRoute(config);

      assert.strictEqual(result.method, 'GET');
      assert.strictEqual(result.pathPattern, '/planets');
      assert.deepStrictEqual(result.pathParams, []);
      assert.strictEqual(result.summary, 'List planets');
    });

    it('should parse route with single parameter', () => {
      const config: RouteConfig = {
        method: 'GET',
        path: '/planets/{id}',
      };

      const result = parseRoute(config);

      assert.strictEqual(result.method, 'GET');
      assert.strictEqual(result.pathPattern, '/planets/([^/]+)');
      assert.deepStrictEqual(result.pathParams, ['id']);
    });

    it('should parse route with multiple parameters', () => {
      const config: RouteConfig = {
        method: 'GET',
        path: '/planets/{id}/moons/{moonId}',
      };

      const result = parseRoute(config);

      assert.strictEqual(result.method, 'GET');
      assert.strictEqual(result.pathPattern, '/planets/([^/]+)/moons/([^/]+)');
      assert.deepStrictEqual(result.pathParams, ['id', 'moonId']);
    });
  });

  describe('extractPathParams', () => {
    it('should extract parameters from URL', () => {
      const parsedRoute = parseRoute({
        method: 'GET',
        path: '/planets/{id}/moons/{moonId}',
      });

      const params = extractPathParams(
        '/planets/earth/moons/luna',
        parsedRoute
      );

      assert.deepStrictEqual(params, {
        id: 'earth',
        moonId: 'luna',
      });
    });

    it('should return null for non-matching URL', () => {
      const parsedRoute = parseRoute({
        method: 'GET',
        path: '/planets/{id}',
      });

      const params = extractPathParams('/users/123', parsedRoute);

      assert.strictEqual(params, null);
    });

    it('should decode URL-encoded parameters', () => {
      const parsedRoute = parseRoute({
        method: 'GET',
        path: '/planets/{id}',
      });

      const params = extractPathParams('/planets/hello%20world', parsedRoute);

      assert.deepStrictEqual(params, {
        id: 'hello world',
      });
    });
  });

  describe('matchesRoute', () => {
    it('should match correct method and path', () => {
      const parsedRoute = parseRoute({
        method: 'GET',
        path: '/planets/{id}',
      });

      const matches = matchesRoute('GET', '/planets/earth', parsedRoute);

      assert.strictEqual(matches, true);
    });

    it('should not match incorrect method', () => {
      const parsedRoute = parseRoute({
        method: 'GET',
        path: '/planets/{id}',
      });

      const matches = matchesRoute('POST', '/planets/earth', parsedRoute);

      assert.strictEqual(matches, false);
    });

    it('should not match incorrect path', () => {
      const parsedRoute = parseRoute({
        method: 'GET',
        path: '/planets/{id}',
      });

      const matches = matchesRoute('GET', '/users/123', parsedRoute);

      assert.strictEqual(matches, false);
    });

    it('should be case insensitive for methods', () => {
      const parsedRoute = parseRoute({
        method: 'GET',
        path: '/planets/{id}',
      });

      const matches = matchesRoute('get', '/planets/earth', parsedRoute);

      assert.strictEqual(matches, true);
    });
  });
});
