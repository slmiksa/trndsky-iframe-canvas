
# دليل نشر TrndSky TV - محدث

## 📋 الخطوات الصحيحة للنشر

### 1. بناء التطبيق (مهم جداً!)
```bash
# استخدم هذا الأمر بدلاً من npm run build العادي
node build-tv.js
```

**ملاحظة مهمة:** لا تستخدم `npm run build` العادي لأنه لن يقوم بإعداد التطبيق للمسار `/tv`

### 2. التحقق من البناء
بعد تشغيل `node build-tv.js`، تأكد من وجود:
```
dist-tv/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
├── .htaccess
└── nginx.conf
```

### 3. رفع الملفات الصحيحة
```bash
# ارفع محتويات مجلد dist-tv/ (وليس dist/)
# إلى trndsky.com/tv/

# مثال باستخدام FTP أو cPanel:
# - انتقل إلى مجلد /tv في موقعك
# - احذف جميع الملفات القديمة
# - ارفع جميع ملفات من dist-tv/
```

### 4. التحقق من الإعدادات

#### للـ Apache:
- تأكد من وجود ملف `.htaccess` في مجلد `/tv`
- تأكد من تفعيل mod_rewrite:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### للـ Nginx:
- أضف الإعدادات من `nginx.conf`
- أعد تشغيل Nginx:
```bash
sudo systemctl reload nginx
```

## 🔍 اختبار النشر

### 1. اختبار الوصول الأساسي
```bash
# تحقق من الصفحة الرئيسية
curl -I https://trndsky.com/tv

# يجب أن تحصل على:
# HTTP/1.1 200 OK
# Content-Type: text/html
```

### 2. اختبار الملفات الثابتة
```bash
# تحقق من تحميل JavaScript
curl -I https://trndsky.com/tv/assets/index-[hash].js

# يجب أن تحصل على:
# HTTP/1.1 200 OK
# Content-Type: application/javascript
```

### 3. اختبار التوجيه
```bash
# تحقق من عمل client-side routing
curl -I https://trndsky.com/tv/client/any-id

# يجب أن تحصل على:
# HTTP/1.1 200 OK (وليس 404)
```

## 🚨 حل المشاكل الشائعة

### الصفحة البيضاء أو أخطاء JavaScript

**السبب الأكثر شيوعاً:** رفع ملفات من مجلد `dist` بدلاً من `dist-tv`

**الحل:**
1. احذف جميع الملفات من `/tv`
2. قم بتشغيل `node build-tv.js` مرة أخرى
3. ارفع محتويات `dist-tv/` فقط

### خطأ 404 عند التنقل

**السبب:** إعدادات السيرفر غير صحيحة

**الحل للـ Apache:**
```apache
# في ملف .htaccess
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /tv/index.html [L]
```

### ملفات CSS/JS لا تحمل

**السبب:** MIME types غير مضبوطة

**الحل:**
```apache
# أضف إلى .htaccess
AddType application/javascript .js
AddType text/css .css
```

### مشاكل CORS مع Supabase

**السبب:** headers غير صحيحة

**الحل:**
```apache
# في .htaccess
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
```

## 📱 فحص المتصفح

افتح Developer Tools > Console ويجب أن ترى:
```
🚀 TrndSky TV تم تحميل الصفحة
🔧 وضع التليفزيون مفعل
```

إذا رأيت أخطاء في Console، فهذا يعني أن الملفات لم يتم رفعها بشكل صحيح.

## 🔄 التحديث

عند إجراء تحديثات:
```bash
# 1. بناء جديد
node build-tv.js

# 2. نسخ احتياطي (اختياري)
mv /path/to/tv /path/to/tv-backup

# 3. رفع الملفات الجديدة
# ارفع محتويات dist-tv/ إلى /tv

# 4. اختبار
curl https://trndsky.com/tv
```

## 📞 دعم إضافي

إذا استمرت المشاكل:
1. تحقق من سجلات السيرفر (server logs)
2. تحقق من Console في المتصفح
3. تأكد من أن المسار `/tv` موجود على السيرفر
4. تحقق من صلاحيات الملفات (755 للمجلدات، 644 للملفات)
