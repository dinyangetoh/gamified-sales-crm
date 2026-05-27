import { ApiProperty } from '@nestjs/swagger'

export class LevelConfigDto {
  @ApiProperty()
  level!: number

  @ApiProperty()
  minXP!: number

  @ApiProperty()
  label!: string
}

