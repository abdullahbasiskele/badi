import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { Request } from 'express';
import { JwtAccessGuard } from '@features/auth/application/guards/jwt-access.guard';
import { AppAction } from '@shared/application/policies/ability.factory';
import { CheckAbility } from '@shared/application/policies/decorators/check-ability.decorator';
import { PoliciesGuard } from '@shared/application/policies/guards/policies.guard';
import { ListCoursesQuery } from '../../application/queries/list-courses/list-courses.query';
import { CourseListItemDto } from '../../application/dto/course-list-item.dto';

@Controller('courses')
@UseGuards(JwtAccessGuard, PoliciesGuard)
export class CourseController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @CheckAbility({ action: AppAction.Read, subject: 'Course' })
  async listCourses(
    @Req() request: Request,
    @Query('subject') subject?: string,
  ): Promise<CourseListItemDto[]> {
    const ability = request.ability;
    if (!ability) {
      throw new ForbiddenException('Kullanici yetkisi olusturulamadi.');
    }

    const normalizedSubject = subject?.trim() ?? null;

    return this.queryBus.execute(
      new ListCoursesQuery(ability, normalizedSubject || null),
    );
  }
}
