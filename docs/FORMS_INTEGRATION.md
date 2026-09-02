# دليل ربط الفورمات العامة مع الفرونت (Flutter) — OrexLed

هاد مستند منفصل عن [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) (يلي بيغطي الـ Auth فقط). هون بنوثق 4 فورمات جديدة تم تنفيذها وفحصها فعليًا على السيرفر المحلي. كل الـ Base URLs وطريقة تخزين التوكنات (لأدمن) نفسها المشروحة بمستند الـ Auth — ما رح نعيدها هون.

## ملاحظة مهمة قبل ما تبلشوا: `multipart/form-data` مش `JSON`

عدا فورم "كن مندوبنا"، كل الفورمات التانية فيها رفع صورة (وواحد فيه فيديو كمان)، فلازم ترسلوها كـ **`multipart/form-data`**، مش JSON. بـ Dio:

```dart
final formData = FormData.fromMap({
  'name': 'أحمد محمد',
  'phone': '+963991234567',
  'location': 'دمشق - المزة',
  'length': '3.5',
  'width': '2',
  'image': await MultipartFile.fromFile(imageFile.path, filename: 'site.jpg'),
});

final response = await dio.post('/quote-requests', data: formData);
```

⚠️ الحقول الرقمية (`length`, `width`) لازم تنبعتوا كـ string جوا الـ FormData (متل أي حقل نصي عادي) — الباك اند بيحولها لرقم تلقائيًا. ما تحاولوا تبعتوا `int`/`double` مباشرة لأنه `FormData` أصلًا كل قيمه strings.

## روابط الصور/الفيديوهات المرفوعة

أي حقل برجع بالاستجابة اسمه بينتهي بـ `Path` (متل `imagePath`, `videoPath`) هو **مسار نسبي**، مش رابط كامل. لازم تركّبوه فوق الـ base URL يدويًا:

```dart
final fullImageUrl = '$baseUrl${response.data['imagePath']}';
// مثال: http://10.0.2.2:3333/uploads/quote-requests/347a3930-....png
```

---

## 1. طلب عرض سعر — `/quote-requests`

أي زائر فيه يقدّم الطلب (بدون تسجيل دخول)، وفي حالتين لتعبئته:

### الحالة أ: زائر عادي (يكتب اسمه وموبايله بنفسه)

```
POST /quote-requests
Content-Type: multipart/form-data

name        (نص، 2-100 حرف)        — مطلوب
phone       (نص، رقم موبايل)       — مطلوب
location    (نص، 2-255 حرف)        — مطلوب
length      (رقم موجب)             — مطلوب
width       (رقم موجب)             — مطلوب
image       (ملف صورة jpeg/png/webp، حتى 5MB) — مطلوب
```

### الحالة ب: مندوب مسجّل (ما بيكتب اسمه ولا موبايله)

نفس الـ endpoint، بس بدل `name` و `phone` بتبعتوا:

```
representativeId  (uuid تبع المندوب، من استجابة POST /representatives) — مطلوب بدل name/phone
location, length, width, image — نفس الحالة أ
```

السيرفر بياخد الاسم والموبايل تلقائيًا من بيانات المندوب المسجّل — **حتى لو بعتوا `name`/`phone` مع `representativeId`، رح يتجاهلهم ويستخدم بيانات المندوب**.

### الاستجابة (201)

```json
{
  "id": "uuid",
  "name": "أحمد محمد",
  "phone": "+963991234567",
  "location": "دمشق - المزة",
  "length": 3.5,
  "width": 2,
  "imagePath": "/uploads/quote-requests/xxx.png",
  "createdAt": "2026-08-26T11:11:29.678Z",
  "representativeId": null
}
```

### أخطاء محتملة

| كود | السبب |
|---|---|
| `400` | صورة ناقصة، أو حقل غير صالح (موبايل غلط، رقم سالب...)، أو ما فيه `name`/`phone` ولا `representativeId` |
| `404` | `representativeId` مبعوت بس مش موجود عند السيرفر |

---

## 2. كن مندوبنا — `/representatives`

أي شخص فيه يقدّم الطلب ليصير مندوبًا (بدون تسجيل دخول). هاد الفورم الوحيد يلي **JSON عادي** (ما فيه ملفات):

