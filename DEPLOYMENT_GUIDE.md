
# دليل نشر TrndSky TV

## 📋 متطلبات النشر

### 1. بناء التطبيق
```bash
# تشغيل البناء المخصص للتليفزيون
node build-tv.js

# أو باستخدام npm
npm run build:tv
```

### 2. رفع الملفات
- ارفع **جميع محتويات** مجلد `dist-tv/` إلى `trndsky.com/tv/`
- تأكد من أن structure المجلد كما يلي:
```
trndsky.com/tv/
├── index.html
├── assets/
│   ├── index.css
│   ├── index.js
│   └── [other assets]
├── .htaccess (للـ Apache)
└── nginx.conf (للـ Nginx)
```

## ⚙️ إعداد السيرفر

### Apache
- ضع ملف `.htaccess` في مجلد `/tv`
- تأكد من تفعيل mod_rewrite
- تأكد من تفعيل mod_headers للـ CORS

### Nginx
- أضف التكوين من `nginx.conf` إلى إعدادات السيرفر
- أعد تشغيل Nginx: `sudo systemctl reload nginx`

## 🔒 متطلبات الأمان

### HTTPS (مطلوب للـ Realtime)
```bash
# تأكد من أن SSL مفعل
sudo certbot --apache -d trndsky.com

# أو للـ Nginx
sudo certbot --nginx -d trndsky.com
```

### إعدادات CORS
- السيرفر مُعدّ للسماح بطلبات من جميع المصادر
- في الإنتاج، قم بتخصيص CORS للمجالات المطلوبة فقط

## 🧪 الاختبار

### 1. اختبار أساسي
```bash
# تحقق من وصول الموقع
curl https://trndsky.com/tv

# تحقق من الـ routing
curl https://trndsky.com/tv/client/any-account-id
```

### 2. اختبار Realtime
- افتح `https://trndsky.com/tv` في المتصفح
- افتح لوحة التحكم في نافذة أخرى
- قم بتفعيل/إلغاء تفعيل موقع
- تأكد من التحديث الفوري في صفحة التليفزيون

### 3. اختبار وحدة التحكم
```javascript
// افتح Developer Tools > Console
// يجب أن ترى:
"🚀 TrndSky TV تم تحميل الصفحة"
"🔧 وضع التليفزيون مفعل"
"🔄 Setting up realtime listener for websites"
"✅ Successfully subscribed to realtime updates!"
```

## 🚨 استكشاف الأخطاء

### مشاكل شائعة:

#### 1. 404 خطأ في التوجيه
```bash
# تحقق من .htaccess أو nginx.conf
# تأكد من تفعيل mod_rewrite (Apache)
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### 2. مشاكل CORS
```bash
# تحقق من headers
curl -H "Origin: https://trndsky.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://trndsky.com/tv
```

#### 3. Realtime لا يعمل
- تأكد من تفعيل HTTPS
- تحقق من console logs
- تأكد من صحة إعدادات Supabase

### لوحة مراقبة الأخطاء:
```javascript
// أضف إلى console للمراقبة المستمرة
setInterval(() => {
  console.log('🔄 حالة الاتصال:', navigator.onLine ? 'متصل' : 'منقطع');
  console.log('🕐 الوقت:', new Date().toLocaleString('ar-SA'));
}, 30000);
```

## 📱 تحسين الأداء

### 1. ضغط الملفات
- الإعدادات موجودة في .htaccess و nginx.conf
- تحقق من تفعيل gzip compression

### 2. Cache
- ملفات CSS/JS يتم cache لمدة سنة
- HTML لا يتم cache للحصول على أحدث المحتوى

### 3. CDN (اختياري)
```bash
# يمكنك استخدام Cloudflare لتحسين الأداء
# تأكد من إعدادات SSL/TLS: Full (strict)
```

## 🔄 التحديث

لتحديث التطبيق:
```bash
# 1. بناء جديد
node build-tv.js

# 2. رفع الملفات الجديدة
rsync -av dist-tv/ user@server:/var/www/trndsky.com/tv/

# 3. اختبار
curl https://trndsky.com/tv
```

## 📞 الدعم الفني

في حالة وجود مشاكل:
1. تحقق من console logs في المتصفح
2. تحقق من server logs
3. تأكد من إعدادات DNS
4. اختبر الاتصال بـ Supabase
