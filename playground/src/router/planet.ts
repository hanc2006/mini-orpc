import { ORPCError } from '@mini-orpc/server';
import * as z from 'zod';
import { retry } from '@/middlewares/retry';
import { authed, pub } from '../orpc';
import {
  NewPlanetSchema,
  PlanetSchema,
  UpdatePlanetSchema,
} from '../schemas/planet';

export const listPlanets = pub
  .use(retry({ times: 3 }))
  .input(
    z.object({
      limit: z.number().int().min(1).max(100).default(10),
      cursor: z.number().int().min(0).default(0),
    })
  )
  .output(z.array(PlanetSchema))
  .handler(async ({ input, context }) => {
    return context.db.planets.list(input.limit, input.cursor);
  });

export const createPlanet = authed
  .input(NewPlanetSchema)
  .output(PlanetSchema)
  .handler(async ({ input, context }) => {
    return context.db.planets.create(input, context.user);
  });

export const findPlanet = pub
  .use(retry({ times: 3 }))
  .input(
    z.object({
      id: z.number().int().min(1),
    })
  )
  .output(PlanetSchema)
  .handler(async ({ input, context }) => {
    const planet = await context.db.planets.find(input.id);

    if (!planet) {
      throw new ORPCError('NOT_FOUND', { message: 'Planet not found' });
    }

    return planet;
  });

export const updatePlanet = authed
  .input(UpdatePlanetSchema)
  .output(PlanetSchema)
  .handler(async ({ input, context }) => {
    const planet = await context.db.planets.find(input.id);

    if (!planet) {
      throw new ORPCError('NOT_FOUND', { message: 'Planet not found' });
    }

    return context.db.planets.update(input);
  });
