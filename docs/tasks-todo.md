# Badi Platformu Yapılacaklar Listesi

## 1. Monorepo Temel Kurulumu
- [ ] Backend bağımlılıklarını yükle (`npm install` + NestJS yapılandırması).
- [ ] Frontend projesi için başlangıç şablonunu oluştur (boş klasör şu an placeholder).
- [ ] Ortak `.editorconfig`, `.nvmrc`, `.gitignore` dosyalarını ekle.

## 2. Kimlik & Yetki
- [ ] Passkey + Keycloak + e-Devlet oturum akışları için sıralı diyagramlar hazırla.
- [ ] Keycloak tema ve SPI gereksinimlerini çıkar; özelleştirme planını dokümante et.
- [ ] CASL politikalarını `application/policies` altında tanımla ve örnek kullanıcı/rol senaryolarını yaz.

## 3. Veri ve Performans
- [ ] CASL + RLS performans PoC’i çalıştır; indeks ve sorgu planlarını belgeye ekle.
- [ ] Prisma şema taslağını yaz ve ilk migration’ı oluştur.
- [ ] Valkey/BullMQ kurulumunu yap ve temel publish-subscribe akışlarını doğrula.

## 4. Observability & Operasyon
- [ ] OpenTelemetry konfigürasyonunu oluştur (service name, trace exporter, log entegrasyonu).
- [ ] Observability dashboard ve alarm matrisi taslağını çıkar (mesai içi destek modeli).
- [ ] Retry/alert politikalarını BullMQ ve Keycloak için belirle.

## 5. KVKK & Güvenlik
- [ ] Veri saklama matrisi hazırla; otomatik silme/bulanıklaştırma süreçlerini backlog’a ekle.
- [ ] Audit event şemasını tasarla ve domain event’lerle entegrasyonu planla.
- [ ] Gizli yönetimi için ortam bazlı konfigürasyon stratejisini belirle (Vault, KMS vb.).

## 6. Test Otomasyonu
- [ ] Feature bazlı unit/integration/contract test şablonlarını oluştur.
- [ ] CASL/RLS policy testlerini `tests/policies` altında otomatikleştir.
- [ ] CI pipeline taslağı hazırlayarak unit + integration + contract + policy testlerini sırala.

## 7. Dokümantasyon & İletişim
- [ ] Mimari diyagramları (context, container, component) güncelle.
- [ ] README ve mimari dokümanlara güncel görev durumlarını işle.
- [ ] Paydaşlarla paylaşılacak durum raporu şablonu oluştur.