```
POST /representatives
Content-Type: application/json

{
  "name": "خالد",
  "lineage": "العلي",
  "fatherName": "محمود",
  "motherName": "فاطمة الحسن",
  "birthPlace": "حلب",
  "birthDate": "1990-05-15",
  "nationalId": "01234567890",
  "gender": "MALE",
  "address": "حلب - الفرقان",
  "phone": "+963955112233",
  "shamCashWallet": "SC-99887"
}
```

| الحقل | النوع | ملاحظات |
|---|---|---|
| `name` | نص، 2-100 | الاسم |
| `lineage` | نص، 2-100 | النسبة |
| `fatherName` | نص، 2-100 | اسم الأب |
| `motherName` | نص، 2-150 | اسم ونسبة الأم مع بعض بحقل وحد |
| `birthPlace` | نص، 2-100 | محل الولادة |
| `birthDate` | تاريخ (`YYYY-MM-DD`) | تاريخ الولادة |
| `nationalId` | نص، أرقام فقط 6-15 خانة | **يجب يكون فريد** — لو مسجّل قبل هيك بيرجع 409 |
| `gender` | `"MALE"` أو `"FEMALE"` بالضبط | حساسة لحالة الأحرف |
| `address` | نص، 2-255 | العنوان |
| `phone` | نص، رقم موبايل | الموبايل |
| `shamCashWallet` | نص، حتى 50 حرف | **اختياري** — رقم محفظة شام كاش |

### الاستجابة (201)

```json
{
  "id": "ba83cd18-c7ac-4e4d-925f-1daef9bae844",
  "name": "خالد",
  ...
  "createdAt": "2026-08-26T11:29:18.314Z"
}
```

🔑 **مهم جدًا:** خزّنوا حقل `id` هاد عند المندوب بالتطبيق (secure storage) — هو الـ `representativeId` يلي رح يستخدمه بكل مرة يقدّم فيها طلب عرض سعر (القسم 1، الحالة ب). بدون ما يحتاج يسجّل دخول (مش جزء من نظام الـ Auth/JWT إطلاقًا).

### أخطاء محتملة

| كود | السبب |
|---|---|
| `400` | حقل ناقص أو غير صالح (مثلاً `gender` غير `MALE`/`FEMALE`، أو `nationalId` فيه حروف) |
| `409` | `nationalId` مسجّل من قبل |

---

## 3. مشاريعنا — `/projects`

معرض مشاريع الشركة. **الإضافة للأدمن فقط، والعرض لأي زائر.**

### عرض كل المشاريع (لأي زائر، بدون توكن)

```
GET /projects
```

**الاستجابة (200):**
```json
[
  {
    "id": "uuid",
    "imagePath": "/uploads/projects/images/xxx.png",
    "videoPath": "/uploads/projects/videos/xxx.mp4",
    "description": "مشروع إنارة LED لواجهة مبنى تجاري",
    "createdAt": "2026-08-26T11:57:02.671Z"
  }
]
```

### إضافة مشروع (أدمن فقط)

```
POST /projects
Authorization: Bearer <accessToken تبع أدمن>
Content-Type: multipart/form-data

description  (نص، 2-1000 حرف)                          — مطلوب
image        (ملف صورة jpeg/png/webp، حتى 5MB)          — مطلوب
video        (ملف فيديو mp4/webm/mov، حتى 100MB)        — مطلوب
```

هاد الفورم مش موجّه لتطبيق المستخدم العادي — هو لواجهة إدارة (لوحة تحكم) بتسجّل دخول كأدمن أولاً (نفس نظام الـ `/auth/login` المشروح بالمستند التاني) وبعدين تنادي هالـ endpoint بالـ `accessToken`.

### أخطاء محتملة

| كود | السبب |
|---|---|
| `400` | صورة أو فيديو ناقص، نوع ملف غير مدعوم، أو تجاوز الحجم المسموح |
| `401` | بدون توكن أصلًا |
| `403` | توكن صالح بس المستخدم مش أدمن (`role: "USER"`) |

---

## 4. طلب صيانة — `/maintenance-requests`

أي زائر فيه يقدّم بلاغ عن مشكلة (بدون تسجيل دخول). العرض للأدمن فقط.

### تقديم الطلب (عام)

```
POST /maintenance-requests
Content-Type: multipart/form-data

name      (نص، 2-100 حرف)                    — مطلوب
phone     (نص، رقم موبايل)                    — مطلوب
address   (نص، 2-255 حرف)                     — مطلوب
problem   (نص، 2-1000 حرف — وصف المشكلة)      — مطلوب
image     (ملف صورة jpeg/png/webp، حتى 5MB)   — مطلوب
```

