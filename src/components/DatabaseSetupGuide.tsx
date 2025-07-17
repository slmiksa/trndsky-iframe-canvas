import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, ExternalLink, AlertTriangle } from 'lucide-react';

interface DatabaseSetupGuideProps {
  onSetupComplete?: () => void;
}

const DatabaseSetupGuide: React.FC<DatabaseSetupGuideProps> = ({ onSetupComplete }) => {
  const sqlScript = `-- Create account_videos table for video management
CREATE TABLE IF NOT EXISTS public.account_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS account_videos_account_id_idx ON public.account_videos(account_id);
CREATE INDEX IF NOT EXISTS account_videos_is_active_idx ON public.account_videos(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE public.account_videos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for account_videos
CREATE POLICY "Users can view their own videos" ON public.account_videos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.account_id = account_videos.account_id
        )
    );

CREATE POLICY "Users can insert videos for their accounts" ON public.account_videos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.account_id = account_videos.account_id
            AND ur.role IN ('account_user', 'super_admin')
        )
    );

CREATE POLICY "Users can update their own videos" ON public.account_videos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.account_id = account_videos.account_id
            AND ur.role IN ('account_user', 'super_admin')
        )
    );

CREATE POLICY "Users can delete their own videos" ON public.account_videos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.account_id = account_videos.account_id
            AND ur.role IN ('account_user', 'super_admin')
        )
    );

-- Super admin can access all videos
CREATE POLICY "Super admin can access all videos" ON public.account_videos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'super_admin'
        )
    );

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_account_videos_updated_at
    BEFORE UPDATE ON public.account_videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.account_videos TO authenticated;
GRANT ALL ON public.account_videos TO service_role;`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      alert('تم نسخ الكود! الصقه في SQL Editor في Supabase');
    } catch (err) {
      console.error('فشل في نسخ النص:', err);
      // Fallback: create a text area and select it
      const textArea = document.createElement('textarea');
      textArea.value = sqlScript;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('تم نسخ الكود! الصقه في SQL Editor في Supabase');
    }
  };

  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>جدول الفيديوهات غير موجود</strong>
          <br />
          يجب إنشاء جدول الفيديوهات في قاعدة البيانات أولاً لاستخدام هذه الميزة.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            إعداد قاعدة البيانات للفيديوهات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">خطوات الإعداد:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>اذهب إلى Supabase Dashboard</li>
              <li>افتح SQL Editor</li>
              <li>انسخ الكود أدناه والصقه</li>
              <li>اضغط "Run" لتنفيذ الكود</li>
              <li>ارجع وحدث الصفحة</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button onClick={copyToClipboard} className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              نسخ كود SQL
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              فتح Supabase Dashboard
            </Button>
          </div>

          <details className="border rounded-lg p-3">
            <summary className="cursor-pointer font-medium">عرض كود SQL</summary>
            <pre className="mt-3 bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
              {sqlScript}
            </pre>
          </details>

          {onSetupComplete && (
            <Button 
              onClick={onSetupComplete} 
              variant="outline" 
              className="w-full"
            >
              تم إنشاء الجدول - حدث الصفحة
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseSetupGuide;