import type { HttpMethod } from './http-types';
import { ContractProcedure } from './procedure';
import { parseRoute } from './route-parser';
import type {
  ContractHandler,
  ParsedRoute,
  RouteConfig,
  StatusCodeOutputs,
  StructuredInput,
  ValidateStatusCodeKeys,
} from './types';

/**
 * Builder definition for contract procedures
 */
export interface ContractBuilderDef<
  TRoute extends RouteConfig<any, any>,
  TInput extends StructuredInput<any, any>,
  TOutput extends StatusCodeOutputs,
> {
  route?: ParsedRoute;
  inputSchema?: TInput;
  outputSchemas?: ValidateStatusCodeKeys<TOutput>;
}

/**
 * Contract builder for creating HTTP-aware procedures with fluent API
 */
export class ContractBuilder<
  TRoute extends RouteConfig<any, any>,
  TInput extends StructuredInput<any, any>,
  TOutput extends StatusCodeOutputs,
> {
  /**
   * Holds the builder configuration
   */
  '~contract': ContractBuilderDef<TRoute, TInput, TOutput>;

  constructor(def: ContractBuilderDef<TRoute, TInput, TOutput>) {
    this['~contract'] = def;
  }

  /**
   * Sets the HTTP route configuration
   */
  route<TMethod extends HttpMethod, TPath extends string>(
    config: RouteConfig<TMethod, TPath>
  ): ContractBuilder<
    RouteConfig<TMethod, TPath>,
    StructuredInput<TMethod, TPath>,
    TOutput
  > {
    const parsedRoute = parseRoute(config);

    return new ContractBuilder({
      ...this['~contract'],
      route: parsedRoute,
    });
  }

  /**
   * Sets the structured input schema
   * Type-safe based on the route method and path
   */
  input<TStructuredInput extends TInput>(
    schema: TStructuredInput
  ): ContractBuilder<TRoute, TStructuredInput, TOutput> {
    return new ContractBuilder({
      ...this['~contract'],
      inputSchema: schema,
    });
  }

  /**
   * Sets the status code output schemas
   */
  output<TStatusOutputs extends StatusCodeOutputs>(
    schemas: ValidateStatusCodeKeys<TStatusOutputs>
  ): ContractBuilder<TRoute, TInput, TStatusOutputs> {
    return new ContractBuilder({
      ...this['~contract'],
      outputSchemas: schemas,
    });
  }

  /**
   * Defines the contract handler and creates the final contract procedure
   */
  handler<THandler extends ContractHandler<TRoute, TInput, TOutput>>(
    handler: THandler
  ): ContractProcedure<TRoute, TInput, TOutput> {
    if (!this['~contract'].route) {
      throw new Error(
        'Route configuration is required before defining handler'
      );
    }

    return new ContractProcedure({
      route: this['~contract'].route,
      inputSchema: this['~contract'].inputSchema || ({} as TInput),
      outputSchemas: this['~contract'].outputSchemas || ({} as TOutput),
      handler,
    });
  }
}

/**
 * Initial contract builder instance
 */
export const oc = new ContractBuilder<
  RouteConfig<HttpMethod, string>,
  StructuredInput<HttpMethod, string>,
  StatusCodeOutputs
>({});
