# Kimlik & Yetkilendirme Veri Modeli

Bu doküman, Prisma tabanlı monolit backend’de kimlik doğrulama ve yetkilendirme süreçlerini kapsayan tablolar ile süreç akışlarını açıklar. Özellikle öğretmenlerin branş bazlı erişimlerini sağlayan `SubjectScope` tablosunun rolü vurgulanmıştır.

## 1. Tablolar ve Amaçları

### User
- Kullanıcı temel bilgileri (email, isim, parola özeti, locale).
- `organizationId`: kullanıcının bağlı olduğu kurum (opsiyonel).
- İlişkiler:
  - `roles`: `UserRole` üzerinden roller.
  - `subjectScopes`: kullanıcının erişimine izin verilen branş listesi.
  - `courses`, `lessons`, `enrollments`, `refreshTokens`.

### Role
- Sistem, kurum yöneticisi, öğretmen, katılımcı gibi profil rolleri.
- `key` alanı (`RoleKey` enum): iş mantığında sabit referans.# Kimlik & Yetkilendirme Veri Modeli

Bu doküman, Prisma tabanlı monolit backend’de kimlik doğrulama ve yetkilendirme süreçlerini kapsayan tablolar ile süreç akışlarını açıklar. Özellikle öğretmenlerin branş bazlı erişimlerini sağlayan `SubjectScope` tablosunun rolü vurgulanmıştır.

## 1. Tablolar ve Amaçları

### User
- Kullanıcı temel bilgileri (email, isim, parola özeti, locale).
- `organizationId`: kullanıcının bağlı olduğu kurum (opsiyonel).
- İlişkiler:
  - `roles`: `UserRole` üzerinden roller.
  - `subjectScopes`: kullanıcının erişimine izin verilen branş listesi.
  - `courses`, `lessons`, `enrollments`, `refreshTokens`.

### Role
- Sistem, kurum yöneticisi, öğretmen, katılımcı gibi profil rolleri.
- `key` alanı (`RoleKey` enum): iş mantığında sabit referans.

### Permission
- CASL / ABAC kararlarının referansı.
- `code`, `subject`, `actions` alanlarıyla birlikte saklanır.
- Rollerle `RolePermission` üzerinden ilişki kurulur.

### UserRole
- Kullanıcı ile rol arasında pivot tablo. Aynı kullanıcı birden fazla role sahip olabilir.

### RolePermission
- Rollere hangi izinlerin tanımlı olduğunu gösteren pivot tablo.
- Seed aşamasında sistem, kurum yöneticisi vb. rollere uygun izinler eklenir.

### SubjectScope
- **Öğretmenlerin branş bazlı erişimi** için kritik tablo.
- Her kayıt: `userId` + `subject` (örn. `userId=teacher1`, `subject='music'`).
- CASL ability creation sırasında öğretmenin sahip olduğu `subject` listesi bu tablodan alınır ve sorgular filtrelenir.
- Örnek: Müzik öğretmeni `SubjectScope(subject='music')` kaydına sahip olduğundan sadece `Course.subject = 'music'` olan kayıtları görebilir/güncelleyebilir.

### RefreshToken
- JWT refresh token rotasyonu için saklanan hash ve metadata.
- `userId` ile kullanıcıya bağlanır.
- `expiresAt`, `revokedAt` alanları bulunduğundan token invalidasyonu yapılabilir.

## 2. Yetkilendirme Akışı (CASL + Prisma)

1. Kimlik doğrulanan kullanıcının JWT’sinden `roles`, `subjectScopes`, `organizationId` gibi claim’ler alınıp `AuthUser` yapısına dönüştürülür.
2. `AbilityFactory.createForUser`:
   - `SubjectScope` kayıtları PostgreSQL’den çekilir.
   - CASL kuralları: öğretmense `subject in subjectScopes` şartı, kurum yöneticisi ise `organizationId` filtresi vb.
   - CASL + `@casl/prisma` kombinasyonu sayesinde repository katmanında ability koşulları Prisma filtrelerine çevrilir (`accessibleBy`).
3. Controller → Guard katmanı:
   - `JwtAccessGuard` token’i doğrulayıp `AuthUser` bağlar.
   - `PoliciesGuard` route metadata’sındaki `@CheckAbility({ action: 'read', subject: 'Course' })` gibi istekleri ability ile doğrular.
