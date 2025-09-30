import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from '../ability.factory';
import { CHECK_ABILITY_KEY } from '../decorators/check-ability.decorator';
import { RequiredAbility } from '../interfaces/required-ability.interface';
import { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly abilityFactory: AbilityFactory) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirements = this.reflector.getAllAndOverride<RequiredAbility[]>(CHECK_ABILITY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requirements || requirements.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = (request.authUser ?? request.user) as AuthUser | undefined;
    const ability = this.abilityFactory.createForUser(user);
    request.ability = ability;

    return requirements.every(requirement =>
      ability.can(requirement.action, requirement.subject, requirement.conditions as any),
    );
  }
}
