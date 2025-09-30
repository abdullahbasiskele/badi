import { Prisma } from '@prisma/client';

export type AuthUserWithRelations = Prisma.UserGetPayload<{
  include: {
    roles: { include: { role: true } };
    subjectScopes: true;
    organization: true;
  };
}>;
