export interface CreateTeacherPayload {
  email: string;
  displayName: string;
  subject: string;
  password?: string;
  organizationId?: string;
}

export interface TeacherSummary {
  id: string;
  email: string;
  displayName: string | null;
  subject: string;
  organizationId: string | null;
  temporaryPassword?: string | null;
}
