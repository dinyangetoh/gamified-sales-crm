import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@db'
import { ROLES_KEY } from '../decorators/roles'
import type { JwtPayload } from '../../modules/auth/JwtStrategy'
import type { Request } from 'express'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles || requiredRoles.length === 0) return true

    const req = context.switchToHttp().getRequest<Request & { user: JwtPayload }>()
    if (!req.user || !requiredRoles.includes(req.user.role)) {
      throw new ForbiddenException()
    }
    return true
  }
}
