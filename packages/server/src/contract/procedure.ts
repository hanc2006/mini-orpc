import type { Procedure } from '../procedure'
import type { 
  RouteConfig, 
  StructuredInput, 
  StatusCodeOutputs, 
  ContractHandler,
  ParsedRoute,
  AnyContractHandler
} from './types'

/**
 * Contract procedure definition
 */
export interface ContractProcedureDef<
  TRoute extends RouteConfig,
  TInput extends StructuredInput,
  TOutput extends StatusCodeOutputs
> {
  route: ParsedRoute
  inputSchema: TInput
  outputSchemas: TOutput
  handler: ContractHandler<TRoute, TInput, TOutput>
}

/**
 * Contract procedure that represents an HTTP-aware procedure with routing and structured I/O
 */
export class ContractProcedure<
  TRoute extends RouteConfig,
  TInput extends StructuredInput,
  TOutput extends StatusCodeOutputs
> {
  /**
   * Contract procedure metadata
   */
  '~contract': ContractProcedureDef<TRoute, TInput, TOutput>

  constructor(def: ContractProcedureDef<TRoute, TInput, TOutput>) {
    this['~contract'] = def
  }

  /**
   * Convert this contract procedure to a regular Mini-ORPC procedure
   * This enables integration with existing middleware and router systems
   */
  toProcedure(): Procedure<any, any, any, any> {
    // This will be implemented in the integration phase
    throw new Error('toProcedure() not yet implemented')
  }

  /**
   * Generate an HTTP handler from this contract procedure
   * This enables serving REST APIs alongside RPC endpoints
   */
  toHttpHandler(): HttpHandler {
    // This will be implemented in the HTTP integration phase
    throw new Error('toHttpHandler() not yet implemented')
  }
}

/**
 * Any contract procedure type
 */
export type AnyContractProcedure = ContractProcedure<any, any, any>

/**
 * HTTP handler function signature
 */
export interface HttpHandler {
  (request: Request): Promise<Response>
}

/**
 * Type guard to check if an item is a contract procedure
 */
export function isContractProcedure(item: unknown): item is AnyContractProcedure {
  if (item instanceof ContractProcedure) {
    return true
  }

  return (
    (typeof item === 'object' || typeof item === 'function') &&
    item !== null &&
    '~contract' in item &&
    typeof item['~contract'] === 'object' &&
    item['~contract'] !== null &&
    'route' in item['~contract'] &&
    'inputSchema' in item['~contract'] &&
    'outputSchemas' in item['~contract'] &&
    'handler' in item['~contract']
  )
}