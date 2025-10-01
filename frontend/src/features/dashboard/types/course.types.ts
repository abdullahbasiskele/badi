export interface CourseListItem {
  id: string;
  title: string;
  subject: string;
  organizationId: string | null;
  organizationName: string | null;
  instructorId: string | null;
  instructorName: string | null;
  isArchived: boolean;
  published: boolean;
}
