// src/utils/errorHandling.ts

export class ApplicationError extends Error {
  public readonly statusCode: number;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 500,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.context = context;
    this.name = "ApplicationError";
  }
}

export function handleApiError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApplicationError(error.message);
  }

  return new ApplicationError("An unexpected error occurred");
}
