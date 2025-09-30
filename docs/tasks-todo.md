# Badi Platformu Yapılacaklar Listesi

## 1. Monorepo Temel Kurulumu
- [x] Backend bağımlılıklarını yükle (NestJS projesi ve temel yapılandırma).
- [ ] Frontend projesi için başlangıç şablonunu oluştur (şu an yalnızca placeholder klasör).
- [ ] Ortak `.editorconfig`, `.nvmrc`, `.gitignore` dosyalarını kök seviyede oluştur/iyileştir.

## 2. Kimlik & Yetki
- [x] Yerel kimlik doğrulama (register/login + CQRS + JWT) akışını devreye al.
- [x] Refresh token deposu ve revoke politikasını Prisma üzerinden uygula.
- [ ] CASL politikalarını `application/policies` altında dökümante et; örnek kullanıcı/rol senaryolarını README/Docs’a ekle.
- [ ] SubjectScope kullanım rehberini UI/form koşullu gösterimleriyle ilişkilendir.

## 3. Veri ve Performans
- [x] Prisma şema taslağını tamamla ve ilk migration’ı oluştur (`20250930073220_init`).
- [x] Prisma şemasını tablo başına `.prisma` dosyalarına böl ve build script ile yönet.
- [x] Seed betiğiyle örnek veri (organization, roller, permissions, kullanıcılar, kurs) oluştur.
- [ ] CASL + PostgreSQL RLS performans PoC’i çalıştır; indeks ve sorgu planlarını dokümante et.
- [ ] Valkey/BullMQ kurulumunu yap ve temel publish-subscribe akışlarını doğrula.

## 4. Observability & Operasyon
- [ ] OpenTelemetry konfigürasyonunu oluştur (service name, trace exporter, log entegrasyonu).
- [ ] Observability dashboard ve alarm matrisi taslağını çıkar (mesai içi destek modeli).
- [ ] Retry/alert politikalarını BullMQ ve kimlik servisleri için belirle.

## 5. KVKK & Güvenlik
- [ ] Veri saklama matrisi hazırla; otomatik silme/bulanıklaştırma süreçlerini backlog’a ekle.
- [ ] Audit event şemasını tasarla ve domain event’lerle entegrasyonu planla.
- [ ] Gizli yönetimi için ortam bazlı konfigürasyon stratejisini belirle (Vault, KMS vb.).

## 6. Test Otomasyonu
- [ ] Feature bazlı unit/integration/contract test şablonlarını oluştur.
- [ ] CASL/RLS policy testlerini `tests/policies` altında otomatikleştir.
- [ ] CI pipeline taslağı hazırlayarak unit + integration + contract + policy testlerini sıralı çalıştır.

## 7. Dokümantasyon & İletişim
- [x] Prisma + auth veri modeli rehberlerini oluştur (`docs/prisma-guide.md`, `docs/auth-guide.md`).
- [ ] Mimari diyagramlar (context, container, component) ve README’yi güncel durumla senkronize et.
- [ ] Paydaşlarla paylaşılacak durum raporu şablonu oluştur.
