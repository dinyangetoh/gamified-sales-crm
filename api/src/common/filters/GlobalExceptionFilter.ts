import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { Prisma } from '@db'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const req = ctx.getRequest<Request>()

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const body = exception.getResponse()
      res.status(status).json(this.normalizeHttpExceptionResponse(body, status, req))
      return
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        res.status(HttpStatus.OK).json({
          accepted: true,
          duplicate: true,
          pointsAwarded: 0,
          reason: 'Duplicate eventId — already processed',
        })
        return
      }

      if (exception.code === 'P2025') {
        res
          .status(HttpStatus.NOT_FOUND)
          .json(this.buildErrorResponse(HttpStatus.NOT_FOUND, 'Not Found', 'Record not found', req))
        return
      }
    }

    this.logger.error({ err: exception, path: req.url }, 'Unhandled exception')

    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(
        this.buildErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Internal Server Error',
          'Internal server error',
          req,
        ),
      )
  }

  private normalizeHttpExceptionResponse(
    body: string | object,
    status: number,
    req: Request,
  ): {
    statusCode: number
    error: string
    message: string | string[]
    timestamp: string
    path: string
    requestId?: string
    details?: Record<string, unknown>
  } {
    const defaultError = this.defaultErrorLabel(status)

    if (typeof body === 'string') {
      return this.buildErrorResponse(status, defaultError, body, req)
    }

    const responseBody = body as Record<string, unknown>
    const message = this.extractMessage(responseBody.message)
    const error =
      typeof responseBody.error === 'string' && responseBody.error.trim().length > 0
        ? responseBody.error
        : defaultError

    const details =
      responseBody.details && typeof responseBody.details === 'object'
        ? (responseBody.details as Record<string, unknown>)
        : undefined

    return this.buildErrorResponse(status, error, message, req, details)
  }

  private extractMessage(value: unknown): string | string[] {
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      return value
    }
    if (typeof value === 'string') {
      return value
    }
    return 'Unexpected error'
  }

  private buildErrorResponse(
    statusCode: number,
    error: string,
    message: string | string[],
    req: Request,
    details?: Record<string, unknown>,
  ) {
    const requestId = req.headers['x-request-id']
    const requestIdValue = typeof requestId === 'string' ? requestId : undefined

    return {
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: req.url,
      ...(requestIdValue ? { requestId: requestIdValue } : {}),
      ...(details ? { details } : {}),
    }
  }

  private defaultErrorLabel(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request'
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized'
      case HttpStatus.FORBIDDEN:
        return 'Forbidden'
      case HttpStatus.NOT_FOUND:
        return 'Not Found'
      default:
        return 'Error'
    }
  }
}
