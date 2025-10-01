# AGENTS.md — Badi Monolit İçin Kod Asistanı Kuralları

> Bu dosya, VS Code/Codex gibi araçların **projeye özgü** kuralları anlaması için hazırlanmıştır. Yeni bir görevde önce bu dosyayı bağlama ekleyin ve kararlarınızı buradaki ilkelere göre verin. Temel mimari: **Monolith + Vertical Slice Architecture (VSA) + CQRS/Mediator**, yetkilendirme: **CASL ABAC + PostgreSQL RLS** (iki katmanlı). fileciteturn0file4

---

## 0) Hızlı Kullanım (Asistan İçin)
- **Önce oku:** Bu dosyayı ve atıf verilen kaynak MD’leri bağlama ekle (örn. `@AGENTS.md`, `@docs/main.md`). Ardından ilgili slice ve rehberleri referans al. fileciteturn0file2
- **Değişiklik ilkesi:** Her değişiklik **ilgili feature slice** sınırlarında yapılır; dilimler arası doğrudan repository erişimi yasaktır (mediator/event kullan). fileciteturn0file2
- **Kimlik & yetki:** CASL kurallarına ve (varsa) RLS eşleşmesine uymayan bir kod **önermeyin**. Erişim filtreleri Prisma seviyesinde `accessibleBy` ile uygulanır. fileciteturn0file0
- **Güvenlik:** Gizli anahtar, PII, token veya gerçek kullanıcı verisi üretmeyin; KVKK/uyum bölümlerini referans alın. fileciteturn0file4
- **Test & sözleşme:** Yeni endpoint için unit + integration + **contract** (OpenAPI) testleri ekleyin. fileciteturn0file4

---

## 1) Proje Özeti ve Kısıtlar
- **Amaç:** Vatandaş odaklı kurs alma‑verme platformu; roller: öğretmen, katılımcı, kurum yöneticisi, sistem yöneticisi. Görünürlük kuralı: örn. **müzik öğretmeni sadece Müzik** kurs/kayıtlarını görür ve işlem yapar. fileciteturn0file4
- **Kimlik:** Passkey (WebAuthn) birincil, e‑posta/şifre ikincil; e‑Devlet ve diğer IdP’ler Keycloak broker üzerinden. Token politikaları: kısa ömürlü access, HTTP‑Only cookie ile refresh ve rotasyon. fileciteturn0file4
- **Yetkilendirme:** CASL tabanlı koşullu (ABAC) kurallar; kritik tablolarda **RLS** ikinci savunma hattı. fileciteturn0file4

---

## 2) Mimari İlke ve Dizin Yapısı
- **Seçilen model:** **Feature‑Paketli Clean**; her özellik `features/<feature>` altında kendi mini‑clean katmanları (domain, application, infrastructure, presentation, tests) ile paketlenir. fileciteturn0file1
- **Diller arası ilişkiler:** Feature’lar doğrudan birbirinin repository’sine erişmez; ortak şeyler `shared/`tadır; haberleşme **mediator** veya **domain events** ile yapılır. fileciteturn0file2
- **Örnek iskelet (özet):**
  ```txt
  src/features/<feature>/{domain,application,infrastructure,presentation,tests}
  src/shared/{domain,application/pipeline,infrastructure,presentation}
  ```
  - CQRS pipeline davranışları `shared/application/pipeline`: validation → authorization → transaction → (sorguda) cache. fileciteturn0file2
- **Durum Notu:** AppModule düzeyinde ortak komut/sorgu pipeline adımları plan aşamasında; yeni handler’larınızı bu sırayı dikkate alarak tasarlayın. fileciteturn0file4

---

## 3) Teknoloji Yığını ve Sürümler
- **Runtime/Framework:** Node.js **22 LTS**, NestJS **11.x**. fileciteturn0file4
- **DB/ORM:** PostgreSQL **18**, Prisma **6.x**. fileciteturn0file4
- **Önbellek/Kuyruk:** Valkey/Redis + BullMQ; alternatif olarak PostgreSQL tabanlı kuyruk (pg‑boss/Graphile Worker). fileciteturn0file4
- **Observability:** OpenTelemetry (OTLP) + yapılandırılmış loglar ve audit. fileciteturn0file4
- **Sözleşme:** OpenAPI 3.2; CI’da Spectral lint/kalite kapıları. fileciteturn0file4

