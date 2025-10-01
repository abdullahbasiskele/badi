# Kurs Platformu – Mimari Doküman (2025 Revizyonu)

> **Kapsam:** Bu doküman, *mikroservis* yerine **monolith** dağıtım modelini hedefler. Vertical Slice Architecture (VSA) + CQRS/Mediator yaklaşımı korunur; veri katmanında **Repository** ve **Unit of Work (UoW)** desenleri kullanılır. Kimlik, yetkilendirme, gözlemlenebilirlik, audit, cache ve kuyruk gibi kesitsel yetenekler **infrastructure** katmanında merkezîdir. Bu revizyon, önceki mimari kararları koruyup 2025’e uygun hale getirir.

---

## 1) Proje Özeti

- **Amaç:** Vatandaşa yönelik web tabanlı **kurs alma‑verme** platformu.
- **Roller:** Öğretmen, katılımcı, kurum yöneticisi, sistem yöneticisi.
- **Görünürlük kuralı:** Örneğin **müzik öğretmeni**, sadece **Müzik** konulu kurs ve kayıtları görür ve işlem yapabilir.
- **Kimlik:** E‑posta/şifreye ek **Passkey (WebAuthn)** ve **e‑Devlet** ile giriş.
- **Yetki:** **CASL** tabanlı şartlı (ABAC) yetkilendirme, kritik tablolarda **PostgreSQL Row Level Security (RLS)** ile ikinci savunma hattı.

---

## 2) Mimari Model (Monolith + VSA + CQRS/Mediator)

- **VSA:** Her özellik dilimi (“feature slice”) kendi controller/DTO/komut/sorgu/validator/repository sınırına sahiptir. Dilimler arası bağımlılık minimum tutulur.
- **CQRS:** Komut (yazma) ve sorgu (okuma) yolları ayrılır; **Mediator** üzerinden yönlendirilir.
- **Pipeline davranışları (sıra):** Doğrulama → Yetkilendirme (CASL) → Idempotency (yalnız komutlar) → Transaction (UoW) → Önbellek (yalnız sorgular) → Audit → Gözlemlenebilirlik → Hata eşleme.
> **Durum Notu (2025-Q4):** NestJS `CqrsModule` henüz `AppModule` seviyesinde devreye alınmadı; komut/sorgu boru hattının doğrulama, transaction ve logging adımları planlama aşamasında.
- **Transaction sınırı:** Komut akışlarında tek işlem; sorgularda yalnız okuma ve önbellek.

---

## 3) Teknoloji Yığını (Hedef Sürümler – 2025)

- **Çalışma zamanı ve çerçeve:** Node.js **22 LTS**, NestJS **11.x** (Express v5 veya Fastify).
- **Veritabanı ve ORM:** PostgreSQL **18** (en az 17), Prisma **6.x**.
- **Cache:** **Valkey** (Redis alternatifi, drop‑in) veya Redis 7+.
- **Kuyruk/işler:** BullMQ (Valkey/Redis) **veya** PostgreSQL tabanlı pg‑boss / Graphile Worker.
- **SSO/Broker:** **Keycloak** (OIDC/SAML) – e‑Devlet, Azure Entra, Google vb. IdP’ler için tek arayüz.
- **Yetkilendirme:** **CASL v6** + **@casl/prisma**.
- **Observability:** **OpenTelemetry (OTLP)**; Collector + Jaeger/Tempo uyumlu.
- **API sözleşmesi:** **OpenAPI 3.2**; CI’da **Spectral** ile lint/kalite kapıları.

---

## 4) Kimlik Doğrulama ve Federasyon (e‑Devlet dâhil)

- **Yerel akışlar:** Passkey (WebAuthn) birincil, e‑posta/şifre ikincil. 2FA yerine passkey önerilir.
- **Broker mimarisi:** Keycloak üzerinden OIDC/SAML IdP bağlantıları; e‑Devlet entegrasyonu broker aracılığıyla yönetilir.
- **Token politikaları:** Erişim belirteci kısa ömür; yenileme belirteci HTTP‑Only cookie; yenileme döndürme (rotation), cihaz bağlama (binding), JTI ve siyah liste (revoke) yönetimi.
- **Oturum güvenliği:** Issuer/audience kontrolü, PKCE (public clients), IP/cihaz değişiminde risk skoru.

