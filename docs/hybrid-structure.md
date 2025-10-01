# Hibrit Clean Architecture + Vertical Slice Iskeleti

Secilen model: Feature Paketli Clean. Bu dokuman backend klasor yapisini ve audit log gibi capraz kesit yeteneklerini nasil konumlandirdigimizi aciklar.

## 1. Ortak Ilkeler
- Clean Architecture katmanlari korunur: domain, application, infrastructure, presentation, tests.
- Her feature kendi CQRS komut ve sorgularini, validatorlerini ve testlerini paketler; dilimler arasi bagimlilik yalnizca shared katmani uzerinden kurulur.
- Audit, logging, messaging, policies gibi paylasilan yapilar `shared/` klasorunde tutulur; feature lar dogrudan birbirinin repository sine erismez.

## 2. Guncel Dizin Yapisi (Ekim 2025)
```
src/
  features/
    audit-log/
      domain/{entities,factories}
      application/{commands,queries,services}
      infrastructure/{repositories,workers}
      tests/
    auth/
    course/
    teacher/
    user/
  shared/
    application/{pipeline,policies,uow}
    infrastructure/{logging,prisma,messaging}
    presentation/interceptors
```
- Audit slice tum HTTP isteklerini yakalayan HttpRequestLoggingInterceptor u kullanir ve kayitlari queue veya komut bus i uzerinden verir.
- Shared pipeline icinde AppCommandBus, AppQueryBus ve TransactionalCommand dekoratoru bulunur.

## 3. CQRS ve Pipeline Akisi
1. Request controller dan ciktiktan sonra HttpRequestLoggingInterceptor suresi olcer ve audit payload ini hazirlar.
2. Komutlar AppCommandBus uzerinden validation ve transaction pipeline larindan gecer.
3. Authorization PoliciesGuard ile saglanir, accessibleBy filtreleri repository lerde uygulanir.
4. RLS, audit de dahil olmak uzere kritik tablolarda session bazli `set_config` cagrilari ile aktif edilmis durumda.

## 4. Domain Event ve Kuyruk
- BullMQ entegrasyonu audit slice icin ornek olarak uygulanmistir (`audit-log` kuyruu).
- Kuyruk baglantisi tanimlanmamis ortamlarda AuditTrailService dogrudan komut bus ini kullanir, boylece degrade olmadan calisir.
- Kalan feature lar da benzer sekilde opsiyonel queue stratejisi ile hizlica uyarlanabilir.

## 5. TDD ve Test Yapisi
- Unit testler domain kurallarina odaklanir (ornek: HttpRequestLogFactory PII maskesi).
- Integration testler repository + policy davranisini dogrular.
- Contract testler yeni audit listeleme sorgusu icin eklenmek uzere backlog da.

## 6. Gelistirme Notlari
- Yeni slice eklerken once domain/entities sonra application/commands dizinlerini olustur; infrastructure repository ler PrismaService e baglanmali.
- Ortak davranis eklemek istediginde once shared katmanda moduler servis yaz; dogrudan feature lar arasinda import yapma.
- Audit slice tasarimi queue bagimliligini opsiyonel hale getirdigi icin diger capraz kesitler icin de referans olarak kullan.

Bu iskelet, monolit icinde cekirdek modul ve capraz kesitleri hizli sekilde konumlandirmak icin gunceldir. Yeni feature yayinlandiginda bagli bolumleri guncellemeyi unutma.
