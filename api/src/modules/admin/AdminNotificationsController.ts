import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Role } from '@db'
import { Roles } from '../../common/decorators/roles'
import { NotificationsService } from '../notifications/NotificationsService'
import { NotificationLogResponseDto } from './dto/NotificationLogResponseDto'

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.MANAGER)
@Controller('admin')
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('notifications')
  @ApiOperation({ summary: 'Admin: notification send history with optional filtering' })
  @ApiQuery({ name: 'type', required: false, description: 'Notification type (e.g. BADGE_UNLOCK)' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date (inclusive)' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date (inclusive)' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({ status: 200, type: NotificationLogResponseDto })
  @ApiResponse({ status: 403 })
  async listNotifications(
    @Query('type') type?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset = 0,
  ): Promise<NotificationLogResponseDto> {
    const fromDate = from ? new Date(from) : undefined
    const toDate = to ? new Date(to) : undefined

    const res = await this.notificationsService.listNotificationLogs({
      type,
      from: fromDate,
      to: toDate,
      limit,
      offset,
    })

    return {
      ...res,
      items: res.items.map((i: any) => ({
        ...i,
        metadata: i.metadata ?? undefined,
      })),
    } as NotificationLogResponseDto
  }
}
