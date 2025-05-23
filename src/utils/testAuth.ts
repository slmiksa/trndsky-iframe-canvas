
import bcrypt from 'bcryptjs';

// دالة لاختبار كلمة المرور
export const testSuperAdminPassword = async () => {
  const testPassword = 'Salem_ss1412';
  const storedHash = '$2a$10$yF3vZxH7qQr5vKhGcnJ1Xe8RdKpP7mQzNcW4tL9xVbJ6eA2kS3nBu';
  
  console.log('Testing password:', testPassword);
  console.log('Against hash:', storedHash);
  
  const result = await bcrypt.compare(testPassword, storedHash);
  console.log('Password test result:', result);
  
  // إنشاء hash جديد للمقارنة
  const newHash = await bcrypt.hash(testPassword, 10);
  console.log('New hash generated:', newHash);
  
  return result;
};