4. Veritabanı:
   - CASL koşulları `SubjectScope` verisine dayandığı için öğretmen, konu dışı kursları göremez.
   - PostgreSQL’de satır düzeyi güvenlik (RLS) eklenmek istenirse `SubjectScope` bilgisi `SET LOCAL` gibi yöntemlerle de kısıtlanabilir (ikinci savunma hattı).

## 3. Kimlik Doğrulama Akışı

1. Uygulama girişinde (şimdilik) e-posta/parola veya dış kimlik sağlayıcılarıyla authenticate edilir.
2. Başarılı girişte:
   - `AuthService` access token üretir (`JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL`).
   - `RefreshToken` tablosuna yeni kayıt (uuid) yazılır, `refreshToken` JWT olarak döner (`JWT_REFRESH_SECRET`, `JWT_REFRESH_TTL`).
3. Refresh:
   - Gönderilen `refreshToken` doğrulanır (`JwtRefreshStrategy`).
   - `RefreshToken` tablosunda `tokenHash` eşleşmesi ve `revokedAt` kontrolü yapılır.
   - Token rotasyonu sonrası eski kayıt `revokedAt` doldurularak pasif hale getirilir.
4. Logout:
   - İlgili refresh token kaydı `revokedAt` ile işaretlenir veya silinir.

## 4. Seed Stratejisi

- `prisma/seed.ts` betiği:
  1. Veritabanını temizler (`deleteMany`).
  2. Organization, Role, Permission kayıtlarını oluşturur.
  3. RolePermission bağlarını kurar (ör. kurum yöneticisine `course.manage` izni).
  4. Kullanıcı oluşturur ve SubjectScope atar (muzik öğretmeni → `subject='music'`).
  5. Örnek Course + Lesson + Enrollment kayıtlarını ekler (katılımcı onaylı olarak kayıtlı).

Bu betik `npm run prisma:seed` ile çalıştırılır.

## 5. Komutlar ve İpuçları

- `npm run prisma:generate`: Şemayı birleştirip Prisma Client’i yeniler.
- `npm run prisma:migrate -- --name <ad>`: Migration oluşturur ve uygular.
- `npm run prisma:seed`: Yukarıda anlatılan seed betiğini çalıştırır.
- `DATABASE_URL` ve `DATABASE_DIRECT_URL` `.env` içinde tanımlı olmalı; shadow DB kullanılmıyor, bu nedenle `badi_db` veritabanının mevcut olması şart.

## 6. SubjectScope Neden Önemli?

- Öğretmenlerin sadece kendi branşlarındaki kursları görmesini sağlayan **farklılaştırıcı tablo**.
- CASL ability üretiminde bu tabloya bakılarak:
  - `Course.subject in teacher.subjectScopes`
  - `Lesson` ve `Enrollment` sorguları da branş filtreleriyle sınırlandırılabilir.
- Bu sayede yetki yönetimi sadece roller üzerinden değil, **şartlı yetki (ABAC)** mantığıyla (branş/bölge/organizasyon vb.) çalışır.

Bu dokümanı `docs/prisma-guide.md` benzeri bir yerde saklayabilir, ileride yeni tablolar veya senaryolar eklendiğinde güncelleyebilirsin.


### Permission
- CASL / ABAC kararlarının referansı.
- `code`, `subject`, `actions` alanlarıyla birlikte saklanır.
- Rollerle `RolePermission` üzerinden ilişki kurulur.

### UserRole
- Kullanıcı ile rol arasında pivot tablo. Aynı kullanıcı birden fazla role sahip olabilir.

### RolePermission
- Rollere hangi izinlerin tanımlı olduğunu gösteren pivot tablo.
- Seed aşamasında sistem, kurum yöneticisi vb. rollere uygun izinler eklenir.

### SubjectScope
- **Öğretmenlerin branş bazlı erişimi** için kritik tablo.
- Her kayıt: `userId` + `subject` (örn. `userId=teacher1`, `subject='music'`).
- CASL ability creation sırasında öğretmenin sahip olduğu `subject` listesi bu tablodan alınır ve sorgular filtrelenir.
- Örnek: Müzik öğretmeni `SubjectScope(subject='music')` kaydına sahip olduğundan sadece `Course.subject = 'music'` olan kayıtları görebilir/güncelleyebilir.

