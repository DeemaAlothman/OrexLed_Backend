# دليل ربط تطبيق Flutter مع Auth API — OrexLed

هاد ملخص لفريق الفرونت (Flutter، أندرويد + iOS) لربط التطبيق مع الباك اند تبع تسجيل الدخول والصلاحيات (admin / user). كل شي بهالمستند مُختبر فعليًا وشغال، بما فيه مسار الموبايل تحديدًا (بدون كوكيز).

## 1. Base URL

| البيئة | الرابط |
|---|---|
| تطوير — محاكي أندرويد (Android Emulator) | `http://10.0.2.2:3333` |
| تطوير — جهاز حقيقي (نفس شبكة الواي فاي متل جهاز التطوير) | `http://192.168.1.107:3333` |
| تطوير — iOS Simulator | `http://localhost:3333` (يشتغل مباشرة لأنه الـ simulator بيشارك شبكة الماك) |
| Production | لسا ما انحدد — رح يتحدد وقت الـ deployment، رح نخبركم |

**ملاحظة عن الـ IP المحلي (`192.168.1.107`):** هاد بيتغير كل ما يعيد جهاز التطوير الاتصال بالشبكة (DHCP). إذا صار ما يشتغل، اطلبوا الـ IP الحالي وقتها.

**HTTPS بالتطوير:** السيرفر حاليًا HTTP عادي (بلا شهادة) بالتطوير المحلي. أندرويد 9+ بيرفض cleartext traffic افتراضيًا، فلازم تضيفوا استثناء بـ `network_security_config.xml` لـ:
```xml
<network-security-config>
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">10.0.2.2</domain>
    <domain includeSubdomains="false">192.168.1.107</domain>
  </domain-config>
</network-security-config>
```
هاد **بيئة التطوير بس** — بالـ production السيرفر رح يكون HTTPS وما رح تحتاجوا هالاستثناء.

## 2. طريقة المصادقة — Bearer token بالكامل، بدون كوكيز

الـ API بيدعم أسلوبين (كوكي للويب، وbody صريح للموبايل)، بس **إلكم كفريق Flutter استخدموا أسلوب الـ body دايمًا وتجاهلوا موضوع الكوكيز كليًا** — ما إلها علاقة فيكم.

- كل الاستجابات (`register` / `login` / `refresh`) بترجع `accessToken` و `refreshToken` **بالـ JSON body مباشرة**.
- ما في CORS ولا Origin يهمنا بحالتكم — مفيش شي لازم تتصلوا فينا بخصوصه من هالناحية. (إذا شغلتوا نسخة ويب من فلاتر للتجربة على `http://localhost:3001`، خبرونا نضيفها لـ `CORS_ORIGINS`، بس هاد مش blocker).

## 3. الـ Endpoints

### تسجيل حساب جديد
```
POST /auth/register
Content-Type: application/json

{ "email": "user@example.com", "password": "at-least-8-chars", "name": "الاسم" }
```
**نجاح (201):**
```json
{
  "user": { "id": "uuid", "email": "user@example.com", "role": "USER" },
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "e057991c-0c7f-...-756b-426c-a07f-d2053cd4483a"
}
```
كل حساب جديد بينعمل بدور `USER` دايمًا — ما فيه طريقة ترسلوا `role` بالـ body وتصيروا admin (السيرفر بيرفضه تلقائيًا بـ 400).

**أخطاء محتملة:**
- `400` — بيانات غير صالحة (إيميل غلط، باسورد أقل من 8 أحرف، اسم قصير...) مع تفاصيل الأخطاء بمصفوفة `message`
- `409` — الإيميل مستخدم من قبل

### تسجيل الدخول
```
POST /auth/login
Content-Type: application/json

{ "email": "user@example.com", "password": "..." }
```
**نجاح (200):** نفس شكل الـ register بالضبط (`user` + `accessToken` + `refreshToken`).
**فشل (401):** `{ "message": "Invalid email or password" }`

### الحصول على بيانات المستخدم الحالي
```
GET /auth/me
Authorization: Bearer <accessToken>
```
**نجاح (200):** `{ "id": "...", "email": "...", "role": "USER" | "ADMIN" }`
**بدون توكن أو توكن منتهي:** `401`

### تجديد التوكن (refresh)
```
POST /auth/refresh
Content-Type: application/json

{ "refreshToken": "<refreshToken المخزّن عندكم>" }
```
**نجاح (200):** نفس شكل الـ login — `accessToken` **و `refreshToken` جديدين**.

