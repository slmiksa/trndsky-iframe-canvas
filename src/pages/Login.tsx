import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { testSuperAdminPassword } from '@/utils/testAuth';
import { generateCorrectHash } from '@/utils/generateHash';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight } from 'lucide-react';
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    signIn
  } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(username, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleTestPassword = async () => {
    console.log('Testing super admin password...');
    const result = await testSuperAdminPassword();
    console.log('Test completed, result:', result);
  };
  const handleGenerateHash = async () => {
    console.log('Generating new hash...');
    const newHash = await generateCorrectHash();
    console.log('New hash ready to use:', newHash);
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* زر الرجوع للرئيسية */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-white hover:text-blue-300 transition-colors">
            <ArrowRight className="w-5 h-5 ml-2" />
            {t('back_to_home')}
          </Link>
        </div>
        
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">TRNDSKY</CardTitle>
            <p className="text-muted-foreground">تسجيل الدخول إلى النظام</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="أدخل اسم المستخدم" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="أدخل كلمة المرور" dir="ltr" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Login;