**الاستجابة (201):**
```json
{
  "id": "uuid",
  "name": "سامر خليل",
  "phone": "+963966778899",
  "address": "دمشق - المالكي",
  "imagePath": "/uploads/maintenance-requests/xxx.png",
  "problem": "واحدة من وحدات الإنارة توقفت عن العمل",
  "createdAt": "2026-08-26T12:07:54.299Z"
}
```

### عرض الطلبات (أدمن فقط)

```
GET /maintenance-requests
Authorization: Bearer <accessToken تبع أدمن>
```

### أخطاء محتملة

| كود | السبب |
|---|---|
| `400` | صورة ناقصة أو حقل غير صالح |
| `401` / `403` | بس لـ `GET` — بدون توكن، أو توكن مش أدمن |

---

## 5. توليد فيديو بالذكاء الاصطناعي (Veo) — `/video-generations`

**لازم يكون المستخدم مسجّل دخول** (عكس كل الفورمات فوق) — هاد مو فورم عام. موجّه لأي مستخدم بده يجهّز محتوى فيديو لشاشاته الإعلامية.

كل مستخدم عندو **رصيد فيديوهات** (تفاصيله بالقسم 6 تحت) — كل طلب توليد بياخد وحدة من رصيدو، وبترجعلو الوحدة تلقائيًا لو التوليد فشل. لو رصيدو صفر، الطلب بيرجع `402` قبل ما يوصل لأي معالجة.

التوليد بياخد وقت (دقائق)، فالتصميم **غير متزامن**: `POST` بيرجع فورًا بحالة `PENDING`، والتطبيق لازم يعمل **polling** على `GET /video-generations/:id` لحد ما تصير الحالة `COMPLETED` أو `FAILED`.

### إنشاء طلب توليد

```
POST /video-generations
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

title        (نص، 2-150 حرف)                                 — مطلوب، عنوان تعرفوا فيه الفيديو لاحقًا
prompt       (نص، 5-2000 حرف)                                 — مطلوب، وصف الفيديو المطلوب توليده
style        ("REALISTIC" | "CINEMATIC" | "ANIMATED" | "MINIMAL") — اختياري
aspectRatio  ("LANDSCAPE" | "PORTRAIT")                        — اختياري، افتراضي LANDSCAPE
image        (ملف صورة jpeg/png/webp، حتى 5MB)                — اختياري، صورة مرجعية للتوليد منها
```

**الاستجابة (202 Accepted):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "إعلان شاشة",
  "prompt": "...",
  "style": "CINEMATIC",
  "aspectRatio": "LANDSCAPE",
  "imagePath": null,
  "status": "PENDING",
  "videoPath": null,
  "errorMessage": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### متابعة الحالة (polling)

```
GET /video-generations/:id
Authorization: Bearer <accessToken>
```

`status` بتاخد إحدى القيم: `PENDING` → `PROCESSING` → `COMPLETED` (وعندها `videoPath` بيصير فيه القيمة، ابنوا الرابط الكامل متل الصور: `baseUrl + videoPath`) أو `FAILED` (وعندها `errorMessage` بيشرح السبب).

كل مستخدم بيشوف بس طلباته هو — طلب مستخدم تاني بيرجع `403`.

### أخطاء محتملة

| كود | السبب |
|---|---|
| `400` | حقل ناقص/غير صالح، أو نوع صورة غير مدعوم |
| `401` | بدون توكن |
| `402` | رصيد الفيديوهات خلص — لازم شحن (شوفوا القسم 6) |
| `403` | حاولتوا تجيبوا حالة طلب مستخدم تاني |
| `404` | الـ id مش موجود |

⚠️ **ملاحظة مرحلية**: الربط مع Veo API لسا قيد الإعداد من طرفنا (تفعيل الفوترة على مشروع Google Cloud). لحد هلق أي طلب ناجح (رصيد كافي) بيرجع بالنهاية `status: "FAILED"` مع رسالة خطأ بالإنجليزية من Google. **الشكل والبيانات والـ endpoints نفسهم نهائيين وجاهزين للربط من الفرونت من هلق** — بما فيها منطق الرصيد (الخصم والاسترجاع التلقائي عند الفشل شغالين فعليًا الآن). بمجرد ما نفعّل الفوترة من طرفنا، التوليد الفعلي رح يبلش يشتغل بدون أي تغيير مطلوب عندكم.

