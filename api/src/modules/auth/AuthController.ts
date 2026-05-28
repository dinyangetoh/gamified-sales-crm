import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiInternalServerErrorResponse, ApiOperation, ApiResponse, ApiUnauthorizedResponse, ApiTags } from '@nestjs/swagger'
import { AuthService } from './AuthService'
import { LoginDto } from './dto/LoginDto'
import { LoginResponseDto } from './dto/LoginResponseDto'
import { Public } from '../../common/decorators/public'
import { ErrorResponseDto } from '../../common/dto/ErrorResponseDto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtain JWT access token' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials', type: ErrorResponseDto })
  @ApiInternalServerErrorResponse({ type: ErrorResponseDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password)
  }
}
