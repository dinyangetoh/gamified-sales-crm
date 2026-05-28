import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/UsersService'
import type { JwtPayload } from './JwtStrategy'
import { LoginResponse } from './dto/LoginResponseDto'
import { handleServiceError } from '../../common/errors/ServiceErrorHandler'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<LoginResponse> {
    try {
      const user = await this.usersService.findByEmail(email)
      if (!user) throw new UnauthorizedException('Invalid credentials')

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
      if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials')

      const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role }
      return {
        accessToken: this.jwtService.sign(payload),
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      }
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: AuthService.name,
        method: 'login',
        operation: 'authenticateUser',
        safeMessage: 'Authentication failed due to a system error.',
        metadata: { email },
      })
    }
  }
}
