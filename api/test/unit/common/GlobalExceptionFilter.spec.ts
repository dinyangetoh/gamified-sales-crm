import { ArgumentsHost, BadRequestException, HttpException, HttpStatus } from '@nestjs/common'
import { Prisma } from '@db'
import { GlobalExceptionFilter } from '../../../src/common/filters/GlobalExceptionFilter'

function createHost(url = '/test') {
  const status = jest.fn().mockReturnThis()
  const json = jest.fn()
  const req = { url, headers: {} } as any
  const res = { status, json } as any
  const host: ArgumentsHost = {
    switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
  } as ArgumentsHost
  return { host, res, req, status, json }
}

function createPrismaKnownError(code: string) {
  const error = Object.create(Prisma.PrismaClientKnownRequestError.prototype) as Prisma.PrismaClientKnownRequestError
  ;(error as any).code = code
  return error
}

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter()

  it('normalizes HttpException object payloads', () => {
    const { host, status, json } = createHost('/users/abc')
    const exception = new BadRequestException({ message: ['invalid email'], error: 'Bad Request' })

    filter.catch(exception, host)

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        message: ['invalid email'],
        path: '/users/abc',
      }),
    )
  })

  it('normalizes HttpException string payloads', () => {
    const { host, status, json } = createHost('/auth/login')
    const exception = new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED)

    filter.catch(exception, host)

    expect(status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid credentials',
        path: '/auth/login',
      }),
    )
  })

  it('returns normalized not found payload for Prisma P2025', () => {
    const { host, status, json } = createHost('/events')
    const exception = createPrismaKnownError('P2025')

    filter.catch(exception, host)

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        error: 'Not Found',
        message: 'Record not found',
      }),
    )
  })

  it('returns 500 envelope for unknown errors', () => {
    const { host, status, json } = createHost('/leaderboard')

    filter.catch(new Error('boom'), host)

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Internal server error',
        path: '/leaderboard',
      }),
    )
  })
})
