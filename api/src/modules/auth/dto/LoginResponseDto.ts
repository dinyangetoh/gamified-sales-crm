import { ApiProperty } from '@nestjs/swagger'

export class LoginUserDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  email!: string

  @ApiProperty()
  role!: string
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string

  @ApiProperty({ type: LoginUserDto })
  user!: LoginUserDto
}


export type LoginResponse = InstanceType<typeof LoginResponseDto>