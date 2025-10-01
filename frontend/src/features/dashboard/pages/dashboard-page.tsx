"use client";

import { useCallback, useEffect, useState } from "react";
import { MainLayout } from "@/components/templates/MainLayout";
import { RoleGuard } from "@/features/auth/components/role-guard";
import { SubjectScopeFilter } from "@/features/dashboard/components/subject-scope-filter";
import { courseService } from "@/features/dashboard/services/course-service";
import type { CourseListItem } from "@/features/dashboard/types/course.types";

export function DashboardPage() {
  const [selectedScope, setSelectedScope] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async (scope: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await courseService.list({ subject: scope ?? undefined });
      setCourses(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kurslar yüklenemedi";
      setError(message);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses(selectedScope);
  }, [loadCourses, selectedScope]);

  return (
    <RoleGuard>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Genel Bakış</h1>
            <p className="text-sm text-muted-foreground">
              Bu panel, oturum açan kullanıcılara genel durumu ve yakında eklenecek modül planlarını özetlemek için
              hazırlandı. Rolünüze göre menüden ilgili alana geçiş yapabilirsiniz.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">Kurs Görünümünü Daralt</h2>
                <p className="text-sm text-muted-foreground">
                  SubjectScope atamalarınız, hangi kurs kategorilerini güncelleyebileceğinizi belirler. Aşağıdaki filtre
                  seçiminize göre kurs listesini sınırlar.
                </p>
              </div>
              <SubjectScopeFilter value={selectedScope} onChange={setSelectedScope} />
              <div className="rounded-md border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
                {selectedScope
                  ? `Seçili konu: ${selectedScope}.`
                  : "Tüm konular seçili. SubjectScope filtresi uygulanmadığında, sahip olduğunuz yetki alanlarının tamamı gösterilir."}
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Kurs Listesi</h2>
              {loading ? (
                <span className="text-xs text-muted-foreground">Yükleniyor...</span>
              ) : null}
            </div>
            {error ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            {!error && courses.length === 0 && !loading ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Seçilen filtreye uygun kurs bulunamadı.
              </div>
            ) : null}
            {!error && courses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2">Başlık</th>
                      <th className="px-3 py-2">Konu</th>
                      <th className="px-3 py-2">Kurum</th>
                      <th className="px-3 py-2">Eğitmen</th>
                      <th className="px-3 py-2 text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {courses.map((course) => (
                      <tr key={course.id} className="hover:bg-muted/40">
                        <td className="px-3 py-2 font-medium text-foreground">{course.title}</td>
                        <td className="px-3 py-2 capitalize text-muted-foreground">{course.subject}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {course.organizationName ?? "-"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {course.instructorName ?? "Atanmadı"}
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {course.isArchived ? "Arşiv" : course.published ? "Yayında" : "Taslak"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      </MainLayout>
    </RoleGuard>
  );
}
