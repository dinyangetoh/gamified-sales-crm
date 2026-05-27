import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Queue } from 'bullmq'
import { Role } from '@db'
import { Roles } from '../decorators/roles'
import { QueueName } from './QueueName'

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.MANAGER)
@Controller('admin')
export class AdminController {
  constructor(
    @InjectQueue(QueueName.INGESTION) private readonly ingestionQueue: Queue,
    @InjectQueue(QueueName.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {}

  @Get('dead-letter')
  @ApiOperation({ summary: 'List failed jobs across all queues' })
  @ApiResponse({ status: 200 })
  async listDeadLetter() {
    const [ingestionFailed, notificationFailed] = await Promise.all([
      this.ingestionQueue.getFailed(0, 50),
      this.notificationQueue.getFailed(0, 50),
    ])

    const format = (queue: string, jobs: Awaited<ReturnType<Queue['getFailed']>>) =>
      jobs.map((j) => ({
        jobId: j.id,
        queue,
        name: j.name,
        data: j.data,
        failedReason: j.failedReason,
        attemptsMade: j.attemptsMade,
        timestamp: j.timestamp,
      }))

    return {
      jobs: [
        ...format(QueueName.INGESTION, ingestionFailed),
        ...format(QueueName.NOTIFICATION, notificationFailed),
      ],
    }
  }

  @Post('dead-letter/:jobId/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry a specific failed job' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async retryJob(@Param('jobId') jobId: string) {
    const queues = [this.ingestionQueue, this.notificationQueue]

    for (const queue of queues) {
      const job = await queue.getJob(jobId)
      if (job) {
        await job.retry()
        return { retried: true, jobId, queue: queue.name }
      }
    }

    return { retried: false, jobId, reason: 'Job not found' }
  }
}