---

## 4) Kimlik & Yetki — Uygulama Kuralları
- **JWT claim’leri:** `roles`, `subjectScopes`, `organizationId` access token’da taşınır; istek sırasında `AuthUser`’a maplenir. fileciteturn0file0
- **CASL Ability üretimi:** Kullanıcının rol ve `SubjectScope` kayıtlarına göre kurallar üretilir; sistem yöneticisi `manage all`, kurum yöneticisi `organizationId` filtresiyle; öğretmenler `subjectScopes` ve `instructorId=user.id` ile sınırlıdır. fileciteturn0file0
- **Guard/Pipeline:** `JwtAccessGuard` + `PoliciesGuard` ile route metadata’sındaki `@CheckAbility` değerlendirilir. Veri erişiminde `@casl/prisma` ile `accessibleBy` kullanılır. fileciteturn0file0
- **RLS:** PostgreSQL Row Level Security gerekiyorsa CASL ile aynı koşullar veri katmanında **ikinci savunma** olarak uygulanır. fileciteturn0file4
- **UI eşlemesi:** `subjectScopes` frontende taşınır; formlar/menüler koşullu gösterilir. fileciteturn0file0

**Örnekler**
```ts
// Route seviyesinde yetki kontrolü
@CheckAbility({ action: AppAction.Read, subject: 'Course', conditions: { subject: { in: ['music'] } } })
@Get(':id') async findOne() { /* ... */ }
```
```ts
// Repository seviyesinde veri filtreleme
const ability = abilityFactory.createForUser(authUser);
return prisma.course.findMany(accessibleBy(ability, AppAction.Read).Course);
```
Yukarıdaki kullanım, CASL kurallarını Prisma filtrelerine çevirir ve yalnızca izinli kayıtları döndürür. fileciteturn0file0

---

## 5) Veri & Prisma — Çalışma Akışı
- **Şema mimarisi:** Prisma şeması **parçalı** tutulur (`enums/*.prisma`, `tables/<Model>.prisma>`); script birleştirip `schema.prisma` üretir (bu dosyayı ellemeyin). fileciteturn0file6
- **Komutlar:**
  - `npm run prisma:generate` → birleştir + client üret. fileciteturn0file6
  - `npm run prisma:migrate -- --name <ad>` → migration oluştur/uygula. fileciteturn0file6
  - `npm run prisma:seed` → örnek veri tohumla (organization, roller, izinler, kullanıcı, kurs/lesson/enrollment). fileciteturn0file6
- **Refresh token deposu:** Opaque tokenlar hashli tutulur; limit ve revoke politikaları vardır. fileciteturn0file0

---

## 6) Backend Uygulama Oyun Kitabı (Playbook)
**Yeni bir özellik/endpoint eklerken:**
1. **Slice açın:** `src/features/<feature>` altında mini‑clean iskeleti kurun. fileciteturn0file1
2. **CQRS akışı:** Komut/sorgu + validator + handler yazın; pipeline sırasını (validation → authorization → idempotency → transaction → cache → audit/otel) dikkate alın. fileciteturn0file4
3. **Policy‑as‑code:** `application/policies` altında CASL kurallarını ve (varsa) RLS eşleşmelerini versiyonlayın; `tests/policies` ile regresyonu otomatikleştirin. fileciteturn0file1
4. **Repository/UoW:** Komutları tek transaction içinde (`$transaction`) çalıştırın; sorgularda cache‑aside yaklaşımı kullanın. fileciteturn0file4
5. **Domain events:** Etkileri `infrastructure/messaging` üzerinden BullMQ/Valkey ile publish edin; audit/rapor/notification gibi yan işleri bu kanala taşıyın. fileciteturn0file2
6. **OpenAPI:** Sözleşmeyi güncelleyin; Spectral lint hatasız geçmeli. fileciteturn0file4
7. **Testler:** Unit + integration + contract + policy; Testcontainers ile izole DB/Valkey tercih edin. fileciteturn0file4

