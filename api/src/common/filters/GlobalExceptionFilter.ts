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
      res.status(status).json(body)
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
        res.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          timestamp: new Date().toISOString(),
          path: req.url,
        })
        return
      }
    }

    this.logger.error({ err: exception, path: req.url }, 'Unhandled exception')

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      path: req.url,
    })
  }
}