### RefreshToken
- JWT refresh token rotasyonu için saklanan hash ve metadata.
- `userId` ile kullanıcıya bağlanır.
- `expiresAt`, `revokedAt` alanları bulunduğundan token invalidasyonu yapılabilir.

## 2. Yetkilendirme Akışı (CASL + Prisma)

1. Kimlik doğrulanan kullanıcının JWT’sinden `roles`, `subjectScopes`, `organizationId` gibi claim’ler alınıp `AuthUser` yapısına dönüştürülür.
2. `AbilityFactory.createForUser`:
   - `SubjectScope` kayıtları PostgreSQL’den çekilir.
   - CASL kuralları: öğretmense `subject in subjectScopes` şartı, kurum yöneticisi ise `organizationId` filtresi vb.
   - CASL + `@casl/prisma` kombinasyonu sayesinde repository katmanında ability koşulları Prisma filtrelerine çevrilir (`accessibleBy`).
3. Controller → Guard katmanı:
   - `JwtAccessGuard` token’i doğrulayıp `AuthUser` bağlar.
   - `PoliciesGuard` route metadata’sındaki `@CheckAbility({ action: 'read', subject: 'Course' })` gibi istekleri ability ile doğrular.
4. Veritabanı:
   - CASL koşulları `SubjectScope` verisine dayandığı için öğretmen, konu dışı kursları göremez.
   - PostgreSQL’de satır düzeyi güvenlik (RLS) eklenmek istenirse `SubjectScope` bilgisi `SET LOCAL` gibi yöntemlerle de kısıtlanabilir (ikinci savunma hattı).

## 3. Kimlik Doğrulama Akışı

1. Uygulama girişinde (şimdilik) e-posta/parola veya dış kimlik sağlayıcılarıyla authenticate edilir.
2. Başarılı girişte:
   - `AuthService` access token üretir (`JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL`).
   - `RefreshToken` tablosuna yeni kayıt (uuid) yazılır, `refreshToken` JWT olarak döner (`JWT_REFRESH_SECRET`, `JWT_REFRESH_TTL`).
3. Refresh:
   - Gönderilen `refreshToken` doğrulanır (`JwtRefreshStrategy`).
   - `RefreshToken` tablosunda `tokenHash` eşleşmesi ve `revokedAt` kontrolü yapılır.
   - Token rotasyonu sonrası eski kayıt `revokedAt` doldurularak pasif hale getirilir.
4. Logout:
   - İlgili refresh token kaydı `revokedAt` ile işaretlenir veya silinir.

## 4. Seed Stratejisi

- `prisma/seed.ts` betiği:
  1. Veritabanını temizler (`deleteMany`).
  2. Organization, Role, Permission kayıtlarını oluşturur.
  3. RolePermission bağlarını kurar (ör. kurum yöneticisine `course.manage` izni).
  4. Kullanıcı oluşturur ve SubjectScope atar (muzik öğretmeni → `subject='music'`).
  5. Örnek Course + Lesson + Enrollment kayıtlarını ekler (katılımcı onaylı olarak kayıtlı).

Bu betik `npm run prisma:seed` ile çalıştırılır.

## 5. Komutlar ve İpuçları

- `npm run prisma:generate`: Şemayı birleştirip Prisma Client’i yeniler.
- `npm run prisma:migrate -- --name <ad>`: Migration oluşturur ve uygular.
- `npm run prisma:seed`: Yukarıda anlatılan seed betiğini çalıştırır.
- `DATABASE_URL` ve `DATABASE_DIRECT_URL` `.env` içinde tanımlı olmalı; shadow DB kullanılmıyor, bu nedenle `badi_db` veritabanının mevcut olması şart.

## 6. SubjectScope Neden Önemli?

- Öğretmenlerin sadece kendi branşlarındaki kursları görmesini sağlayan **farklılaştırıcı tablo**.
- CASL ability üretiminde bu tabloya bakılarak:
  - `Course.subject in teacher.subjectScopes`
  - `Lesson` ve `Enrollment` sorguları da branş filtreleriyle sınırlandırılabilir.
- Bu sayede yetki yönetimi sadece roller üzerinden değil, **şartlı yetki (ABAC)** mantığıyla (branş/bölge/organizasyon vb.) çalışır.

Bu dokümanı `docs/prisma-guide.md` benzeri bir yerde saklayabilir, ileride yeni tablolar veya senaryolar eklendiğinde güncelleyebilirsin.
