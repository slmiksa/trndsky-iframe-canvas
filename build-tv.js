
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

    // Copy TV-specific index.html if it exists
    console.log('📄 نسخ ملف HTML المخصص للتليفزيون...');
    const tvIndexPath = path.join('public', 'tv-index.html');
    const distIndexPath = path.join('dist-tv', 'index.html');
    
    if (fs.existsSync(tvIndexPath)) {
        fs.copyFileSync(tvIndexPath, distIndexPath);
        console.log('✅ تم نسخ index.html المخصص');
    } else {
        console.warn('⚠️  لم يتم العثور على tv-index.html، سيتم استخدام الملف الافتراضي');
    }

    // Copy server configuration files
    console.log('⚙️ نسخ ملفات إعداد السيرفر...');
    const serverFiles = ['.htaccess', 'nginx.conf'];
    serverFiles.forEach(file => {
        const srcPath = path.join('public', file);
        const destPath = path.join('dist-tv', file);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`✅ تم نسخ ${file}`);
        }
    });

    // Verify critical files exist
    console.log('🔍 التحقق من الملفات الأساسية...');
    const criticalFiles = ['index.html', 'assets'];
    let allFilesExist = true;
    
    criticalFiles.forEach(file => {
        const filePath = path.join('dist-tv', file);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ ملف مفقود: ${file}`);
            allFilesExist = false;
        } else {
            console.log(`✅ تم العثور على: ${file}`);
        }
    });

    if (!allFilesExist) {
        throw new Error('بعض الملفات الأساسية مفقودة من البناء');
    }

    console.log('\n🎉 تم بناء التطبيق بنجاح!');
    console.log('📁 الملفات متوفرة في مجلد: dist-tv/');
    console.log('\n📋 خطوات النشر:');
    console.log('1. ارفع محتويات مجلد dist-tv/ إلى trndsky.com/tv/');
    console.log('2. تأكد من إعدادات السيرفر (Apache أو Nginx)');
    console.log('3. اختبر الرابط: https://trndsky.com/tv');
    console.log('\n🔄 للتحديثات المباشرة، تأكد من أن HTTPS مفعل!');
    
    // List contents of dist-tv for verification
    console.log('\n📂 محتويات مجلد dist-tv:');
    const distContents = fs.readdirSync('dist-tv');
    distContents.forEach(item => {
        const itemPath = path.join('dist-tv', item);
        const isDir = fs.statSync(itemPath).isDirectory();
        console.log(`  ${isDir ? '📁' : '📄'} ${item}`);
    });

} catch (error) {
    console.error('❌ خطأ في البناء:', error.message);
    console.error('\n🔧 نصائح لحل المشكلة:');
    console.error('1. تأكد من تشغيل npm install أولاً');
    console.error('2. تحقق من عدم وجود أخطاء في الكود');
    console.error('3. تأكد من أن جميع الملفات المطلوبة موجودة');
    process.exit(1);
}
