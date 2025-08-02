import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { oc } from './builder';
import { isContractProcedure } from './procedure';

describe('Contract Builder', () => {
  describe('fluent API', () => {
    it('should build a basic contract procedure', () => {
      const procedure = oc
        .route({
          method: 'GET',
          path: '/planets/{id}',
          summary: 'Get planet by ID',
        })
        .input({
          params: z.object({ id: z.string() }),
        })
        .output({
          200: z.object({ name: z.string() }),
        })
        .handler(async ({ input }) => ({
          status: 200,
          data: { name: 'Earth' },
        }));

      assert.strictEqual(isContractProcedure(procedure), true);
      assert.strictEqual(procedure['~contract'].route.method, 'GET');
      assert.strictEqual(
        procedure['~contract'].route.pathPattern,
        '/planets/([^/]+)'
      );
      assert.deepStrictEqual(procedure['~contract'].route.pathParams, ['id']);
      assert.strictEqual(
        procedure['~contract'].route.summary,
        'Get planet by ID'
      );
    });

    it('should throw error when handler is called without route', () => {
      assert.throws(() => {
        (oc as any).handler(async () => ({ status: 200, data: 'test' }));
      }, /Route configuration is required/);
    });

    it('should allow chaining in different orders', () => {
      const procedure1 = oc
        .route({ method: 'POST', path: '/planets' })
        .input({ body: z.object({ name: z.string() }) })
        .output({ 201: z.object({ id: z.number(), name: z.string() }) })
        .handler(async () => ({ status: 201, data: { id: 1, name: 'Earth' } }));

      const procedure2 = oc
        .input({ body: z.object({ name: z.string() }) })
        .route({ method: 'POST', path: '/planets' })
        .output({ 201: z.object({ id: z.number(), name: z.string() }) })
        .handler(async () => ({ status: 201, data: { id: 1, name: 'Earth' } }));

      assert.strictEqual(isContractProcedure(procedure1), true);
      assert.strictEqual(isContractProcedure(procedure2), true);
    });
  });
});
