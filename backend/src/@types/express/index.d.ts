import { AppAbility } from '../../shared/application/policies/ability.factory';
import { AuthUser } from '../../shared/application/policies/interfaces/auth-user.interface';

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
      ability?: AppAbility;
    }
  }
}
