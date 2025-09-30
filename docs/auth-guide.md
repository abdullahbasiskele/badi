# Kimlik & Yetkilendirme Rehberi

Bu doküman, Badi monolit backend’inde kimlik doğrulama ve yetkilendirme süreçlerinde kullanılan veritabanı tablolarını ve bu tabloların CASL/SubjectScope tabanlı kurallar ile nasıl çalıştığını açıklar. Öğretmenlerin branş bazlı erişimi örneği üzerinden ilerlesek de aynı mekanizma form alanları, raporlar veya yönetim ekranları gibi farklı UI senaryolarında da kullanılabilir.

## 1. Veri Modeli

### User
- Kullanıcının temel kimliği (e-posta, parola özeti, görünen ad, locale).
- `organizationId` ile isteğe bağlı kurum bağlamı.
- İlişkiler: `roles` (`UserRole` pivotu), `subjectScopes`, `courses`, `lessons`, `enrollments`, `refreshTokens`.

### Role & Permission
- Roller (`Role`) sistem/kamu profilini temsil eder (`RoleKey` enumuyla referans verilir).
- İzinler (`Permission`) CASL kararlarında kullanılacak `code`, `subject`, `actions` bilgilerini tutar.
- `RolePermission` pivotu hangi rolün hangi izinleri taşıdığını belirtir.

### UserRole
- Bir kullanıcının birden fazla role sahip olabilmesini sağlar.

### SubjectScope
- Kullanıcının erişebileceği konu/tema setini tutar (örn. `userId=teacher1`, `subject='music'`).
- CASL ability üretiminde `subjectScopes` listesi kullanılır.
- UI tarafında da koşullu alan/komponent gösterimi için kullanılabilir.

### RefreshToken
- Opaque (JWT olmayan) yenileme tokenlarını tutar. Rotasyon sırasında hashlenmiş secret, sona erme ve revoke bilgilerini saklar.

## 2. CASL + Prisma Yetkilendirme Akışı

1. **JWT Claim’leri**: Access token’da `roles`, `subjectScopes`, `organizationId` taşınır, istek sırasında `AuthUser` objesine maplenir.
2. **AbilityFactory**: Kullanıcının rollerine ve `SubjectScope` kayıtlarına göre CASL kuralları üretilir.
   - Sistem yöneticisi `manage all` yetkisi alır.
   - Kurum yöneticisi `organizationId` filtresiyle sınırlandırılır.
   - Öğretmenler `subject in subjectScopes` ve `instructorId = user.id` gibi koşullarla sınırlıdır.
3. **Guard Katmanı**: `JwtAccessGuard` erişimi doğrular, `PoliciesGuard` route metadata’sındaki `@CheckAbility` dekoratörünü CASL ability ile karşılaştırır.
4. **Prisma Query’si**: `@casl/prisma` sayesinde ability kuralları repository katmanında otomatik olarak Prisma filtrelerine çevrilebilir (`accessibleBy`).
5. **RLS (Opsiyonel)**: PostgreSQL Row Level Security kullanarak aynı koşulları veritabanı düzeyinde ikinci savunma hattı olarak uygulayabiliriz.

### Örnek CASL Politikası (Kod Tarafı)
```ts
@CheckAbility({ action: AppAction.Read, subject: 'Course', conditions: { subject: { in: ['music'] } } })
@Get(':id')
async findOne() { ... }
```
Bu route çağrılmadan önce `PoliciesGuard`, ability’nin `Course` üzerinde `Read` izni olup olmadığını ve `subject` değerinin öğretmenin `SubjectScope` listesine uyup uymadığını kontrol eder.

### Örnek Repository Kullanımı
```ts
const ability = this.abilityFactory.createForUser(authUser);
return this.prisma.course.findMany(accessibleBy(ability, AppAction.Read).Course);
```
`accessibleBy` ability’deki koşulları Prisma `where` ifadesine dönüştürür ve yalnızca izinli kayıtlar döner.

## 3. SubjectScope ile UI/Form Koşullu Gösterim

- **Kayıtlı scope’ları JWT’ye ekle**: Access token oluşturulurken `subjectScopes` claim’i eklenir.
- **Frontend’de değerlendirme**: React veya benzeri arayüzde kullanıcı bilgisinden `subjectScopes` çekilir. Örn. “Müzik” yetkisi olmayan bir öğretmene müzik formlarını gizleyebiliriz.
- **Form örneği**:
  ```tsx
  const canEditMusic = user.subjectScopes.includes('music');
  return canEditMusic ? <MusicForm /> : <NoAccessBanner />;
  ```
- **Rapor/menü örneği**: Benzer şekilde menü öğelerini scope listesine göre filtrelemek mümkün.
- **Advanced**: `SubjectScope` tablosuna sadece branş değil, UI bileşeni veya modül kimliği yazılarak daha esnek yetkilendirme yapılabilir (ör. `subject='forms.studentFinance'`). Backend ability kuralları da aynı değerleri kullanırsa veri ve UI tutarlı kalır.

## 4. Kimlik Doğrulama Akışı (Yerel)

1. **Register** (`POST /auth/register`): `RegisterUserHandler` Argon2 ile parolayı hash’ler, varsayılan rolü bağlar ve token seti döner.
2. **Login** (`POST /auth/login`): E-posta/parola doğrulanır, CASL için gerekli ilişkiler yüklenir, token döner.
3. **Refresh** (`POST /auth/refresh`): Opaque refresh token parse edilir, DB’deki hash ile karşılaştırılır, limit kontrolü sonrası yeni token üretilir.
4. **Logout** (`POST /auth/logout`): Gönderilen refresh token varsa revoke edilir.

## 5. RefreshToken Yönetimi

- Tokenlar `uuid.secret` formatında opak string olarak üretilir.
- Her kullanıcı için varsayılan 3 aktif token limitimiz var (`AUTH_REFRESH_TOKEN_LIMIT` ile değiştirilebilir). Limit aşılırsa en eski tokenlar revoke edilir.
- `expiresAt` kontrolü ile süre aşımı, `revokedAt` ile manuel/otomatik iptal izlenir.

## 6. Seed Stratejisi

`prisma/seed.ts` betiği:
1. Veritabanını temizler.
2. Organization, Role, Permission kayıtlarını ekler.
3. Roller ile izinleri ilişkilendirir.
4. Örnek kullanıcılar oluşturur (argon2 hash ile parola) ve `SubjectScope` atar.
5. Müzik kursu, ders ve enrollment kaydı ekler.

Çalıştırmak için: `npm run prisma:seed`.

## 7. Kullanışlı Komutlar

- `npm run prisma:generate`: Parçalı şemayı birleştirir ve Prisma Client üretir.
- `npm run prisma:migrate -- --name <ad>`: Yeni migration oluşturur ve uygular.
- `npm run prisma:seed`: Seed betiğini çalıştırır.
- `npm run start:dev`: Nest backend’i çalıştırır (kök klasör yerine `backend/` içinde çalıştırılması gerekir).

## 8. Kontrol Listesi

- CASL policy örnekleri dokümante edildi.
- SubjectScope’un UI koşullu gösterimde nasıl kullanılacağı açıklandı.
- Refresh token limit yönetimi ve seed stratejisi belgelendi.

Bu rehber, ilerleyen sprintlerde yeni modüller eklenirken veya UI tarafında koşullu yetkilendirme uygulanırken referans olarak kullanılmalıdır.
