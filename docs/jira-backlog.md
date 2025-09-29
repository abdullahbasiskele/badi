# Badi Jira Backlog Taslağı

## Epics
- **BADI-EP1 – Kimlik ve Yetki Platformu**
  - Passkey, Keycloak broker, CASL/RLS entegrasyonu
- **BADI-EP2 – Kurs ve Kayıt Temeli**
  - Course/enrollment modelleri ve feature slice’ları
- **BADI-EP3 – Gözlemlenebilirlik ve Operasyon**
  - OpenTelemetry, dashboard, alarm süreçleri
- **BADI-EP4 – KVKK ve Güvenlik Sertleştirme**
  - Veri saklama, audit, gizli yönetimi
- **BADI-EP5 – Geliştirici Deneyimi ve CI/CD**
  - Test şablonları, pipeline, tooling

## Sprint 0 – Monorepo Hazırlığı (2 Hafta)
- **BADI-1 (EP5)** – Monorepo temel yapılarını tamamla (backend/front placeholder, ops/config) – _To Do_
- **BADI-2 (EP5)** – Ortak geliştirme kuralları ve `.editorconfig` ekle – _To Do_
- **BADI-3 (EP5)** – CI pipeline taslak dosyası oluştur – _To Do_

## Sprint 1 – Kimlik & Yetki Temeli (3 Hafta)
- **BADI-10 (EP1)** – Passkey + Keycloak + e-Devlet akış diyagramlarını hazırla – _To Do_
- **BADI-11 (EP1)** – Keycloak tema/SPI gereksinimleri ve özelleştirme planı – _To Do_
- **BADI-12 (EP1)** – CASL policy şablonlarını oluştur ve örnek testleri ekle – _To Do_
- **BADI-13 (EP1)** – Prisma şemasında kullanıcı/rol tablolarını tanımla – _To Do_

## Sprint 2 – Kurs & Veri Altyapısı (3 Hafta)
- **BADI-20 (EP2)** – Course/enrollment domain modellerini oluştur (entities, events) – _To Do_
- **BADI-21 (EP2)** – Lesson/teacher slice’ları için komut-sorgu iskeleti yaz – _To Do_
- **BADI-22 (EP2)** – Prisma migration ve seed scriptleri hazırla – _To Do_
- **BADI-23 (EP1)** – CASL + RLS PoC performans testini tamamla – _To Do_

## Sprint 3 – Observability & Operasyon (2 Hafta)
- **BADI-30 (EP3)** – OpenTelemetry konfigürasyon ve collector entegrasyonu – _To Do_
- **BADI-31 (EP3)** – Observability dashboard + alarm matrisini oluştur – _To Do_
- **BADI-32 (EP3)** – BullMQ için retry/alert politikası tanımla – _To Do_

## Sprint 4 – KVKK & Güvenlik (2 Hafta)
- **BADI-40 (EP4)** – Veri saklama matrisi ve otomatik silme iş akışı – _To Do_
- **BADI-41 (EP4)** – Audit event şeması + domain event entegrasyonu – _To Do_
- **BADI-42 (EP4)** – Gizli yönetimi stratejisi (Vault/KMS) uygulaması – _To Do_

## Sprint 5 – Test & DX Sertleştirmesi (2 Hafta)
- **BADI-50 (EP5)** – Unit/integration/contract test şablonlarını kodla – _To Do_
- **BADI-51 (EP5)** – CASL/RLS policy test otomasyonu – _To Do_
- **BADI-52 (EP5)** – CI pipeline’da test aşamalarını entegre et – _To Do_

## Backlog (Henüz Sprint Atanmamış)
- **BADI-60 (EP2)** – Frontend mimarisi ve modül planı çıkar
- **BADI-61 (EP2)** – Öğretmen performans raporları için API uçları
- **BADI-62 (EP3)** – Production readiness checklist (runbook, DR testleri)
- **BADI-63 (EP4)** – KVKK denetim raporu hazırlık dokümantasyonu

