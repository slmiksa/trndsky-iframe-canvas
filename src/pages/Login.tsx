import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { testSuperAdminPassword } from '@/utils/testAuth';
import { generateCorrectHash } from '@/utils/generateHash';
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    signIn
  } = useAuth();
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
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900">
      <Card className="w-full max-w-md">
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
    </div>;
};
export default Login;