"use client";

import { MainLayout } from "@/components/templates/MainLayout";
import { RoleGuard } from "@/features/auth/components/role-guard";
import { CreateTeacherForm } from "@/features/teacher/components/create-teacher-form";

export function AdminPanelPage() {
  return (
    <RoleGuard allowedRoles={["system-admin", "organization-admin"]} fallbackPath="/dashboard">
      <MainLayout>
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <CreateTeacherForm />

          <aside className="space-y-4 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">Yönetici Notları</h2>
            <p>
              Bu panel yönetici ve kurum yöneticilerinin öğretmen kadrosunu genişletmesi için hazırlandı. Branş seçimi
              otomatik olarak SubjectScope kaydını oluşturur ve öğretmenlerin panelde göreceği kurslar ilgili branşla
              sınırlandırılır.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Kurumsal yöneticiler yalnızca kendi kurumlarına öğretmen ekleyebilir.</li>
              <li>Sistem yöneticileri farklı kurum ID''leri belirterek merkezi atamalar yapabilir.</li>
              <li>Geçici şifre paylaşımı sonrası öğretmenlerin ilk girişte şifre değiştirmesi önerilir.</li>
            </ul>
          </aside>
        </div>
      </MainLayout>
    </RoleGuard>
  );
}