---

## 7) Frontend (Next.js 15) — VSA + Atomic Taslak
- **Yapı:** `features/` altında auth, dashboard, site dilimleri; `components/` altında **atoms → molecules → organisms → templates** hiyerarşisi. App Router ile layout eşleşmeleri (`AuthLayout`, `MainLayout`). fileciteturn0file8
- **Ortak servisler:** `shared/services/http-client.ts` JWT header ekler; `shared/store/auth-store.ts` global oturum durumu taşır; `role-guard.tsx` sayfa erişimini kontrol eder. fileciteturn0file8
- **Eksikler (dikkat):** UTF‑8 metin temizliği, refresh token rotasyonu/401 yakalama, guard testleri ve tema token rehberi **yapılacak** durumda. Çözüm üretirken bu kalemleri tamamlamaya öncelik verin. fileciteturn0file7

---

## 8) Observability, Operasyon ve Uyum
- **OpenTelemetry:** HTTP/DB/queue otomatik enstrümantasyon; trace kimliği loglara eklenmeli. fileciteturn0file4
- **SLO/Alarm:** Mesai içi destek modeline uygun dashboard ve alarm matrisi; BullMQ retry/alert politikaları. fileciteturn0file1
- **KVKK:** PII ayrıştırma, saklama/anonimleştirme, audit kayıtları; dış aktarım ve başvuru süreçleri için rehbere uyun. fileciteturn0file4

---

## 9) Performans Notları
- **CASL + RLS:** İnce taneli politikalar için uygun indeksler (`subject_id`, `instructor_id`, `organization_id`), `EXPLAIN ANALYZE` ile PoC ve plan takibi. fileciteturn0file1
- **Okuma modeli:** Yoğun sorgular için read‑model sadeleştirmeleri ve cache ısındırma (warm‑up). fileciteturn0file4

---

## 10) Backlog ve Öncelikler
- **Epics ve Sprintler:** Kimlik/Yetki, Kurs/Enrollment, Observability/Operasyon, KVKK, DX/CI/CD başlıkları altında planlanmıştır; görevleri sprint planına uygun ele alın. fileciteturn0file3
- **Yakın hedefler:** Passkey + Keycloak + e‑Devlet akış diyagramları, CASL policy şablonları ve Prisma şema/migration/seed işleri önceliklidir. fileciteturn0file3

---

## 11) Yap / Yapma (Kısa Liste)
**Yap:**
- Feature sınırlarını koruyun, mediator/event ile konuşun. fileciteturn0file2
- CASL kurallarını policy‑as‑code olarak yazın; repository’de **accessibleBy** kullanın. fileciteturn0file0
- OpenAPI sözleşmesini ve testleri güncel tutun; Spectral lint geçsin. fileciteturn0file4

**Yapma:**
- Başka feature’ın repository’sine doğrudan erişmeyin. fileciteturn0file2
- RLS/CASL atlanmış “geniş” sorgular yazmayın. fileciteturn0file4
- `prisma/schema.prisma` dosyasını elle düzenlemeyin (otomatik üretilir). fileciteturn0file6

---

## 12) Faydalı Komutlar
```bash
# Prisma
npm run prisma:generate
npm run prisma:migrate -- --name <ad>
npm run prisma:deploy
npm run prisma:seed
```
Prisma komutları, parçalı şemayı birleştirir ve client/migration/seed adımlarını çalıştırır. fileciteturn0file6

---

## 13) Açık Konular (Takip)
- CQRS ortak pipeline’ın AppModule düzeyinde devreye alınması. fileciteturn0file4
- CASL + RLS performans PoC sonuçlarının indeks/plan rehberine dönüştürülmesi. fileciteturn0file1
- Observability SLO ve incident süreçlerinin netleştirilmesi. fileciteturn0file5

---

**Bu dosya, yeni sprintlerle birlikte güncellenecektir; mimari ve rehber MD’lerdeki değişiklikler buraya yansıtılmalıdır.** fileciteturn0file4
