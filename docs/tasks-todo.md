# Badi Platformu Yapılacaklar Listesi

## 1. Monorepo & Tooling
- [x] Backend bağımlılıklarını yükle (NestJS projesi ve temel yapılandırma).
- [x] Frontend (Next.js 15) temel auth sayfalarını ve atomic UI hiyerarşisini oluştur.
- [ ] `frontend/.env.local.example` ve ENV dokümantasyonunu backend `.env.example` ile senkronize et.
- [ ] `frontend/README.md` dosyasını projeye özel talimatlarla güncelle.

## 2. Kimlik & Yetki (Backend)
- [x] Yerel kimlik doğrulama (register/login + CQRS + JWT) akışını devreye al.
- [x] Refresh token deposu ve revoke politikasını Prisma üzerinden uygula.
- [x] CASL politikalarını `application/policies` altında dökümante et; örnek kullanıcı/rol senaryolarını README/Docs''a ekle.
- [x] SubjectScope verisini UI katmanına taşıyıp (örn. kurs filtreleri/formları) görünür hale getir.
- [x] CASL guard ve `@CheckAbility` dekoratörünü gerçek feature controller''larına entegre et; örnek endpoint yayımla.
- [x] Auth komutları ve servisleri için unit ile integration testlerini yaz.

## 3. Frontend & UX
- [x] Next.js uygulamasında login/register/dashboard sayfalarını ve toast bildirimlerini hazırla.
- [x] Tüm Türkçe içerik, validasyon mesajları ve hata metinlerinde UTF-8 karakter sorunlarını gider.
- [x] `apiFetch` isteklerine access token taşıyan Authorization başlığını ekle.
- [x] Refresh token rotasyonu ve 401 yakalama/yenileme akışını uygula.
- [x] Logout işlemini backend `/auth/logout` endpointini entegre ederek store temizliğini tamamla.
- [x] Yetkisiz kullanıcıyı `/login`''e yönlendirecek guard yapısını oluştur; oturumlu kullanıcıyı rolüne göre uygun sayfaya taşı.
- [x] Rol bazlı panel sayfalarını (yönetici, öğretmen, katılımcı) açıklayıcı placeholder içeriklerle yayınla.
- [x] `MainLayout` gezinme öğelerini gerçek sayfalarla eşle veya geliştirilmemiş bağlantıları kaldır.
- [x] Guard bileşeni ve yönlendirme akışı için UI/integration testlerini (React Testing Library + MSW) kurgula.
- [x] Tailwind tema/token rehberini `docs/` altında paylaş ve atomic katmanlarla ilişkilendir.

## 4. Veri ve Performans
- [x] Prisma şema taslağını tamamla ve ilk migration''ı oluştur (`20250930073220_init`).
- [x] Prisma şemasını tablo başına `.prisma` dosyalarına böl ve build script ile yönet.
- [x] Seed betiğiyle örnek veri (organization, roller, permissions, kullanıcılar, kurs) oluştur.
- [ ] CASL + PostgreSQL RLS performans PoC''i çalıştır; indeks ve sorgu planlarını dökümante et.
- [ ] Valkey/BullMQ kurulumunu yap ve temel publish-subscribe akışlarını doğrula.
- [ ] Kurs/enrollment domain event akışlarını uygulayıp event-store stratejisini belirle.

## 5. Observability & Operasyon
- [ ] OpenTelemetry konfigürasyonunu oluştur (service name, trace exporter, log entegrasyonu).
- [ ] Observability dashboard ve alarm matrisi taslağını çıkar (mesai içi destek modeli).
- [ ] Retry/alert politikalarını BullMQ ve kimlik servisleri için belirle.
- [ ] API ve frontend için health-check ile readiness endpoint''lerini dökümante et.

## 6. KVKK & Güvenlik
- [ ] Veri saklama matrisi hazırla; otomatik silme/bulanıklaştırma süreçlerini backlog''a ekle.
- [ ] Audit event şemasını tasarla ve domain event''lerle entegrasyonu planla.
- [ ] Gizli yönetimi için ortam bazlı konfigürasyon stratejisini belirle (Vault, KMS vb.).
- [ ] Seed verisindeki parola ve sırları yalnızca yerel geliştirme amacıyla sınırlandıracak politika oluştur.

## 7. Test Otomasyonu & CI
- [ ] Feature bazlı unit/integration/contract test şablonlarını oluştur.
- [ ] CASL/RLS policy testlerini `tests/policies` altında otomatikleştir.
- [ ] CI pipeline taslağı hazırlayarak unit + integration + contract + policy testlerini sıralı çalıştır.
- [ ] Frontend lint/test (ESLint, Playwright) entegrasyonunu pipeline''a ekle.

## 8. Dokümantasyon & İletişim
- [x] Prisma + auth veri modeli rehberlerini oluştur (`docs/prisma-guide.md`, `docs/auth-guide.md`).
- [ ] Mimari diyagramlar (context, container, component) ve README''yi güncel durumla senkronize et.
- [ ] Paydaşlarla paylaşılacak durum raporu şablonu oluştur.
- [ ] Frontend kullanım senaryoları ve UI karar kayıtlarını `docs/vsa_atomic_frontend_structure.md` ile ilişkilendirerek güncelle.
