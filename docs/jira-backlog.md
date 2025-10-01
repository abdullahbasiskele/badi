# Badi Jira Backlog Taslagi

## Epics
- **BADI-EP1 - Kimlik ve Yetki Platformu**: Passkey, Keycloak broker, CASL/RLS entegrasyonu.
- **BADI-EP2 - Kurs ve Kayit Temeli**: Course, enrollment, teacher slice lari.
- **BADI-EP3 - Gozlemlenebilirlik ve Operasyon**: OpenTelemetry, audit, queue/isler.
- **BADI-EP4 - KVKK ve Guvenlik Sertlestirme**: Veri saklama, gizli yonetimi, denetim.
- **BADI-EP5 - Gelistirici Deneyimi ve CI/CD**: Test sablonlari, pipeline, tooling.

Durum kodlari: **To Do**, **In Progress**, **Done**.

## Sprint 0 - Monorepo Hazirligi (2 Hafta)
- **BADI-1 (EP5)** Monorepo temel klasorlerini olustur (backend/frontend) - Done
- **BADI-2 (EP5)** Ortak gelistirme kurallari ve `.editorconfig` ekle - To Do
- **BADI-3 (EP5)** CI pipeline taslak dosyasi olustur - In Progress (workflow ciktisi var, kontrol tamamlanmadi)

## Sprint 1 - Kimlik ve Yetki Temeli (3 Hafta)
- **BADI-10 (EP1)** Passkey + Keycloak + e Devlet akislari dokumante et - To Do
- **BADI-11 (EP1)** Keycloak tema/SPI gereksinimleri planla - To Do
- **BADI-12 (EP1)** CASL policy sablonlarini olustur ve test ornekleri ekle - In Progress (AbilityFactory guncel, testler acik)
- **BADI-13 (EP1)** Prisma semasinda user/role tablolarini tanimla - Done

## Sprint 2 - Kurs ve Veri Altyapisi (3 Hafta)
- **BADI-20 (EP2)** Course/enrollment domain modellerini yaz - Done
- **BADI-21 (EP2)** Lesson/teacher slice CQRS iskeletini tamamla - Done
- **BADI-22 (EP2)** Prisma migration ve seed scriptlerini guncelle - In Progress (audit log migration eklendi, uygulanmasi bekliyor)
- **BADI-23 (EP1)** CASL + RLS performans PoC calistir - In Progress (audit tablosu icin RLS aktif, benchmark eksik)

## Sprint 3 - Observability ve Operasyon (2 Hafta)
- **BADI-30 (EP3)** OpenTelemetry collector entegrasyonunu tamamla - To Do
- **BADI-31 (EP3)** Dashboard ve alarm matrisini hazirla - To Do
- **BADI-32 (EP3)** BullMQ retry/alert politikasini tanimla - In Progress (AuditTrailService queue fallback hazir, prod konfig bekleniyor)

## Sprint 4 - KVKK ve Guvenlik (2 Hafta)
- **BADI-40 (EP4)** Veri saklama matrisi ve otomatik silme akisini olustur - To Do
- **BADI-41 (EP4)** Audit event semasi + domain event entegrasyonu - Done (audit-log slice tamamlandi)
- **BADI-42 (EP4)** Gizli yonetimi stratejisini belirle (Vault/KMS) - To Do

## Sprint 5 - Test ve DX Sertlestirmesi (2 Hafta)
- **BADI-50 (EP5)** Unit/integration/contract test sablonlari olustur - In Progress (audit factory testi eklendi)
- **BADI-51 (EP5)** CASL/RLS policy test otomasyonu - To Do
- **BADI-52 (EP5)** CI pipeline a test adimlarini ekle - In Progress

## Backlog (Sprint Atanmamis)
- **BADI-60 (EP2)** Frontend mimarisi ve moduller icin kapsam dokumani hazirla
- **BADI-61 (EP2)** Ogretmen performans raporlari API tasarimini yap
- **BADI-62 (EP3)** Production readiness checklist (runbook, DR testleri)
- **BADI-63 (EP4)** KVKK denetim raporu hazirlik dokumani
- **BADI-64 (EP3)** Audit log raporlama dashboard u tasarla
