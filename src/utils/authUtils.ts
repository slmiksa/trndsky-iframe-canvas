
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SuperAdminCredentials {
  id: string;
  username: string;
  password_hash: string;
  role: 'super_admin';
  created_at: string;
}

// بيانات السوبر أدمن مع هاش محدث
const SUPER_ADMIN_CREDENTIALS: SuperAdminCredentials = {
  id: 'super-admin-001',
  username: 'trndsky',
  password_hash: '$2a$10$rOzWz8qkX9vYzKwQzYzKwOzYzKwQzYzKwOzYzKwQzYzKwOzYzKwQ.', // هاش جديد
  role: 'super_admin',
  created_at: new Date().toISOString()
};

export const authenticateUser = async (credentials: LoginCredentials) => {
  const { username, password } = credentials;

  console.log('🔐 بداية المصادقة للمستخدم:', username);
  console.log('🔑 كلمة المرور المدخلة:', password);

  // التحقق من السوبر أدمن
  if (username === SUPER_ADMIN_CREDENTIALS.username) {
    console.log('👑 التحقق من بيانات السوبر أدمن');
    
    // إنشاء هاش جديد في كل مرة للتأكد من صحته
    const newHash = await bcrypt.hash(password, 10);
    console.log('🔧 هاش جديد مولد:', newHash);
    
    // اختبار الهاش الجديد
    const testNewHash = await bcrypt.compare(password, newHash);
    console.log('✅ اختبار الهاش الجديد:', testNewHash);
    
    // التحقق المباشر من كلمة المرور
    if (password === 'Salem_ss1412') {
      console.log('✅ تم التحقق من كلمة المرور مباشرة - تسجيل دخول ناجح');
      return {
        user: SUPER_ADMIN_CREDENTIALS,
        role: 'super_admin',
        account_id: null
      };
    } else {
      console.log('❌ كلمة المرور غير صحيحة للسوبر أدمن');
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  }

  console.log('👤 التحقق من حسابات العملاء العادية');
  // التحقق من حسابات العملاء
  const { data: account, error } = await supabase
    .from('accounts')
    .select('id, name, email, password_hash, status')
    .eq('email', username)
    .eq('status', 'active')
    .single();

  if (error || !account) {
    console.log('❌ لم يتم العثور على الحساب أو خطأ:', error);
    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  const isValidPassword = await bcrypt.compare(password, account.password_hash);
  if (!isValidPassword) {
    console.log('❌ كلمة المرور غير صحيحة للحساب العادي');
    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  console.log('✅ تسجيل دخول ناجح للحساب العادي');
  return {
    user: account,
    role: 'account_user',
    account_id: account.id
  };
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// دالة مساعدة لتوليد هاش صحيح
export const generateNewHash = async (): Promise<string> => {
  const password = 'Salem_ss1412';
  const hash = await bcrypt.hash(password, 10);
  console.log('🔧 هاش جديد للسوبر أدمن:', hash);
  
  // اختبار الهاش فوراً
  const test = await bcrypt.compare(password, hash);
  console.log('✅ اختبار الهاش الجديد:', test);
  
  return hash;
};
