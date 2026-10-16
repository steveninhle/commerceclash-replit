import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class UserIsSelfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.user?.id;
    const paramId = request.params?.id || request.params?.studentId || request.params?.sid;

    if (userId !== paramId) {
      throw new ForbiddenException({
        success: false,
        message: 'You are not authorized to access this resource.',
      });
    }

    return true;
  }
}
