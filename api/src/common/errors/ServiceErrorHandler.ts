import { HttpException, InternalServerErrorException, Logger } from '@nestjs/common'

export type ServiceErrorContext = {
  service: string
  method: string
  operation: string
  safeMessage: string
  metadata?: Record<string, unknown>
}

export function handleServiceError(
  logger: Logger,
  error: unknown,
  context: ServiceErrorContext,
): never {
  if (error instanceof HttpException) {
    throw error
  }

  logger.error(
    {
      service: context.service,
      method: context.method,
      operation: context.operation,
      metadata: context.metadata,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    context.safeMessage,
  )

  throw new InternalServerErrorException(context.safeMessage)
}
