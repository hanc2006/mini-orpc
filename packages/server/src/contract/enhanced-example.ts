import { z } from 'zod'
import { oc } from './builder'

// Example showing the enhanced type safety features

// 1. GET method - should NOT allow body
const getPlanetCorrect = oc
  .route({
    method: 'GET',
    path: '/planets/{id}',
    summary: 'Get a planet by ID'
  })
  .input({
    params: z.object({ id: z.string() }), // id inferred from path
    query: z.object({ 
      include: z.array(z.string()).optional() 
    }).optional()
    // body: z.object({}) // This should cause TypeScript error for GET
  })
  .output({
    200: z.object({ id: z.number(), name: z.string() }),
    404: z.object({ message: z.string() })
  })
  .handler(async ({ input }) => {
    // input.params.id is properly typed as string
    const planetId = parseInt(input.params.id)
    
    if (planetId === 1) {
      return {
        status: 200, // Must match one of the defined status codes
        data: { id: 1, name: 'Earth' } // Must match schema for status 200
      }
    }
    
    return {
      status: 404,
      data: { message: 'Planet not found' } // Must match schema for status 404
    }
    
    // This should cause TypeScript error:
    // return {
    //   status: 400, // 400 not defined in output schemas
    //   data: { id: 1, name: 'Earth' }
    // }
  })

// 2. POST method - should allow body
const createPlanetCorrect = oc
  .route({
    method: 'POST',
    path: '/planets',
    summary: 'Create a new planet'
  })
  .input({
    body: z.object({
      name: z.string(),
      type: z.enum(['terrestrial', 'gas-giant', 'ice-giant'])
    }),
    headers: z.object({
      'content-type': z.literal('application/json')
    }).optional()
  })
  .output({
    201: z.object({ id: z.number(), name: z.string(), type: z.string() }),
    400: z.object({ message: z.string(), errors: z.array(z.string()) })
  })
  .handler(async ({ input }) => {
    // input.body is properly typed
    if (!input.body.name || input.body.name.length < 2) {
      return {
        status: 400,
        data: {
          message: 'Validation failed',
          errors: ['Planet name must be at least 2 characters long']
        }
      }
    }

    const newPlanet = {
      id: Math.floor(Math.random() * 1000) + 1,
      name: input.body.name,
      type: input.body.type
    }

    return {
      status: 201,
      data: newPlanet
    }
  })

// 3. Path with multiple parameters
const getPlanetMoon = oc
  .route({
    method: 'GET',
    path: '/planets/{planetId}/moons/{moonId}',
    summary: 'Get a specific moon of a planet'
  })
  .input({
    params: z.object({ 
      planetId: z.string(), 
      moonId: z.string() 
    }) // Both planetId and moonId should be inferred from path
  })
  .output({
    200: z.object({ id: z.number(), name: z.string(), planetId: z.number() }),
    404: z.object({ message: z.string() })
  })
  .handler(async ({ input }) => {
    // Both parameters are properly typed
    const planetId = parseInt(input.params.planetId)
    const moonId = parseInt(input.params.moonId)
    
    return {
      status: 200,
      data: { id: moonId, name: 'Luna', planetId }
    }
  })

export { getPlanetCorrect, createPlanetCorrect, getPlanetMoon }