import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { Request } from 'express';
import { subject } from '@casl/ability';
import { JwtAccessGuard } from '@features/auth/application/guards/jwt-access.guard';
import { CreateTeacherDto } from '../../application/dto/create-teacher.dto';
import { CreateTeacherResponseDto } from '../../application/dto/create-teacher-response.dto';
import { CreateTeacherCommand } from '../../application/commands/create-teacher/create-teacher.command';
import { AppAction } from '@shared/application/policies/ability.factory';
import { CheckAbility } from '@shared/application/policies/decorators/check-ability.decorator';
import { PoliciesGuard } from '@shared/application/policies/guards/policies.guard';

@Controller('teachers')
@UseGuards(JwtAccessGuard, PoliciesGuard)
export class TeacherController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CheckAbility({ action: AppAction.Manage, subject: 'User' })
  async createTeacher(
    @Body() dto: CreateTeacherDto,
    @Req() request: Request,
  ): Promise<CreateTeacherResponseDto> {
    const authUser = request.authUser;
    if (!authUser) {
      throw new UnauthorizedException('Kimlik doğrulaması başarısız.');
    }

    const ability = request.ability;
    const targetOrganizationId = dto.organizationId?.trim() || authUser.organizationId || null;

    const canManage = ability?.can(
      AppAction.Manage,
      subject('User', { organizationId: targetOrganizationId ?? undefined }) as any,
    );
    if (!canManage) {
      throw new ForbiddenException('Bu işlemi gerçekleştirme yetkiniz yok.');
    }

    return this.commandBus.execute(
      new CreateTeacherCommand(
        dto.email,
        dto.displayName,
        dto.subject,
        authUser,
        targetOrganizationId,
        dto.password,
      ),
    );
  }
}
