export interface ClientOptions {
  signal?: AbortSignal;
}

export type ClientRest<TInput> = undefined extends TInput
  ? [input?: TInput, options?: ClientOptions]
  : [input: TInput, options?: ClientOptions];

export interface Client<TInput, TOutput> {
  (...rest: ClientRest<TInput>): Promise<TOutput>;
}

export type NestedClient = Client<any, any> | { [k: string]: NestedClient };