⚠️ **مهم:** كل مرة تعملوا refresh، الـ refreshToken القديم ينلغى فورًا (rotation) ولازم تستبدلوه بالجديد يلي رجع بنفس الاستجابة بالـ secure storage. إذا استخدمتوا القديم مرة تانية رح تاخدوا `401`.

استخدموه لما:
- يفتح التطبيق من جديد وعندكم refreshToken محفوظ من جلسة سابقة (لتجيبوا accessToken جديد بدون ما تطلبوا من المستخدم يسجل دخول من جديد)
- يوصلكم `401` من أي طلب محمي → جربوا `/auth/refresh` مرة وحدة بالـ refreshToken المخزّن، وإذا نجح أعيدوا الطلب الأصلي بالـ accessToken الجديد، وإذا فشل (`401`) → امسحوا كل شي محفوظ ووجّهوا المستخدم لصفحة تسجيل الدخول

### تسجيل الخروج
```
POST /auth/logout
Content-Type: application/json

{ "refreshToken": "<refreshToken الحالي>" }
```
بيلغي الـ refresh token من السيرفر (ما بيصير صالح حتى لو محفوظ عند حد). امسحوا `accessToken` و `refreshToken` من الـ secure storage بنفس اللحظة عندكم.

## 4. أين نخزّن التوكنات بالتطبيق؟

- استخدموا `flutter_secure_storage` (بيستخدم Keychain على iOS وEncryptedSharedPreferences/Keystore على أندرويد) — **مش** `SharedPreferences` العادي لأنه غير مشفّر.
- خزنوا فيه الاثنين: `accessToken` و `refreshToken`.
- عند إقلاع التطبيق: إذا في `refreshToken` محفوظ، نادوا `/auth/refresh` فورًا لتجيبوا `accessToken` صالح (بدل ما تخزنوا الـ accessToken القديم لأنه صلاحيته قصيرة، 15 دقيقة، ومن المرجح تكون منتهية).

## 5. الصلاحيات (Roles) بالواجهة

الحقل `role` يلي بيرجع من `/auth/me` أو `/auth/login` هو `"USER"` أو `"ADMIN"`. استخدموه لإخفاء/إظهار أقسام لوحة التحكم (متل صفحة إدارة المستخدمين). لكن **لا تعتمدوا على الفرونت وحده للحماية** — أي endpoint حساس محمي كمان من طرف السيرفر (لو مستخدم عادي حاول يوصل route خاص بالأدمن رح ياخد `403 Forbidden`).

## 6. أكواد الأخطاء الموحدة

| كود | معناه |
|---|---|
| `400` | بيانات الطلب غير صالحة — تفاصيل الحقول جوا `message` |
| `401` | مش مسجل دخول / التوكن (access أو refresh) منتهي أو غير صالح |
| `403` | مسجل دخول بس ما عندك صلاحية (مثلاً يوزر عادي عم يحاول يوصل route أدمن) |
| `409` | تعارض (مثلاً إيميل مسجل مسبقًا) |

## 7. مثال متكامل (Dio interceptor مبسّط)

```dart
class AuthInterceptor extends Interceptor {
  final Dio dio;
  final FlutterSecureStorage storage;
  AuthInterceptor(this.dio, this.storage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final accessToken = await storage.read(key: 'accessToken');
    if (accessToken != null) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401 && err.requestOptions.path != '/auth/refresh') {
      final refreshToken = await storage.read(key: 'refreshToken');
      if (refreshToken != null) {
        try {
          final res = await dio.post('/auth/refresh', data: {'refreshToken': refreshToken});
          await storage.write(key: 'accessToken', value: res.data['accessToken']);
          await storage.write(key: 'refreshToken', value: res.data['refreshToken']);

          final retryOptions = err.requestOptions;
          retryOptions.headers['Authorization'] = 'Bearer ${res.data['accessToken']}';
          final retryResponse = await dio.fetch(retryOptions);
          return handler.resolve(retryResponse);
        } catch (_) {
          await storage.deleteAll();
          // وجّهوا المستخدم لصفحة تسجيل الدخول من هون
        }
      }
    }
    handler.next(err);
  }
}
```

## 8. لسا مو جاهز (قيد التطوير)

- Endpoint توليد الفيديو بالذكاء الاصطناعي — رح يكون محمي بنفس نظام الـ auth هاد (لازم `accessToken` صالح بالـ `Authorization` header)، وتفاصيله رح توصلكم بمستند منفصل.
- تعديل الملف الشخصي / تغيير الباسورد — لسا مو موجود.
- Base URL الـ production — رح يوصلكم لما يصير الـ deployment جاهز.
