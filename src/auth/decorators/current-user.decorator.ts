import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUserData } from '../types/current-user.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
