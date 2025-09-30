import { Prisma, PrismaClient, RoleKey, LessonDeliveryMode, EnrollmentStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

type RoleMap = Record<RoleKey, string>;

type SeededUsers = {
  systemAdmin: { id: string };
  organizationAdmin: { id: string };
  teacher: { id: string };
  participant: { id: string };
};

async function clearDatabase() {
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.subjectScope.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

async function seedOrganization() {
  return prisma.organization.create({
    data: {
      name: 'Badi Belediyesi Akademi',
      description: 'Belediye bünyesinde vatandaşlara açık eğitim platformu',
    },
  });
}

async function seedRoles(): Promise<RoleMap> {
  const definitions = [
    { key: RoleKey.SYSTEM_ADMIN, name: 'Sistem Yöneticisi' },
    { key: RoleKey.ORGANIZATION_ADMIN, name: 'Kurum Yöneticisi' },
    { key: RoleKey.TEACHER, name: 'Öğretmen' },
    { key: RoleKey.PARTICIPANT, name: 'Katılımcı' },
  ];

  const roles = await Promise.all(
    definitions.map(definition => prisma.role.create({ data: definition })),
  );

  return roles.reduce<RoleMap>((acc, role) => {
    acc[role.key] = role.id;
    return acc;
  }, {
    [RoleKey.SYSTEM_ADMIN]: '',
    [RoleKey.ORGANIZATION_ADMIN]: '',
    [RoleKey.TEACHER]: '',
    [RoleKey.PARTICIPANT]: '',
  } as RoleMap);
}

async function seedPermissions() {
  const permissions = [
    { code: 'course.manage', subject: 'Course', actions: ['create', 'update', 'delete'] },
    { code: 'course.view', subject: 'Course', actions: ['read'] },
    { code: 'lesson.manage', subject: 'Lesson', actions: ['create', 'update', 'delete'] },
    { code: 'lesson.view', subject: 'Lesson', actions: ['read'] },
    { code: 'user.view', subject: 'User', actions: ['read'] },
  ];

  await prisma.permission.createMany({ data: permissions });
}

async function attachPermissions(roleMap: RoleMap) {
  const permissions = await prisma.permission.findMany({ select: { id: true, code: true } });
  const codeToId = new Map(permissions.map(p => [p.code, p.id] as const));

  const attach = async (roleKey: RoleKey, codes: string[]) => {
    for (const code of codes) {
      const permissionId = codeToId.get(code);
      if (!permissionId) continue;
      await prisma.rolePermission.create({
        data: {
          role: { connect: { id: roleMap[roleKey] } },
          permission: { connect: { id: permissionId } },
        },
      });
    }
  };

  await attach(RoleKey.SYSTEM_ADMIN, Array.from(codeToId.keys()));
  await attach(RoleKey.ORGANIZATION_ADMIN, ['course.manage', 'lesson.manage', 'user.view']);
  await attach(RoleKey.TEACHER, ['course.view', 'lesson.manage']);
  await attach(RoleKey.PARTICIPANT, ['course.view', 'lesson.view']);
}

async function seedUsers(organizationId: string, roleMap: RoleMap): Promise<SeededUsers> {
  const hashedPassword = await argon2.hash('Password123!', { type: argon2.argon2id });

  const [systemAdmin, organizationAdmin, teacher, participant] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@badi.local',
        displayName: 'Sistem Admini',
        passwordHash: hashedPassword,
        roles: { create: [{ role: { connect: { id: roleMap[RoleKey.SYSTEM_ADMIN] } } }] },
      },
    }),
    prisma.user.create({
      data: {
        email: 'yonetici@badi.local',
        displayName: 'Kurum Yöneticisi',
        passwordHash: hashedPassword,
        organization: { connect: { id: organizationId } },
        roles: { create: [{ role: { connect: { id: roleMap[RoleKey.ORGANIZATION_ADMIN] } } }] },
      },
    }),
    prisma.user.create({
      data: {
        email: 'muzik-ogretmen@badi.local',
        displayName: 'Müzik Öğretmeni',
        passwordHash: hashedPassword,
        organization: { connect: { id: organizationId } },
        subjectScopes: { create: [{ subject: 'music' }] },
        roles: { create: [{ role: { connect: { id: roleMap[RoleKey.TEACHER] } } }] },
      },
    }),
    prisma.user.create({
      data: {
        email: 'katilimci@badi.local',
        displayName: 'Kurs Katılımcısı',
        passwordHash: hashedPassword,
        organization: { connect: { id: organizationId } },
        roles: { create: [{ role: { connect: { id: roleMap[RoleKey.PARTICIPANT] } } }] },
      },
    }),
  ]);

  return { systemAdmin, organizationAdmin, teacher, participant };
}

async function seedCourse(orgId: string, teacherId: string, participantId: string) {
  await prisma.course.create({
    data: {
      title: 'Müzik Teorisi 101',
      subject: 'music',
      capacity: 25,
      organization: { connect: { id: orgId } },
      instructor: { connect: { id: teacherId } },
      metadata: { level: 'Beginner', durationWeeks: 6 } as Prisma.JsonObject,
      lessons: {
        create: [
          {
            startAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            endAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
            deliveryMode: LessonDeliveryMode.REMOTE,
            meetingUrl: 'https://meet.badi.local/music101',
          },
        ],
      },
      enrollments: {
        create: [
          {
            status: EnrollmentStatus.APPROVED,
            user: { connect: { id: participantId } },
          },
        ],
      },
    },
  });
}

async function main() {
  console.info('Seeding database...');
  await clearDatabase();

  const organization = await seedOrganization();
  const roleMap = await seedRoles();
  await seedPermissions();
  await attachPermissions(roleMap);
  const users = await seedUsers(organization.id, roleMap);
  await seedCourse(organization.id, users.teacher.id, users.participant.id);

  console.info('Seed completed successfully.');
}

main()
  .catch(error => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


