
import bcrypt from 'bcryptjs';

// دالة لتوليد هاش جديد
export const generateCorrectHash = async () => {
  const password = 'Salem_ss1412';
  const saltRounds = 10;
  
  console.log('Generating hash for password:', password);
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Generated hash:', hash);
  
  // اختبار الهاش المولد
  const testResult = await bcrypt.compare(password, hash);
  console.log('Hash verification test:', testResult);
  
  return hash;
};
