
# دليل نشر TrndSky TV - النسخة المحدثة والمحسنة

## 🚀 الخطوات الجديدة للنشر (محسنة لحل مشاكل JavaScript)

### 1. بناء التطبيق (مهم جداً!)
```bash
# استخدم هذا الأمر الجديد المحسن
node build-tv.js
```

**التحسينات الجديدة:**
- إصلاح تلقائي لمسارات ملفات JavaScript و CSS
- إضافة console logs للتشخيص
- إنشاء ملف اختبار للسيرفر
- تحسين ملف .htaccess

### 2. اختبار البناء محلياً
```bash
# تحقق من وجود الملفات
ls -la dist-tv/
ls -la dist-tv/assets/

# تحقق من محتوى index.html
head -20 dist-tv/index.html
```

### 3. رفع الملفات بالترتيب الصحيح

#### الخطوة الأولى: رفع ملف الاختبار
```bash
# ارفع فقط test.html أولاً للتأكد من عمل السيرفر
# رفع إلى: trndsky.com/tv/test.html
```

#### الخطوة الثانية: اختبار السيرفر
```bash
# اختبر الرابط
curl -I https://trndsky.com/tv/test.html

# يجب أن تحصل على:
# HTTP/1.1 200 OK
# Content-Type: text/html
```

#### الخطوة الثالثة: رفع باقي الملفات
```bash
# بعد التأكد من عمل test.html، ارفع:
# - محتويات مجلد dist-tv/ بالكامل
# - إلى trndsky.com/tv/
```

### 4. اختبار شامل للتطبيق

#### اختبار 1: الوصول الأساسي
```bash
curl -I https://trndsky.com/tv
# توقع: HTTP/1.1 200 OK
```

#### اختبار 2: ملفات JavaScript
```bash
# اعثر على اسم ملف JS من assets
curl -I https://trndsky.com/tv/assets/index-[hash].js
# توقع: Content-Type: application/javascript
```

#### اختبار 3: Console في المتصفح
افتح https://trndsky.com/tv في متصفح وتحقق من Console:

**الرسائل المتوقعة:**
```
🚀 TrndSky TV تم تحميل الصفحة
🔧 Base path: /tv/
🌐 Current URL: https://trndsky.com/tv
📦 تم تحميل: /tv/assets/index-[hash].js
📦 تم تحميل: /tv/assets/index-[hash].css
```

**إذا رأيت أخطاء:**
```
❌ خطأ في التحميل: [error details]
🔍 مشكلة في تحميل الوحدات - تحقق من مسارات الملفات
```

### 5. حل المشاكل الشائعة

#### مشكلة: "Failed to load module script"

**الأسباب المحتملة:**
1. ملف .htaccess غير مرفوع أو غير صحيح
2. Apache mod_rewrite غير مفعل
3. صلاحيات الملفات غير صحيحة

**الحلول:**
```bash
# 1. تحقق من وجود .htaccess
curl -I https://trndsky.com/tv/.htaccess
# يجب أن يعطي 403 Forbidden (هذا طبيعي)

# 2. اختبر MIME type
curl -H "Accept: application/javascript" https://trndsky.com/tv/assets/index-[hash].js
# يجب أن يبدأ بـ import أو const

# 3. تحقق من صلاحيات الملفات (على السيرفر)
chmod 644 /path/to/tv/.htaccess
chmod 644 /path/to/tv/index.html
chmod -R 644 /path/to/tv/assets/*
chmod 755 /path/to/tv/
chmod 755 /path/to/tv/assets/
```

#### مشكلة: صفحة بيضاء

**التشخيص:**
1. افتح Developer Tools > Console
2. ابحث عن الأخطاء الحمراء
3. تحقق من Network tab - هل الملفات تحمل؟

**الحل:**
```bash
# إعادة بناء مع تشخيص إضافي
node build-tv.js

# رفع مرة أخرى مع التأكد من المسارات
```

#### مشكلة: 404 على الروابط الفرعية

**السبب:** قواعد التوجيه في .htaccess غير صحيحة

**التحقق:**
```bash
curl -I https://trndsky.com/tv/client/some-id
# يجب أن يعطي 200 وليس 404
```

### 6. إعدادات السيرفر المطلوبة

#### للـ Apache:
```bash
# تأكد من تفعيل الوحدات المطلوبة
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod deflate
sudo a2enmod expires
sudo systemctl restart apache2
```

#### للـ Nginx:
استخدم إعدادات nginx.conf المرفقة مع المشروع.

### 7. مراقبة الأداء

#### في Developer Tools:
1. **Console tab**: رسائل التشخيص
2. **Network tab**: تحميل الملفات وأوقات الاستجابة
3. **Performance tab**: أداء التطبيق

#### أوامر مفيدة:
```bash
# فحص سرعة التحميل
curl -o /dev/null -s -w "%{time_total}\n" https://trndsky.com/tv

# فحص حجم الملفات
curl -sI https://trndsky.com/tv/assets/index-[hash].js | grep Content-Length
```

### 8. التحديث المستقبلي

```bash
# عند إجراء تحديثات:
# 1. بناء جديد
node build-tv.js

# 2. نسخ احتياطي (اختياري)
mv /path/to/tv /path/to/tv-backup-$(date +%Y%m%d)

# 3. رفع الملفات الجديدة
# 4. اختبار

# 5. تنظيف الكاش إذا لزم الأمر
# Ctrl+F5 في المتصفح أو:
curl -H "Cache-Control: no-cache" https://trndsky.com/tv
```

## ✅ قائمة التحقق النهائية

- [ ] تم تشغيل `node build-tv.js` بنجاح
- [ ] مجلد `dist-tv` موجود ويحتوي على الملفات
- [ ] تم رفع جميع محتويات `dist-tv/` إلى `/tv/`
- [ ] https://trndsky.com/tv/test.html يعمل
- [ ] https://trndsky.com/tv يحمل بدون أخطاء
- [ ] Console يظهر الرسائل المتوقعة
- [ ] Network tab يظهر تحميل ناجح للملفات
- [ ] التنقل بين الصفحات يعمل

إذا اتبعت هذه الخطوات ولا زالت هناك مشاكل، شارك:
1. لقطة شاشة من Console
2. لقطة شاشة من Network tab
3. نتيجة `curl -I https://trndsky.com/tv`