---

## 5) Yetkilendirme ve Veri İzolasyonu

- **CASL ile ABAC:** Eylem + Nesne + Koşul modeli. Örnek kapsam: “course.category = Müzik” ve “enrollment.instructorId = Me”.
- **@casl/prisma:** CASL koşulları otomatik olarak Prisma filtrelerine çevrilir; repository katmanında sorgulara enjekte edilir.
- **RLS (veri katmanı):** Course, Enrollment, Participant gibi kritik tablolarda satır düzeyinde politika. CASL’a ek **ikinci koruma**.
- **Performans notları:** Kapsam alanları için indeksleme (subject_id, instructor_id, organization_id). Koşullu join’lerde sorgu sadeleştirme ve read‑model optimizasyonları.

---

## 6) Etki Alanı (Domain) ve Veri Modeli – Mantıksal

- **User:** kimlik bilgileri, iletişim, durum; subject_set ve varsa organization_set.
- **Role/Permission:** CASL için referans; rol devredilebilir yetkiler.
- **Subject/Category:** örn. Müzik, Yazılım, Dil; hiyerarşi desteklenebilir.
- **Course:** başlık, açıklama, subject, eğitmen(ler), kapasite, program, durum, kurum bağı.
- **Enrollment:** kullanıcı ↔ kurs; durum (başvuru, onay, iptal, tamamlandı), zaman damgaları.
- **Schedule/Session:** oturum tarih/saat bilgileri, konum/online bağlantılar.
- **Organization (opsiyonel):** çok kurumluluk izolasyonu ve yetki kapsamı.
- **KVKK dikkati:** PII alanları ayrıştırılır; saklama süresi ve anonimleştirme/silme akışları tanımlıdır.

---

## 7) Veri Erişimi – Repository & Unit of Work

- **UoW amacı:** Bir istek içinde birden fazla aggregate değişimini tek transaction altında yönetmek; tutarlılık ve atomiklik.
- **Repository yaklaşımı:** Her dilimde özelleşmiş repository; ortak işlemler için infrastructure’da base soyutlamalar.
- **Transaction uygulaması:** Komutlar tek bir transaction bağlamında çalışır (Prisma `$transaction` callback modeli). Sorgular transaction kullanmaz; önbellek odaklıdır.
- **Idempotency:** Dışarıdan tekrar gönderilen komutlar için idempotency anahtarı ve deduplikasyon.

---

## 8) API Tasarımı

- **Sözleşme:** OpenAPI 3.2; contract‑first yaklaşım.
- **Standartlar:** Versiyonlama (ör. v1), hata gövdesi (problem‑details), tutarlı sayfalama/filtreleme/sıralama sözleşmeleri.
- **Güvenlik şemaları:** OIDC/JWT, kapsam/rol izdüşümü, subject scope belgelenir.
- **Uyumluluk:** Spectral kuralları; geriye uyumlu değişiklik politikası ve kullanım dışı bırakma (deprecation) takvimi.

---

## 9) Önbellek ve Kuyruk

- **Önbellek stratejisi:** L1 (proses içi, kısa TTL) + L2 (Valkey/Redis). Cache‑aside; komut sonrası **etiket bazlı** (tag) invalidation.
- **Arka plan işler:** Bildirimler, raporlar, veri temizlikleri. Önceliklendirme, geri deneme sayısı, DLQ politikaları belirlenir.
- **Alternatif:** Monolith sadeleştirmesi için PostgreSQL tabanlı kuyruk tercih edilebilir.

---

## 10) Gözlemlenebilirlik, Loglama ve Audit

- **OpenTelemetry:** HTTP/DB/queue otomatik enstrümantasyon; trace kimliği loglara işlenir.
- **Yapılandırılmış loglar:** PII maskeleme, örnekleme (sampling), correlation‑id.
- **Audit kayıtları:** kim, ne, ne zaman; kaynak, eylem; CASL kararı (izin/ret + gerekçe); alan‑seviyesi maskeleme; saklama ve erişim politikaları.

---

## 11) Güvenlik ve KVKK

