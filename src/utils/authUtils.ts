
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

// بيانات السوبر أدمن المحددة مسبقاً
const SUPER_ADMIN_CREDENTIALS: SuperAdminCredentials = {
  id: 'super-admin-001',
  username: 'trndsky',
  password_hash: '$2a$10$yF3vZxH7qQr5vKhGcnJ1Xe8RdKpP7mQzNcW4tL9xVbJ6eA2kS3nBu', // Salem_ss1412
  role: 'super_admin',
  created_at: new Date().toISOString()
};

export const authenticateUser = async (credentials: LoginCredentials) => {
  const { username, password } = credentials;

  // التحقق من السوبر أدمن
  if (username === SUPER_ADMIN_CREDENTIALS.username) {
    const isValidPassword = await bcrypt.compare(password, SUPER_ADMIN_CREDENTIALS.password_hash);
    if (isValidPassword) {
      return {
        user: SUPER_ADMIN_CREDENTIALS,
        role: 'super_admin',
        account_id: null
      };
    }
  }

  // التحقق من حسابات العملاء
  const { data: account, error } = await supabase
    .from('accounts')
    .select('id, name, email, password_hash, status')
    .eq('email', username) // يمكن استخدام الإيميل كاسم مستخدم
    .eq('status', 'active')
    .single();

  if (error || !account) {
    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  const isValidPassword = await bcrypt.compare(password, account.password_hash);
  if (!isValidPassword) {
    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  }

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
