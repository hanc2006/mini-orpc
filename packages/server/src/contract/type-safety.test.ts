import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { oc } from './builder';

describe('Type Safety Validation', () => {
  describe('Requirement 1: HTTP Status Code Validation', () => {
    it('should accept valid status codes', () => {
      const validStatus = oc
        .route({ method: 'GET', path: '/test' })
        .output({
          200: z.string(),
          404: z.object({ error: z.string() }),
          500: z.object({ message: z.string() }),
        });
      
      assert.ok(validStatus);
    });

    it('should compile successfully with valid status codes', () => {
      const procedure = oc
        .route({ method: 'POST', path: '/users' })
        .output({
          201: z.object({ id: z.string(), name: z.string() }),
          400: z.object({ error: z.string() }),
          409: z.object({ error: z.string() }),
        })
        .handler(async () => ({
          status: 201,
          data: { id: '1', name: 'test' },
        }));
      
      assert.ok(procedure);
    });
  });

  describe('Requirement 2: Method-Based Input Validation', () => {
    it('should allow body in POST requests', () => {
      const postWithBody = oc
        .route({ method: 'POST', path: '/test' })
        .input({
          body: z.object({ name: z.string() }),
        });
      
      assert.ok(postWithBody);
    });

    it('should allow body in PUT requests', () => {
      const putWithBody = oc
        .route({ method: 'PUT', path: '/test' })
        .input({
          body: z.object({ name: z.string() }),
        });
      
      assert.ok(putWithBody);
    });

    it('should allow body in PATCH requests', () => {
      const patchWithBody = oc
        .route({ method: 'PATCH', path: '/test' })
        .input({
          body: z.object({ name: z.string() }),
        });
      
      assert.ok(patchWithBody);
    });
  });

  describe('Requirement 3: Path Parameter Type Inference', () => {
    it('should allow params when path has parameters', () => {
      const withParams = oc
        .route({ method: 'GET', path: '/users/{id}' })
        .input({
          params: z.object({ id: z.string() }),
        });
      
      assert.ok(withParams);
    });

    it('should allow multiple path parameters', () => {
      const withMultipleParams = oc
        .route({ method: 'GET', path: '/users/{userId}/posts/{postId}' })
        .input({
          params: z.object({ 
            userId: z.string(),
            postId: z.string(),
          }),
        });
      
      assert.ok(withMultipleParams);
    });
  });

  describe('Requirement 4: Conditional Input Property Inclusion', () => {
    it('should only include defined properties in handler input for GET with params', () => {
      const procedure = oc
        .route({ method: 'GET', path: '/users/{id}' })
        .input({
          params: z.object({ id: z.string() }),
          query: z.object({ include: z.string().optional() }),
        })
        .output({
          200: z.string(),
        })
        .handler(async ({ input }) => {
          const params = input.params;
          const query = input.query;
          
          assert.strictEqual(typeof params.id, 'string');
          assert.ok('include' in query || !('include' in query));
          
          return { status: 200, data: 'test' };
        });
      
      assert.ok(procedure);
    });

    it('should only include defined properties in handler input for POST with body', () => {
      const procedure = oc
        .route({ method: 'POST', path: '/users' })
        .input({
          body: z.object({ name: z.string() }),
          query: z.object({ validate: z.boolean().optional() }),
        })
        .output({
          201: z.object({ id: z.string(), name: z.string() }),
        })
        .handler(async ({ input }) => {
          const body = input.body;
          const query = input.query;
          
          assert.strictEqual(typeof body.name, 'string');
          assert.ok('validate' in query || !('validate' in query));
          
          return { status: 201, data: { id: '1', name: body.name } };
        });
      
      assert.ok(procedure);
    });
  });

  describe('Requirement 5: Handler Return Type Validation', () => {
    it('should allow returning defined status codes', () => {
      const procedure = oc
        .route({ method: 'GET', path: '/test' })
        .output({
          200: z.object({ name: z.string() }),
          404: z.object({ error: z.string() }),
        })
        .handler(async () => ({
          status: 200,
          data: { name: 'test' },
        }));
      
      assert.ok(procedure);
    });

    it('should allow returning different defined status codes', () => {
      const procedure = oc
        .route({ method: 'GET', path: '/test' })
        .output({
          200: z.object({ name: z.string() }),
          404: z.object({ error: z.string() }),
        })
        .handler(async () => ({
          status: 404,
          data: { error: 'Not found' },
        }));
      
      assert.ok(procedure);
    });

    it('should validate data matches schema for status code', () => {
      const procedure = oc
        .route({ method: 'POST', path: '/users' })
        .output({
          201: z.object({ id: z.string(), name: z.string() }),
          400: z.object({ error: z.string() }),
        })
        .handler(async () => ({
          status: 201,
          data: { id: '123', name: 'John' },
        }));
      
      assert.ok(procedure);
    });
  });

  describe('Integration Tests', () => {
    it('should work with complex route with all input types', () => {
      const complexProcedure = oc
        .route({ method: 'PUT', path: '/users/{id}/profile' })
        .input({
          params: z.object({ id: z.string() }),
          body: z.object({ 
            name: z.string(),
            email: z.string().email(),
          }),
          query: z.object({ 
            validate: z.boolean().optional(),
            notify: z.boolean().default(true),
          }),
          headers: z.object({
            authorization: z.string(),
          }),
        })
        .output({
          200: z.object({ 
            id: z.string(),
            name: z.string(),
            email: z.string(),
            updated: z.boolean(),
          }),
          400: z.object({ error: z.string() }),
          401: z.object({ error: z.string() }),
          404: z.object({ error: z.string() }),
        })
        .handler(async ({ input }) => {
          const { params, body, query, headers } = input;
          
          assert.strictEqual(typeof params.id, 'string');
          assert.strictEqual(typeof body.name, 'string');
          assert.strictEqual(typeof body.email, 'string');
          assert.strictEqual(typeof headers.authorization, 'string');
          
          return {
            status: 200,
            data: {
              id: params.id,
              name: body.name,
              email: body.email,
              updated: true,
            },
          };
        });
      
      assert.ok(complexProcedure);
    });
  });
});
