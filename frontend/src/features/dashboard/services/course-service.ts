import { apiFetch } from "@/shared/services/http-client";
import type { CourseListItem } from "@/features/dashboard/types/course.types";

type ListCoursesOptions = {
  subject?: string | null;
};

export const courseService = {
  async list({ subject }: ListCoursesOptions = {}) {
    const search = subject ? `?subject=${encodeURIComponent(subject)}` : "";
    return apiFetch<CourseListItem[]>(`/courses${search}`);
  },
};
