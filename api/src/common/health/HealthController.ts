import { Controller, Get, Inject } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus'
import Redis from 'ioredis'
import { Public } from '../../common/decorators/public'
import { PrismaService } from '../prisma/PrismaService'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness check — Postgres + Redis' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 503 })
  check() {
    return this.health.check([
      () => this.prismaIndicator.pingCheck('postgres', this.prisma),
      async () => {
        await this.redis.ping()
        return { redis: { status: 'up' } }
      },
    ])
  }
}
