import { UserRole } from '../../../generated/prisma';

export interface CurrentUserData {
  sub: string; // ID пользователя
  email: string;
  role: UserRole;
  iat?: number; // issued at
  exp?: number; // expires at
}
