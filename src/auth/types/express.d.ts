import { CurrentUserData } from './current-user.interface';

declare global {
  namespace Express {
    interface Request {
      user?: CurrentUserData;
    }
  }
}