---

## 6. رصيد الفيديوهات (المحفظة) — `/users`

كل حساب جديد (`POST /auth/register`) بيبلش تلقائيًا برصيد **3 فيديوهات مجانية**. لما يخلص، لازم الأدمن يشحن الحساب يدويًا (لحد ما نربط بوابة دفع حقيقية لاحقًا).

### بيانات حسابي (يشمل الرصيد الحالي)

```
GET /users/me
Authorization: Bearer <accessToken>
```

**الاستجابة (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "...",
  "role": "USER",
  "isActive": true,
  "videoCredits": 3,
  "createdAt": "..."
}
```

استخدموه لعرض "عندك X فيديوهات متبقية" بواجهة التطبيق — مثلاً بعد كل عملية تسجيل دخول أو قبل ما تفتحوا فورم توليد الفيديو.

### تاريخ حركات الرصيد (اختياري، لشاشة "سجل النشاط")

```
GET /users/me/credits/history
Authorization: Bearer <accessToken>
```

**الاستجابة (200):** مصفوفة مرتبة من الأحدث للأقدم:
```json
[
  {
    "id": "uuid",
    "type": "GENERATION_SPEND",
    "amount": -1,
    "balanceAfter": 2,
    "videoGenerationId": "uuid",
    "performedByUserId": null,
    "note": null,
    "createdAt": "..."
  }
]
```
`type` بتاخد: `INITIAL_GRANT` (المنحة الأولى عند التسجيل) / `GENERATION_SPEND` (استهلاك) / `GENERATION_REFUND` (استرجاع بعد فشل) / `ADMIN_TOPUP` (شحن من الأدمن).

### شحن رصيد مستخدم (أدمن فقط)

```
POST /users/:id/credits/top-up
Authorization: Bearer <accessToken تبع أدمن>
Content-Type: application/json

{ "amount": 10, "note": "شحن يدوي حسب طلب العميل" }
```
`amount` رقم صحيح موجب (مطلوب)، `note` نص اختياري حتى 255 حرف.

**الاستجابة (200):** بيانات المستخدم بعد التحديث (نفس شكل `GET /users/me` تقريبًا).

### أخطاء محتملة (قسم 6)

| كود | السبب |
|---|---|
| `400` | `amount` غير موجود أو سالب/صفر |
| `401` | بدون توكن |
| `403` | `top-up` من مستخدم مش أدمن |

---

## 7. جدول سريع — كل الفورمات مع بعض

| الفورم | Endpoint | مين يقدّم | نوع الطلب | ملفات مرفقة |
|---|---|---|---|---|
| طلب عرض سعر | `POST /quote-requests` | أي زائر (أو مندوب عبر `representativeId`) | multipart | صورة واحدة |
| كن مندوبنا | `POST /representatives` | أي زائر | JSON | لا يوجد |
| مشاريعنا (عرض) | `GET /projects` | أي زائر | — | — |
| مشاريعنا (إضافة) | `POST /projects` | أدمن فقط | multipart | صورة + فيديو |
| طلب صيانة (تقديم) | `POST /maintenance-requests` | أي زائر | multipart | صورة واحدة |
| طلب صيانة (عرض) | `GET /maintenance-requests` | أدمن فقط | — | — |
| توليد فيديو (إنشاء) | `POST /video-generations` | مستخدم مسجّل دخول | multipart | صورة اختيارية |
| توليد فيديو (حالة) | `GET /video-generations/:id` | نفس المستخدم أو أدمن | — | — |
| بياناتي + رصيدي | `GET /users/me` | مستخدم مسجّل دخول | — | — |
| تاريخ حركات رصيدي | `GET /users/me/credits/history` | مستخدم مسجّل دخول | — | — |
| شحن رصيد مستخدم | `POST /users/:id/credits/top-up` | أدمن فقط | JSON | — |

كل الـ endpoints العامة (POST) **ما بتحتاج `Authorization` header إطلاقًا** — لا تبعتوا توكن معها حتى لو المستخدم مسجّل دخول بالتطبيق، مش لازم. الاستثناء هو توليد الفيديو ورصيد المستخدم (قسم 5 و 6) — هاد كله لازم توكن.