- **Uygulama güvenliği:** CSP/Helmet, oran sınırlama, giriş doğrulama, CSRF (cookie akışlarında), gizli yönetimi (KMS).
- **Veri koruma:** Hassas alanlarda alan‑seviyesi şifreleme; at‑rest ve in‑transit şifreleme, loglarda maskeleme.
- **KVKK uyumu:** Aydınlatma, açık rıza/yasal dayanak, saklama ve imha politikaları; yurt dışı aktarım, erişim/ düzeltme/silme başvurularının yönetimi.

---

## 12) Test ve CI/CD

- **Test piramidi:** Birim (%70), entegrasyon (%20), uçtan uca (%10).
- **Ortam izolasyonu:** Testcontainers ile PostgreSQL/Valkey; deterministik tohum verisi.
- **Sözleşme testleri:** OpenAPI’ya karşı; Spectral lint.
- **CI/CD:** Lint, güvenlik taraması, migration + smoke test, canary/blue‑green, rollback planı.

---

## 13) Dağıtım, Ortamlar ve Yapılandırma

- **Ortamlar:** Dev/Staging/Prod/DR; yapılandırma şablonları ve gizli yönetimi.
- **Veritabanı yaşam döngüsü:** Versiyonlu migration, geri alma, veri taşıma prova çalışmaları.
- **Ölçekleme:** Monolith kopyaları ile yatay ölçek; stateful bileşenler (DB, cache) ayrı yönetilir.
- **Yedekleme ve kurtarma:** RPO/RTO hedefleri, düzenli yedek ve kurtarma testleri.

---

## 14) Performans ve Kapasite

- **DB tarafı:** Kapsam alanları için indeksler; plan izleme; yoğun sorgular için okuma modeli.
- **Uygulama tarafı:** Sayfalama, alan filtreleme; gereksiz join ve N+1’den kaçınma.
- **Önbellek hedefleri:** Yüksek isabet oranı; sıcak veri ısındırma (warm‑up).

---

## 15) Yol Haritası (6–8 Hafta)

1. **Çekirdek altyapı:** Kimlik (passkey + OIDC broker), CASL, audit, OTel, cache/kuyruk iskeleti.
2. **Kullanıcı/rol & konu/kurum:** Subject/organization atamaları, CASL politikaları, RLS kanıtı (PoC).
3. **Kurs & kayıt:** Kurs CRUD, enrollment akışları, görünürlük kuralları, kapsam duyarlı rapor uçları.
4. **Sertleştirme & uyum:** KVKK süreçleri, güvenlik kontrolleri, performans iyileştirmeleri, prod izleme.

---

## 16) Başarı Metrikleri

- **Performans:** p95 istek süresi, DB p95, hata oranı, cache isabet oranı.
- **Güvenlik:** Kritik/ağır açık 0, token ihlali 0, audit tamlığı.
- **Kalite:** Test kapsaması, dokümantasyon tamlığı, geriye uyum oranı.

---

## 17) Riskler ve Açık Konular

- **e‑Devlet entegrasyonu:** Kurumsal protokoller ve sertifikasyon zamanlaması risklidir; broker (Keycloak) yaklaşımı riski azaltır.
- **CASL + RLS birlikte kullanım:** Politika tasarımını sade tut; kapsam alanlarında uygun indeksler; performans testleri.
- **Cache bağımlılığı:** Valkey/Redis lisans/işletim tercihleri; PG tabanlı kuyruk alternatifi ile dış bağımlılık azaltılabilir.

---

## 18) Değişiklik Özeti

- Mevcut mimari (VSA + CQRS/Mediator, OAuth2/JWT, CASL, Audit, UoW/Repository, monolith) korunmuştur.
- 2025’e uygun güncellemeler: Node.js 22 LTS, NestJS 11.x, PostgreSQL 18, Prisma 6.x, Valkey/Redis, Keycloak (OIDC/SAML), Passkeys/WebAuthn, OpenTelemetry ve OpenAPI 3.2.
- Branş/kategori bazlı görünürlük gereksinimi, **CASL + @casl/prisma** ve kritik tablolarda **RLS** ile **iki katmanlı** ele alınmıştır.


