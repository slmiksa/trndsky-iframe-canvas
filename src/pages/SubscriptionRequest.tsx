import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

const SubscriptionRequest = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  const subscriptionSchema = z.object({
    fullName: z.string().min(2, t('name_min_error')),
    email: z.string().email(t('email_invalid_error')),
    phone: z.string().min(10, t('phone_min_error')),
    companyName: z.string().min(2, t('company_required_error'))
  });

  type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      companyName: ''
    }
  });

  const onSubmit = async (data: SubscriptionFormData) => {
    setIsSubmitting(true);
    try {
      console.log('Submitting subscription request:', data);

      // حفظ طلب الاشتراك في قاعدة البيانات
      const {
        data: subscriptionRequest,
        error: dbError
      } = await supabase.from('subscription_requests').insert({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        company_name: data.companyName
      }).select().single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      console.log('Subscription request saved:', subscriptionRequest);

      // إرسال الإيميلات
      const {
        error: emailError
      } = await supabase.functions.invoke('send-subscription-emails', {
        body: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          companyName: data.companyName
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        // لا نوقف العملية إذا فشل الإيميل
        toast.warning(t('email_warning'));
      } else {
        console.log('Emails sent successfully');
      }

      toast.success(t('request_success'));
      form.reset();
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(t('request_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-6">
            <Link to="/" className="inline-flex items-center text-white hover:text-blue-300 transition-colors">
              <ArrowRight className="w-5 h-5 ml-2" />
              {t('back_to_home')}
            </Link>
            <LanguageToggle />
          </div>
          
          <div className="flex justify-center mb-6">
            <img src="/lovable-uploads/e3d01953-fe35-45d7-ac2b-e50bac917958.png" alt="TRNDSKY Logo" className="w-20 h-20 object-contain" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">{t('subscription_request_title')}</h1>
          
          <p className="text-white/80 text-sm">
            {t('subscription_request_subtitle')}
          </p>
        </div>

        {/* Subscription Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">{t('full_name')}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={t('full_name_placeholder')} 
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/60" 
                      />
                    </FormControl>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">{t('email')}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email" 
                        placeholder={t('email_placeholder')} 
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/60" 
                      />
                    </FormControl>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">{t('phone_number')}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={t('phone_placeholder')} 
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/60" 
                      />
                    </FormControl>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">{t('company_name')}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={t('company_name_placeholder')} 
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/60" 
                      />
                    </FormControl>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg mt-6"
              >
                {isSubmitting ? t('submitting') : t('submit_request')}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionRequest;