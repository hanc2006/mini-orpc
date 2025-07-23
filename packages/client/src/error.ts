import {
  isObject,
  type MaybeOptionalOptions,
  resolveMaybeOptionalOptions,
} from '@orpc/shared';

export type ORPCErrorJSON<TCode extends string, TData> = Pick<
  ORPCError<TCode, TData>,
  'code' | 'status' | 'message' | 'data'
>;

export type ORPCErrorOptions<TData> = ErrorOptions & {
  status?: number;
  message?: string;
} & (undefined extends TData ? { data?: TData } : { data: TData });

export class ORPCError<TCode extends string, TData> extends Error {
  readonly code: TCode;
  readonly status: number;
  readonly data: TData;

  constructor(
    code: TCode,
    ...rest: MaybeOptionalOptions<ORPCErrorOptions<TData>>
  ) {
    const options = resolveMaybeOptionalOptions(rest);

    if (options?.status && !isORPCErrorStatus(options.status)) {
      throw new Error('[ORPCError] Invalid error status code.');
    }

    super(options.message, options);

    this.code = code;
    this.status = options.status ?? 500; // Default to 500 if not provided
    this.data = options.data as TData; // data only optional when TData is undefinable so can safely cast here
  }

  toJSON(): ORPCErrorJSON<TCode, TData> {
    return {
      code: this.code,
      status: this.status,
      message: this.message,
      data: this.data,
    };
  }
}

export function isORPCErrorStatus(status: number): boolean {
  return status < 200 || status >= 400;
}

export function isORPCErrorJson(
  json: unknown
): json is ORPCErrorJSON<string, unknown> {
  if (!isObject(json)) {
    return false;
  }

  const validKeys = ['code', 'status', 'message', 'data'];
  if (Object.keys(json).some((k) => !validKeys.includes(k))) {
    return false;
  }

  return (
    'code' in json &&
    typeof json.code === 'string' &&
    'status' in json &&
    typeof json.status === 'number' &&
    isORPCErrorStatus(json.status) &&
    'message' in json &&
    typeof json.message === 'string'
  );
}
