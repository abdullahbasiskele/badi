"use client";

import { MainLayout } from "@/components/templates/MainLayout";
import { RoleGuard } from "@/features/auth/components/role-guard";

export function TeacherPanelPage() {
  return (
    <RoleGuard allowedRoles={["teacher"]} fallbackPath="/dashboard">
      <MainLayout>
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">Öğretmen Çalışma Alanı</h1>
          <p className="text-muted-foreground">
            Ders planları, öğrenci listeleri ve konu bazlı SubjectScope ayarlarını burada toparlamayı hedefliyoruz. Şimdilik
            sayfayı, öğretmen rolüyle giriş yapan kullanıcıların doğru alana yönlendiğini test etmek için açıklayıcı bir
            placeholder olarak bırakıyoruz.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>Yaklaşan dersleri veya etkinlikleri gösterecek bileşenler için yer tutucular ekleyin.</li>
            <li>SubjectScope filtrelerinin UI karşılığını doğrulamak için açıklayıcı notlar bırakın.</li>
            <li>Test senaryolarında beklenen davranışı belgelemek üzere alt başlıklar kullanabilirsiniz.</li>
          </ul>
        </div>
      </MainLayout>
    </RoleGuard>
  );
}