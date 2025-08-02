import type { ZodError, ZodType } from 'zod';

export type Schema<I, O = I> = ZodType<O>;

export type AnySchema = ZodType<any>;

export type SchemaIssue = ZodError['issues'][number];

export type InferSchemaInput<T extends AnySchema> = T['_input'];

export type InferSchemaOutput<T extends AnySchema> = T['_output'];

export type Context = Record<PropertyKey, any>;
