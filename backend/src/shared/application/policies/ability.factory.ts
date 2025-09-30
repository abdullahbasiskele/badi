import { Injectable } from '@nestjs/common';
import { AbilityBuilder, AbilityClass } from '@casl/ability';
import { PrismaAbility, createPrismaAbility } from '@casl/prisma';
import { Prisma } from '@prisma/client';
import { AuthUser } from './interfaces/auth-user.interface';

export enum AppAction {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

type Subjects = 'Course' | 'Enrollment' | 'Lesson' | 'User' | 'all';
export type AppSubjects = Subjects;
export type AppAbility = PrismaAbility<[AppAction, Subjects]>;

const AbilityCtor = createPrismaAbility as unknown as AbilityClass<AppAbility>;

@Injectable()
export class AbilityFactory {
  createForUser(user?: AuthUser | null): AppAbility {
    const detectSubjectType = (item: any) => item?.__caslSubjectType__ ?? 'all';
    const { can, build } = new AbilityBuilder<AppAbility>(AbilityCtor);

    const allowCourse = (conditions: Prisma.CourseWhereInput) =>
      can(AppAction.Read, 'Course', conditions as any);

    if (!user) {
      allowCourse({ isArchived: false });
      return build({ detectSubjectType });
    }

    const roles = user.roles ?? [];
    const subjectScopes = user.subjectScopes ?? [];

    if (roles.includes('system-admin')) {
      can(AppAction.Manage, 'all');
      return build({ detectSubjectType });
    }

    if (roles.includes('organization-admin')) {
      can(AppAction.Manage, 'Course', { organizationId: user.organizationId ?? undefined } as any);
      can(
        AppAction.Manage,
        'Lesson',
        { course: { organizationId: user.organizationId ?? undefined } } as any,
      );
      can(AppAction.Read, 'User', { organizationId: user.organizationId ?? undefined } as any);
    }

    if (roles.includes('teacher')) {
      can(AppAction.Update, 'Course', { instructorId: user.id } as any);
      can(AppAction.Delete, 'Course', { instructorId: user.id } as any);
      can(AppAction.Manage, 'Lesson', { instructorId: user.id } as any);

      if (subjectScopes.length > 0) {
        allowCourse({ subject: { in: subjectScopes }, isArchived: false });
      }
    }

    if (subjectScopes.length > 0) {
      allowCourse({ subject: { in: subjectScopes }, isArchived: false });
    } else {
      allowCourse({ isArchived: false });
    }

    return build({ detectSubjectType });
  }
}
