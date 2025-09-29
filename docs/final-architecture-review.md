# Kurs Platformu Nihai Mimari Değerlendirme (Feature-Paketli Clean)

> Kaynaklar: docs/main.md, docs/main-review.md, docs/hybrid-structure.md. Seçilen yapı: **Feature-Paketli Clean**.

## 1. Genel Durum
- Monolitik VSA + CQRS yaklaşımı korunurken her özellik `features/<feature>` klasöründe mini-clean katmanlarıyla paketlendi.
- Clean Architecture katmanları (`domain`, `application`, `infrastructure`, `presentation`) feature klasörleri içinde yinelendi; ortak nesneler `shared/` altında toplandı.
- Teknoloji yığını (Node.js 22, NestJS 11, PostgreSQL 18, Prisma 6, Valkey/BullMQ) ana dokümana uygun şekilde hedefleniyor.

## 2. Yapı Kurallarına Uyum
- **Dizin iskeleti:** `features/user`, `features/role`, `features/permission`, `features/form`, `features/lesson`, `features/teacher` klasörlerinde domain/application/infrastructure/presentation/tests şablonu uygulanacak.
- **Politika yönetimi:** CASL ve RLS kuralları `application/policies` altında policy-as-code yaklaşımıyla versiyonlanacak; `tests/contract` klasörü politika ve DTO uyumunu doğrulayacak.
- **CQRS pipeline:** Ortak davranışlar `shared/application/pipeline` (validation, authorization, transaction) altında tutulacak; mediator aracılığıyla feature handler'larına ulaştırılacak.
- **Domain event akışı:** `domain/events` altındaki event'ler `infrastructure/messaging` üzerinden BullMQ/Valkey ile yayınlanarak audit, bildirim ve raporlama gibi yan etkiler izole edilecek.

## 3. Güncellenen Risk ve Aksiyonlar
- **Kimlik/Yetki karmaşıklığı:** Passkey + Keycloak + e-Devlet akışları için sequence diyagramları hazırlanacak; Keycloak özelleştirmeleri (tema/SPI) ekip içindeki müdür ve iki geliştirici tarafından yönetilecek.
- **CASL + RLS performansı:** Örnek politikalar policy klasöründe tutulacak, Prisma sorguları için `EXPLAIN ANALYZE` PoC'si planlandı; indeksler (subject_id, instructor_id) roadmap'te.
- **Cache/kuyruk seçimi:** Valkey/BullMQ birincil; PostgreSQL tabanlı kuyruk yedek plan olarak belirlendi. Operasyon ekibi mesai saatlerinde yönetim yapacağı için otomatik retry/alert kuralları tanımlanacak.
- **Gözlemlenebilirlik:** OpenTelemetry yanı sıra metrik/sinyal hedefleri (standart SLA/SLO) referans alınacak; dashboard'lar mesai içi destek modeline göre düzenlenecek.
- **KVKK uyumu:** Veri saklama matrisi, otomatik silme/bulanıklaştırma işleri ve domain-event tetikleyicileri backlog'a eklendi.
- **Test kapsamı:** Feature içi unit/integration/contract testleri zorunlu; CASL/RLS politika testleri `tests/policies` ile otomasyona bağlanacak.

## 4. Örnek Proje İskeleti (Feature-Paketli Clean)
```
src/
  features/
    user/
      domain/
        entities/
          User.ts
        rules/
          UserEligibilityRule.ts
        events/
          UserRegistered.ts
      application/
        commands/
          register-user/
            RegisterUserCommand.ts
            RegisterUserHandler.ts
            RegisterUserValidator.ts
          update-user-profile/
            UpdateUserProfileCommand.ts
            UpdateUserProfileHandler.ts
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
- Feature klasörleri aynı şablonu takip eder; örneğin `lesson` diliminde `CreateLessonCommand`, `LessonScheduled` event’i ve `LessonEnrollmentPolicy` dosyaları yer alır.
- `shared/application/pipeline` CQRS davranışlarını merkezi yönetir; özellikler mediator üzerinden iletişim kurar.
- `tests/contract` klasörü OpenAPI/GraphQL sözleşmelerini, `tests/policies` yük dağılımı ve RLS eşleşmesini doğrular.

