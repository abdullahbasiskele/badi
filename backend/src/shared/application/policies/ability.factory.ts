import { Injectable } from '@nestjs/common';
import { AbilityBuilder } from '@casl/ability';
import { PrismaAbility, createPrismaAbility } from '@casl/prisma';
import type { Prisma } from '@prisma/client';
import { AuthUser } from './interfaces/auth-user.interface';

export enum AppAction {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

type Subjects = Prisma.ModelName | 'all';
export type AppSubjects = Subjects;
export type AppAbility = PrismaAbility<[AppAction, Subjects]>;
type DetectableSubject = { __caslSubjectType__?: Subjects } | undefined;
const defaultCourseFilter: Prisma.CourseWhereInput = { isArchived: false };

@Injectable()
export class AbilityFactory {
  createForUser(user?: AuthUser | null): AppAbility {
    const detectSubjectType = (item: DetectableSubject): Subjects =>
      item?.__caslSubjectType__ ?? 'all';

    const { can, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

    const addRule = <T>(action: AppAction, subject: Subjects, filters: T) => {
      // CASL's Prisma typings omit the condition overload, but runtime accepts Prisma filters.
      can(action, subject, filters as never);
    };

    const allowCourse = (conditions: Prisma.CourseWhereInput) => {
      addRule(AppAction.Read, 'Course', conditions);
    };

    if (!user) {
      allowCourse(defaultCourseFilter);
      return build({ detectSubjectType });
    }

    const roles = user.roles ?? [];
    const subjectScopes = user.subjectScopes ?? [];

    if (roles.includes('system-admin')) {
      can(AppAction.Manage, 'all');
      return build({ detectSubjectType });
    }

    if (roles.includes('organization-admin')) {
      const organizationId = user.organizationId ?? undefined;
      const courseConditions: Prisma.CourseWhereInput = { organizationId };
      const lessonConditions: Prisma.LessonWhereInput = {
        course: { organizationId },
      };
      const userConditions: Prisma.UserWhereInput = { organizationId };
      const auditLogConditions: Prisma.HttpRequestLogWhereInput = { organizationId };

      addRule(AppAction.Manage, 'Course', courseConditions);
      addRule(AppAction.Manage, 'Lesson', lessonConditions);
      addRule(AppAction.Manage, 'HttpRequestLog', auditLogConditions);
      addRule(AppAction.Read, 'User', userConditions);
      addRule(AppAction.Manage, 'User', userConditions);
      addRule(AppAction.Create, 'User', userConditions);
      addRule(AppAction.Update, 'User', userConditions);
    }

    if (roles.includes('teacher')) {
      const courseByInstructor: Prisma.CourseWhereInput = {
        instructorId: user.id,
      };
      const lessonByInstructor: Prisma.LessonWhereInput = {
        instructorId: user.id,
      };

      addRule(AppAction.Update, 'Course', courseByInstructor);
      addRule(AppAction.Delete, 'Course', courseByInstructor);
      addRule(AppAction.Manage, 'Lesson', lessonByInstructor);

      if (subjectScopes.length > 0) {
        const scopedCourses: Prisma.CourseWhereInput = {
          subject: { in: subjectScopes },
          isArchived: false,
        };
        allowCourse(scopedCourses);
      }
    }

    if (subjectScopes.length > 0) {
      const scopedCourses: Prisma.CourseWhereInput = {
        subject: { in: subjectScopes },
        isArchived: false,
      };
      allowCourse(scopedCourses);
    } else {
      allowCourse(defaultCourseFilter);
    }

    return build({ detectSubjectType });
  }
}



