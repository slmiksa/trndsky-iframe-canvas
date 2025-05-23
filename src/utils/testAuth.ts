
import bcrypt from 'bcryptjs';

// دالة لاختبار كلمة المرور
export const testSuperAdminPassword = async () => {
  const testPassword = 'Salem_ss1412';
  const newCorrectHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
  
  console.log('Testing password:', testPassword);
  console.log('Against new hash:', newCorrectHash);
  
  const result = await bcrypt.compare(testPassword, newCorrectHash);
  console.log('Password test result:', result);
  
  // إنشاء hash جديد للمقارنة
  const newHash = await bcrypt.hash(testPassword, 10);
  console.log('New hash generated:', newHash);
  
  // اختبار الهاش الجديد المولد
  const newHashTest = await bcrypt.compare(testPassword, newHash);
  console.log('New hash test result:', newHashTest);
  
  return result;
};
