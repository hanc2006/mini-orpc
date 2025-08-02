import type { SchemaIssue } from './types';

export interface ValidationErrorOptions extends ErrorOptions {
  message: string;
  issues: readonly SchemaIssue[];
}

export class ValidationError extends Error {
  readonly issues: readonly SchemaIssue[];

  constructor(options: ValidationErrorOptions) {
    super(options.message, options);

    this.issues = options.issues;
  }
}
