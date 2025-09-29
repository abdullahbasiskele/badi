# Hibrit Clean Architecture + Vertical Slice İskeleti

> Seçilen model: **Feature-Paketli Clean** (Önerilen Yapı B). Örnek domain: user, role, permission, form, lesson, teacher.

## 1. Ortak İlkeler
- Clean Architecture katmanları korunur: `domain`, `application`, `infrastructure`, `presentation`.
- Her feature kendi CQRS komut/sorgu akışını, validator’larını ve testlerini paketler; dilimler arası bağımlılık yalnızca paylaşılan domain sözlüğü ve kontratlar üzerinden kurulur.
- `shared/` klasörü yalnızca tekrar eden altyapı bileşenlerini barındırır; feature klasörleri birbirine doğrudan referans vermez.

## 2. Seçilen Yapı: "Feature-Paketli Clean"
```
src/
  features/
    user/
      domain/
        entities/
        rules/
        events/
      application/
        commands/
          register-user/
            RegisterUserCommand.ts
            RegisterUserHandler.ts
            RegisterUserValidator.ts
        queries/
          get-user-profile/
            GetUserProfileQuery.ts
            GetUserProfileHandler.ts
        policies/
          userPermissions.policy.ts
      infrastructure/
        repositories/
          PrismaUserRepository.ts
        cache/
          UserCacheService.ts
        messaging/
          UserEventPublisher.ts
      presentation/
        http/
          RegisterUserEndpoint.ts
          GetUserProfileEndpoint.ts
        graphql/
          UserResolver.ts
      tests/
        unit/
        integration/
        contract/
    role/
    permission/
    form/
    lesson/
    teacher/
  shared/
    domain/
      base-entity.ts
      domain-events.ts
    application/
      mediator.ts
      pipeline/
        validationBehavior.ts
        authorizationBehavior.ts
        transactionBehavior.ts
    infrastructure/
      prisma-client.ts
      messaging/
        bullmq-client.ts
    presentation/
      api-errors.ts
  config/
    env/
    auto-migrations/
```
**Uygulama Notları**
- Feature klasörleri mini-clean yapısını (domain/application/infrastructure/presentation/tests) korur; yeni dilimler eklenirken aynı şablon kullanılır.
- `policies/` altında CASL ve RLS eşleşen kurallar versiyonlanır; `tests/contract/` klasöründe politika ve DTO uyumu doğrulanır.
- `shared/application/pipeline` CQRS davranışlarını merkezi yönetir; feature’lar yalnızca mediator üzerinden haberleşir.
- Domain event’leri (`domain/events`) BullMQ kuyruğuna veya Valkey yayınlarına delegasyon için `infrastructure/messaging` üzerinden yayımlanır.

## 3. Feature-Paketli Modeli Destekleyen Rehber
- **Adlandırma:** Komut/Sorgu klasörleri fiil tabanlı (`register-user`, `enroll-lesson`); handler sınıfları `VerbNounHandler` formatını izler.
- **Kesit yetenekleri:** Audit, observability, caching gibi ortak davranışlar `shared/` altında servisler olarak tutulur ve DI konteynerinde kaydedilir.
- **Test stratejisi:**
  - Unit testler feature içindeki domain kurallarına odaklanır.
  - Integration testler repository ve policy katmanlarını ele alır.
  - Contract testler OpenAPI veya GraphQL şemalarını doğrular.
- **Bağımlılık yönetimi:** Feature’lar arası veri paylaşımı için event veya mediator tabanlı isteklere izin verilir; doğrudan repository erişimi yasaktır.

## 4. Referans İçin Alternatif (Modüler Monolit Katmanlı)
Bu model, katman sorumluluklarını sıkı tutmak istediğiniz durumlar için saklanmıştır. Eğer gelecekte ekip yapısı değişir ve katman öncelikli yaklaşım tercih edilirse `docs/main-review.md` ile birlikte bu bölümü yeniden değerlendirebilirsiniz.

## 5. Güncel En İyi Uygulama Önerileri
1. **Feature-first domain event akışı:** `features/<feature>/domain/events` klasöründe üretilen event’leri `shared/infrastructure/messaging` katmanında BullMQ/Valkey ile publish ederek audit, bildirim ve raporlama gibi yan etkileri modüler tutun.
2. **Policy-as-code otomasyonu:** CASL kurallarını `features/<feature>/application/policies` altında TypeScript DSL veya JSON şemalarıyla saklayın; `tests/policies` dizininde RLS eşlemesi ve yetki regresyon testleri otomatik çalışsın.

