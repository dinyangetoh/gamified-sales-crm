import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Role } from '@db'
import { Roles } from '../../common/decorators/roles'
import { CurrentUser } from '../../common/decorators/currentUser'
import type { JwtPayload } from '../auth/JwtStrategy'
import { NotificationsService } from '../notifications/NotificationsService'
import { getEmailTemplateDisplayName } from '../../common/labels/emailTemplateLabels'
import { EMAIL_TEMPLATES, getEmailTemplateById, type EmailTemplateId } from '../notifications/emailTemplates'
import { EmailTemplateRegistryItemDto } from './dto/EmailTemplateRegistryItemDto'
import { SendTestEmailDto, SendTestEmailResponseDto } from './dto/SendTestEmailDto'

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.MANAGER)
@Controller('admin')
export class AdminEmailsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('emails/templates')
  @ApiOperation({ summary: 'Admin: email template registry metadata' })
  @ApiResponse({ status: 200, type: EmailTemplateRegistryItemDto, isArray: true })
  async listTemplates(): Promise<EmailTemplateRegistryItemDto[]> {
    return EMAIL_TEMPLATES.map((t) => ({
      templateId: t.templateId,
      templateDisplayName: getEmailTemplateDisplayName(t.templateId),
      role: t.role,
      status: t.status,
      trigger: t.trigger,
      defaultSubject: t.defaultSubject,
      resendTemplateId: t.resendTemplateId,
      resendLink: t.resendLink,
    })) as EmailTemplateRegistryItemDto[]
  }

  @Post('emails/:templateId/send-test')
  @ApiOperation({ summary: 'Admin: send test email for a template (POC templates supported)' })
  @ApiParam({ name: 'templateId', type: String })
  @ApiResponse({ status: 200, type: SendTestEmailResponseDto })
  @ApiResponse({ status: 400 })
  async sendTest(
    @Param('templateId') templateId: string,
    @Body() dto: SendTestEmailDto,
    @CurrentUser() actor: JwtPayload,
  ): Promise<SendTestEmailResponseDto> {
    const t = getEmailTemplateById(templateId as EmailTemplateId)
    if (!t) throw new BadRequestException('Unknown templateId')

    return this.notificationsService.sendTestEmail({
      templateId: t.templateId,
      toEmail: dto.toEmail,
      actorUserId: actor.sub,
      userId: dto.userId,
      week: dto.week,
    })
  }
}
