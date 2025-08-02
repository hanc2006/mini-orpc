import { z } from 'zod/v4';
import { oc } from './builder';

// Example schemas with proper optionality
const PlanetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(['terrestrial', 'gas-giant', 'ice-giant']),
  discoveredYear: z.number().optional(),
});

const CreatePlanetSchema = z.object({
  name: z.string(),
  type: z.enum(['terrestrial', 'gas-giant', 'ice-giant']),
  discoveredYear: z.number().optional(),
});

// Example contract procedures
export const getPlanet = oc
  .route({
    method: 'GET',
    path: '/planets/{id}',
    summary: 'Get a planet by ID',
    description: 'Retrieves detailed information about a specific planet',
  })
  .input({
    params: z.object({ id: z.string() }),
    query: z
      .object({
        include: z.array(z.string()).optional(),
      })
      .optional(),
  })
  .output({
    200: PlanetSchema,
    404: z.object({ message: z.string() }),
  })
  .handler(async ({ input }) => {
    const planetId = Number.parseInt(input.params.id, 2);

    if (planetId === 1) {
      return {
        status: 200,
        data: {
          id: 1,
          name: 'Earth',
          type: 'terrestrial' as const,
          discoveredYear: undefined,
        },
      };
    }

    return {
      status: 404,
      data: { message: 'Planet not found' },
    };
  });

export const createPlanet = oc
  .route({
    method: 'POST',
    path: '/planets',
    summary: 'Create a new planet',
  })
  .input({
    body: CreatePlanetSchema,
    headers: z
      .object({
        'content-type': z.literal('application/json'),
        'x-api-version': z.string().optional(),
      })
      .optional(),
  })
  .output({
    201: PlanetSchema,
    400: z.object({
      message: z.string(),
      errors: z.array(z.string()).optional(),
    }),
  })
  .handler(async ({ input }) => {
    // Simulate validation
    if (!input.body.name || input.body.name.length < 2) {
      return {
        status: 400,
        data: {
          message: 'Validation failed',
          errors: ['Planet name must be at least 2 characters long'],
        },
      };
    }

    // Simulate creation
    const newPlanet = {
      id: Math.floor(Math.random() * 1000) + 1,
      ...input.body,
    };

    return {
      status: 201,
      data: newPlanet,
    };
  });

export const listPlanets = oc
  .route({
    method: 'GET',
    path: '/planets',
    summary: 'List all planets',
  })
  .input({
    query: z
      .object({
        limit: z.number().min(1).max(100).default(10).optional(),
        offset: z.number().min(0).default(0).optional(),
        type: z.enum(['terrestrial', 'gas-giant', 'ice-giant']).optional(),
      })
      .optional(),
  })
  .output({
    200: z.object({
      planets: z.array(PlanetSchema),
      total: z.number(),
      hasMore: z.boolean(),
    }),
  })
  .handler(async ({ input }) => {
    const query = input.query || {};
    const limit = query.limit || 10;
    const offset = query.offset || 0;

    // Mock data
    const allPlanets = [
      { id: 1, name: 'Earth', type: 'terrestrial' as const },
      { id: 2, name: 'Jupiter', type: 'gas-giant' as const },
      { id: 3, name: 'Neptune', type: 'ice-giant' as const },
    ];

    const filteredPlanets = query.type
      ? allPlanets.filter((p) => p.type === query.type)
      : allPlanets;

    const paginatedPlanets = filteredPlanets.slice(offset, offset + limit);

    return {
      status: 200,
      data: {
        planets: paginatedPlanets,
        total: filteredPlanets.length,
        hasMore: offset + limit < filteredPlanets.length,
      },
    };
  });

// Example contract router
export const planetRouter = {
  getPlanet,
  createPlanet,
  listPlanets,
};
