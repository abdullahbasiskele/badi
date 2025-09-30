import { AppAction, AppSubjects } from '../ability.factory';

export interface RequiredAbility {
  action: AppAction;
  subject: AppSubjects;
  conditions?: Record<string, unknown>;
}
