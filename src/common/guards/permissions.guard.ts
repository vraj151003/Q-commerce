// src/common/guards/permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) return true;

    const ctx = context.getArgByIndex(2);
    const user = ctx.req.user;

    const userPermissions = user.permissions || [];

    return requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );
  }
}