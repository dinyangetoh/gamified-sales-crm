import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @ApiProperty({ example: 'alice@demo.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'Demo1234!' })
  @IsString()
  @MinLength(6)
  password!: string
}
