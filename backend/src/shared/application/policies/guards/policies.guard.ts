import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Prisma } from '@prisma/client';
import { Request } from 'express';
import { AbilityFactory, AppAbility, AppSubjects } from '../ability.factory';
import { CHECK_ABILITY_KEY } from '../decorators/check-ability.decorator';
import { AuthUser } from '../interfaces/auth-user.interface';
import { RequiredAbility } from '../interfaces/required-ability.interface';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requirements = this.reflector.getAllAndOverride<RequiredAbility[]>(
      CHECK_ABILITY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requirements || requirements.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authUser: AuthUser | undefined =
      request.authUser ?? (request.user as AuthUser | undefined);

    const ability = this.abilityFactory.createForUser(authUser);
    request.ability = ability;

    return requirements.every((requirement) =>
      this.hasAbility(ability, requirement),
    );
  }

  private hasAbility(
    ability: AppAbility,
    requirement: RequiredAbility,
  ): boolean {
    const { action, subject, conditions } = requirement;

    if (!conditions) {
      return ability.can(action, subject);
    }

    const typedConditions = this.mapConditions(subject, conditions);
    if (!typedConditions) {
      return ability.can(action, subject);
    }

    // Pass Prisma filters into CASL runtime; typings expose only the field overload, hence the cast.
    return ability.can(action, subject, typedConditions as never);
  }

  private mapConditions(
    subject: AppSubjects,
    conditions: Record<string, unknown>,
  ):
    | Prisma.CourseWhereInput
    | Prisma.EnrollmentWhereInput
    | Prisma.LessonWhereInput
    | Prisma.UserWhereInput
    | undefined {
    switch (subject) {
      case 'Course':
        return conditions as Prisma.CourseWhereInput;
      case 'Enrollment':
        return conditions as Prisma.EnrollmentWhereInput;
      case 'Lesson':
        return conditions as Prisma.LessonWhereInput;
      case 'User':
        return conditions as Prisma.UserWhereInput;
      default:
        return undefined;
    }
  }
}
