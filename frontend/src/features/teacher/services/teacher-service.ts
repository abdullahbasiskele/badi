import { apiPost } from "@/shared/services/http-client";
import type { CreateTeacherPayload, TeacherSummary } from "@/features/teacher/types/teacher.types";

export const teacherService = {
  async createTeacher(payload: CreateTeacherPayload) {
    return apiPost<TeacherSummary>("/teachers", payload);
  },
};
