import { ApiProperty } from '@nestjs/swagger'

export class EventTypeOptionDto {
  @ApiProperty()
  value!: string

  @ApiProperty()
  displayName!: string

  @ApiProperty()
  shortName!: string
}
