import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthService } from './AuthService'
import { LoginDto } from './dto/LoginDto'
import { Public } from '../../common/decorators/public'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtain JWT access token' })
  @ApiResponse({ status: 200, description: 'Returns JWT access token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password)
  }
}
