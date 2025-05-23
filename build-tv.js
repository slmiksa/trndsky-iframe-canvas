
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

    // Build the project
    console.log('⚡ بناء المشروع...');
    execSync('npm run build', { stdio: 'inherit' });

    // Copy TV-specific index.html
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

    console.log('\n🎉 تم بناء التطبيق بنجاح!');
    console.log('📁 الملفات متوفرة في مجلد: dist-tv/');
    console.log('\n📋 خطوات النشر:');
    console.log('1. ارفع محتويات مجلد dist-tv/ إلى trndsky.com/tv/');
    console.log('2. تأكد من إعدادات السيرفر (Apache أو Nginx)');
    console.log('3. اختبر الرابط: https://trndsky.com/tv');
    console.log('\n🔄 للتحديثات المباشرة، تأكد من أن HTTPS مفعل!');

} catch (error) {
    console.error('❌ خطأ في البناء:', error.message);
    process.exit(1);
}
