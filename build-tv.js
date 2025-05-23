
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 بناء تطبيق TrndSky TV للنشر...');

// Set environment variables for TV build
process.env.VITE_BASE_PATH = '/tv';
process.env.VITE_BUILD_DIR = 'dist-tv';
process.env.NODE_ENV = 'production';

try {
    // Clean previous build
    if (fs.existsSync('dist-tv')) {
        console.log('🧹 تنظيف البناء السابق...');
        fs.rmSync('dist-tv', { recursive: true, force: true });
    }

    // Build the project with TV-specific settings
    console.log('⚡ بناء المشروع...');
    execSync('npx vite build --outDir dist-tv --base /tv/', { stdio: 'inherit' });

    // Fix the generated index.html to have correct paths and structure
    console.log('🔧 إصلاح ملف index.html...');
    const indexPath = path.join('dist-tv', 'index.html');
    
    if (fs.existsSync(indexPath)) {
        let indexContent = fs.readFileSync(indexPath, 'utf8');
        
        // Ensure all asset paths are correct for /tv/ base path
        indexContent = indexContent.replace(/href="\/assets\//g, 'href="/tv/assets/');
        indexContent = indexContent.replace(/src="\/assets\//g, 'src="/tv/assets/');
        
        // Add essential debugging and error handling
        const debugScript = `
    <script>
        // Debug logging for TV deployment
        console.log('🚀 TrndSky TV تم تحميل الصفحة');
        console.log('🔧 Base path:', '/tv/');
        console.log('🌐 Current URL:', window.location.href);
        
        // Error handling for failed module loads
        window.addEventListener('error', function(e) {
            console.error('❌ خطأ في التحميل:', e);
            if (e.message && e.message.includes('module')) {
                console.error('🔍 مشكلة في تحميل الوحدات - تحقق من مسارات الملفات');
            }
        });
        
        // Monitor resource loading
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.name.includes('.js') || entry.name.includes('.css')) {
                    console.log('📦 تم تحميل:', entry.name);
                }
            });
        });
        observer.observe({entryTypes: ['navigation', 'resource']});
    </script>`;
        
        // Insert debug script before closing head tag
        indexContent = indexContent.replace('</head>', debugScript + '\n</head>');
        
        // Write the fixed content back
        fs.writeFileSync(indexPath, indexContent);
        console.log('✅ تم إصلاح index.html');
    }

    // Copy and update .htaccess with improved rules
    console.log('⚙️ إنشاء ملف .htaccess محسن...');
    const htaccessContent = `# TrndSky TV Apache Configuration - Updated
RewriteEngine On

# Force correct MIME types for JavaScript modules
<FilesMatch "\\.js$">
    Header set Content-Type "application/javascript"
    Header set X-Content-Type-Options "nosniff"
</FilesMatch>

<FilesMatch "\\.mjs$">
    Header set Content-Type "application/javascript"
    Header set X-Content-Type-Options "nosniff"
</FilesMatch>

# Set correct MIME types
AddType application/javascript .js .mjs
AddType text/css .css
AddType application/json .json

# Handle client-side routing - redirect all requests to index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/tv/assets/
RewriteRule ^(.*)$ /tv/index.html [L,QSA]

# CORS headers for Supabase integration
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"

# Handle preflight requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Security headers
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/json "access plus 1 month"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Prevent access to sensitive files
<Files ~ "^\.">
    Order allow,deny
    Deny from all
</Files>`;

    fs.writeFileSync(path.join('dist-tv', '.htaccess'), htaccessContent);
    console.log('✅ تم إنشاء .htaccess محسن');

    // Create a simple test file to verify server setup
    const testContent = `<!DOCTYPE html>
<html>
<head>
    <title>TrndSky TV - Server Test</title>
</head>
<body>
    <h1>✅ السيرفر يعمل بشكل صحيح</h1>
    <p>إذا كنت ترى هذه الرسالة، فإن إعدادات السيرفر صحيحة.</p>
    <script>
        console.log('✅ JavaScript يعمل');
        document.body.innerHTML += '<p style="color: green;">✅ JavaScript محمل بنجاح</p>';
    </script>
</body>
</html>`;
    fs.writeFileSync(path.join('dist-tv', 'test.html'), testContent);
    console.log('✅ تم إنشاء ملف اختبار');

    // Verify critical files exist and show their sizes
    console.log('\n🔍 التحقق من الملفات الأساسية...');
    const criticalFiles = ['index.html', 'assets', '.htaccess', 'test.html'];
    let allFilesExist = true;
    
    criticalFiles.forEach(file => {
        const filePath = path.join('dist-tv', file);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ ملف مفقود: ${file}`);
            allFilesExist = false;
        } else {
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                const files = fs.readdirSync(filePath);
                console.log(`✅ مجلد ${file}: ${files.length} ملف`);
            } else {
                console.log(`✅ ملف ${file}: ${(stats.size / 1024).toFixed(2)} KB`);
            }
        }
    });

    if (!allFilesExist) {
        throw new Error('بعض الملفات الأساسية مفقودة من البناء');
    }

    // Check assets directory content
    const assetsPath = path.join('dist-tv', 'assets');
    if (fs.existsSync(assetsPath)) {
        const assetFiles = fs.readdirSync(assetsPath);
        console.log('\n📦 ملفات Assets:');
        assetFiles.forEach(file => {
            const filePath = path.join(assetsPath, file);
            const stats = fs.statSync(filePath);
            const size = (stats.size / 1024).toFixed(2);
            console.log(`  📄 ${file}: ${size} KB`);
        });
    }

    console.log('\n🎉 تم بناء التطبيق بنجاح!');
    console.log('📁 الملفات متوفرة في مجلد: dist-tv/');
    console.log('\n📋 خطوات النشر:');
    console.log('1. ارفع محتويات مجلد dist-tv/ إلى trndsky.com/tv/');
    console.log('2. اختبر أولاً: https://trndsky.com/tv/test.html');
    console.log('3. ثم اختبر التطبيق: https://trndsky.com/tv');
    console.log('\n🔧 للتشخيص:');
    console.log('- افتح Developer Tools > Console');
    console.log('- ابحث عن رسائل التشخيص');
    console.log('- تحقق من تحميل الملفات في Network tab');

} catch (error) {
    console.error('❌ خطأ في البناء:', error.message);
    console.error('\n🔧 نصائح لحل المشكلة:');
    console.error('1. تأكد من تشغيل npm install أولاً');
    console.error('2. تحقق من عدم وجود أخطاء في الكود');
    console.error('3. تأكد من أن جميع الملفات المطلوبة موجودة');
    process.exit(1);
}
