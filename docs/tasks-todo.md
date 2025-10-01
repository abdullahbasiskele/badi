# Badi Platformu Yapilacaklar Listesi

## 1. Monorepo ve Tooling
- [x] Backend bagimliliklarini kurulumu (NestJS, Prisma, Jest).
- [x] Frontend (Next.js 15) temel auth sayfalari ve atomic UI hiyerarsisi.
- [ ] `frontend/.env.local.example` dosyasini backend ortam degiskenleri ile senkronize et.
- [ ] `frontend/README.md` talimatlarini projeye ozelles tir.
- [ ] `.editorconfig` ve kod stili belgelerini repo kokune ekle.

## 2. Kimlik ve Yetki (Backend)
- [x] Register/Login/Refresh akislari icin CQRS komutlarini hazirla.
- [x] Refresh token deposu ve revoke politikasini uygula.
- [x] CASL policy altyapisini AbilityFactory ile merkezi hale getir.
- [x] SubjectScope verisini UI ya tasiyarak filtreler icin kullan.
- [x] CASL guard ve @CheckAbility dekoratorunu controller lara bagla.
- [x] Auth handler ve servisleri icin unit + integration testleri yaz.
- [x] Audit log slice i ekle ve RecordAuthActivityCommand ile auth olaylarini kaydet.
- [ ] `features/user` komut ve sorgularini repository + UoW altyapisina tasima.

## 3. Frontend ve UX
- [x] Login/Register/Dashboard sayfalari ve toast bildirimleri.
- [x] `apiFetch` icin otomatik refresh akisi ve Authorization header.
- [x] Logout islemini `/auth/logout` endpointi ile senkronize et.
- [x] RoleGuard ve yetkisiz yonlendirme mekanizmasi.
- [x] Rol bazli panel placeholder lari.
- [x] Guard bileþenleri icin RTL + MSW testleri.
- [ ] UTF 8 karakter temizligi icin kalan metinleri gozden gecir.

## 4. Veri ve Performans
- [x] Prisma semasini tablo bazinda bol ve build script ile yonet.
- [x] Ilk migration (`20250930073220_init`) ve seed betigi.
- [x] Audit log tablosu iceren migration (`add_http_request_logs`).
- [ ] Audit migration ini calistirmak icin local PostgreSQL ortamini sagla.
- [ ] CASL + RLS performans PoC ve indeks dokumani.
- [ ] Valkey/BullMQ kurulumu ve monitoring plan.
- [ ] Enrollment slice i repository + UoW altyapisina uyarlama.

## 5. Observability ve Operasyon
- [ ] OpenTelemetry collector, exporter ve service adlandirmasi.
- [ ] Dashboard ve alarm matrisi (mesai ici destek modeli).
- [ ] BullMQ retry/alert politikasi ve kuyruk sagligi metric leri.
- [ ] API ve frontend icin health-check / readiness endpoint dokumantasyonu.

## 6. KVKK ve Guvenlik
- [ ] Veri saklama matrisi ve otomatik silme/bulaniklastirma akislari.
- [x] Audit log retention komutu (DeleteOldHttpLogsCommand) ve env parametreleri.
- [ ] Gizli yonetimi (Vault/KMS) stratejisi.
- [ ] Seed verilerindeki parola ve sir politikalari icin yazili prosedur.

## 7. Test Otomasyonu ve CI
- [ ] Feature bazli unit/integration/contract test sablonu.
- [ ] CASL/RLS policy regression testleri (`tests/policies`).
- [ ] CI pipeline da unit + integration + contract + policy test siralamasini kur.
- [ ] Frontend lint/test (ESLint, Playwright) adimlarini pipeline a ekle.

## 8. Dokumantasyon ve Iletisim
- [x] Prisma ve auth veri modeli rehberleri (`docs/prisma-guide.md`, `docs/auth-guide.md`).
- [x] Audit log mimarisini dokumante et (`docs/main.md`, `docs/final-architecture-review.md`).
- [ ] Mimari diyagramlari guncelle (context, container, component).
- [ ] Paydas durum raporu sablonu olustur.
- [ ] Frontend VSA + Atomic rehberini yeni kararlarla senkronize tut.
