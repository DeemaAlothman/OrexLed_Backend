# نشر الباك اند عالسيرفر — OrexLed

هاد بيوثّق خطوات نشر الباك اند عالسيرفر (`217.76.53.136`)، حسب نفس الطريقة المتّبعة بباقي المشاريع عالسيرفر. البورت المخصّص لهاد المشروع هو **3020** (تأكدنا إنه فاضي، وما بيتعارض مع أي مشروع تاني عالسيرفر).

## الملفات المضافة لهيك الغرض

| الملف | الغرض |
|---|---|
| `Dockerfile` | بناء الصورة (multi-stage: build ثم runtime نظيف) |
| `docker-entrypoint.sh` | بيطبّق الـ migrations (`prisma migrate deploy`) تلقائيًا عند إقلاع الـ container، وبعدين يشغّل السيرفر |
| `docker-compose.prod.yml` | الـ stack الكامل (api + postgres) للسيرفر — **منفصل عن** `docker-compose.yml` يلي هو للتطوير المحلي فقط |
| `.env.production.example` | نموذج للمتغيرات المطلوبة بالسيرفر (بدون قيم حقيقية) |
| `.dockerignore` | يمنع نسخ `node_modules`/`.env`/`.git`... جوا صورة الـ build |

⚠️ **ملاحظة مهمة عن الـ postgres:** ما حطّيت `ports:` إلها بالكومبوز — الـ postgres تبع هاد المشروع بيتواصل مع الـ api بس عبر الشبكة الداخلية لدوكر (باسم الـ service `postgres`)، وما بيطلع عالسيرفر إطلاقًا. هيك صفر احتمال تعارض مع أي postgres تاني عالسيرفر (وفعليًا فيه أكتر من وحدة شغالة).

## خطوات النشر (أول مرة)

### 1. على السيرفر — استنساخ المشروع

```bash
ssh root@217.76.53.136
mkdir -p /root/orexled   # أو أي مسار بتحطوا فيه مشاريعكم
cd /root/orexled
git clone https://github.com/DeemaAlothman/OrexLed_Backend.git backend
cd backend
```

### 2. إنشاء ملف `.env` (ما بينرفع عالغيت)

```bash
nano .env
```

الصقوا محتوى مبني على [.env.production.example](../.env.production.example)، وعدّلوا:
- `POSTGRES_PASSWORD` — باسورد قوي (مش نفس القيمة الافتراضية بالتطوير)
- `DATABASE_URL` — لازم الـ host يكون `postgres` (اسم الـ service بالكومبوز)، مش `localhost`
- `JWT_ACCESS_SECRET` و `JWT_REFRESH_SECRET` — ولّدوهم بـ:
  ```bash
  openssl rand -base64 48
  ```
- `CORS_ORIGINS` — دومين الفرونت الفعلي بالـ production
- `PORT=3020`

بعد اللصق: `Ctrl+O` (حفظ) → `Enter` → `Ctrl+X` (خروج).

### 3. تشغيل الـ stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

⚠️ لاحظوا الفرق عن باقي مشاريعكم: هون لازم `-f docker-compose.prod.yml` لأنو اسم الملف مش الافتراضي (خليناه منفصل عن ملف التطوير المحلي المرفوع بنفس الريبو).

أول ما يطلع الـ container، `docker-entrypoint.sh` بيطبّق كل الـ migrations تلقائيًا (`prisma migrate deploy`) قبل ما يشغّل السيرفر — ما في داعي لأي خطوة يدوية إضافية لقاعدة البيانات.

### 4. التأكد إنه شغال

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
curl http://localhost:3020/health
```

الرابط النهائي: `http://217.76.53.136:3020`

## التحديثات اللاحقة (بعد أي تعديل عالكود)

```bash
cd /root/orexled/backend
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## أوامر مفيدة تانية

```bash
# إيقاف كل شي
docker compose -f docker-compose.prod.yml down

# إعادة بناء كاملة بدون أي cache (لو صار تغيير بالـ Dockerfile نفسه أو مشكلة غريبة)
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# متابعة اللوغز
docker compose -f docker-compose.prod.yml logs -f api

# فحص متغيرات البيئة الفعلية جوا الـ container (للتشخيص فقط)
docker compose -f docker-compose.prod.yml exec api env
```

## ملاحظة عن الصور المرفوعة (uploads)

الصور والفيديوهات يلي بتترفع من الفورمات (طلب عرض سعر، مشاريعنا، طلب صيانة) بتتخزّن بـ Docker volume اسمه `orexled_backend_prod_uploads` — بتضل موجودة حتى لو عملتوا `down` و `up` من جديد أو `--build`. ما بتنمسح إلا لو حد عمل `docker compose down -v` (بالـ `-v` تحديدًا) أو مسح الـ volume يدويًا.
