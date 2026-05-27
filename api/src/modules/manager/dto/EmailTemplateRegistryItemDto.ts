import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'
import type { EmailTemplateRole, EmailTemplateStatus, EmailTemplateId } from '../../notifications/emailTemplates'

const roleValues: EmailTemplateRole[] = ['rep', 'manager']
const statusValues: EmailTemplateStatus[] = ['poc', 'mvp']
const templateIdValues: EmailTemplateId[] = [
  'BADGE_UNLOCK',
  'STREAK_RISK',
  'LEVEL_UP',
  'STREAK_BROKEN',
  'NEAR_BADGE',
  'WEEKLY_REP_DIGEST',
  'END_OF_WEEK_PUSH',
  'TOP_OF_WEEK_AWARD',
  'WEEKLY_MGR_DIGEST',
]

export class EmailTemplateRegistryItemDto {
  @ApiProperty()
  @IsString()
  @IsIn(templateIdValues)
  templateId!: EmailTemplateId

  @ApiProperty()
  @IsIn(roleValues)
  role!: EmailTemplateRole

  @ApiProperty()
  @IsIn(statusValues)
  status!: EmailTemplateStatus

  @ApiProperty()
  @IsString()
  trigger!: string

  @ApiProperty()
  @IsString()
  defaultSubject!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resendTemplateId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resendLink?: string
}

