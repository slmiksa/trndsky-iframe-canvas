import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
const subscriptionSchema = z.object({
  fullName: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().min(10, 'رقم الهاتف يجب أن يكون على الأقل 10 أرقام'),
  companyName: z.string().min(2, 'اسم الشركة مطلوب'),
  plan: z.enum(['basic', 'premium', 'enterprise'], {
    required_error: 'يرجى اختيار خطة الاشتراك'
  })
});
type SubscriptionFormData = z.infer<typeof subscriptionSchema>;
const SubscriptionRequest = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      companyName: '',
      plan: 'basic'
    }
  });
  const onSubmit = async (data: SubscriptionFormData) => {
    setIsSubmitting(true);
    try {
      // محاكاة إرسال البيانات
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Subscription request data:', data);
      toast.success('تم إرسال طلب الاشتراك بنجاح! سنتواصل معك قريباً.');
      form.reset();
    } catch (error) {
      toast.error('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const plans = [{
    id: 'basic',
    name: 'الخطة الأساسية',
    price: '299 ريال/شهرياً',
    features: ['إدارة 5 شاشات', 'دعم فني أساسي', 'تقارير شهرية']
  }, {
    id: 'premium',
    name: 'الخطة المتقدمة',
    price: '599 ريال/شهرياً',
    features: ['إدارة 15 شاشة', 'دعم فني متقدم', 'تقارير أسبوعية', 'تخصيص التصميم']
  }, {
    id: 'enterprise',
    name: 'خطة المؤسسات',
    price: 'حسب الطلب',
    features: ['شاشات غير محدودة', 'دعم فني مخصص', 'تقارير يومية', 'تكامل مخصص']
  }];
  return <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-white hover:text-blue-300 transition-colors mb-6">
            <ArrowRight className="w-5 h-5 ml-2" />
            العودة للصفحة الرئيسية
          </Link>
          
          <div className="flex justify-center mb-6">
            <img src="/lovable-uploads/e3d01953-fe35-45d7-ac2b-e50bac917958.png" alt="TRNDSKY Logo" className="w-24 h-24 sm:w-32 sm:h-32 object-contain" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            طلب الاشتراك في TRNDSKY
          </h1>
          
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            انضم إلى منصة TRNDSKY وابدأ في إدارة شاشاتك ومواقعك بكفاءة عالية
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Subscription Plans */}
          

          {/* Subscription Form */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mx-0 my-0 py-[24px]">
            <h2 className="text-2xl font-bold text-white mb-6">معلومات الاشتراك</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="fullName" render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-white">الاسم الكامل</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="أدخل اسمك الكامل" className="bg-white/20 border-white/30 text-white placeholder:text-white/60" />
                      </FormControl>
                      <FormMessage className="text-red-300" />
                    </FormItem>} />

                <FormField control={form.control} name="email" render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-white">البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="example@company.com" className="bg-white/20 border-white/30 text-white placeholder:text-white/60" />
                      </FormControl>
                      <FormMessage className="text-red-300" />
                    </FormItem>} />

                <FormField control={form.control} name="phone" render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-white">رقم الهاتف</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="05xxxxxxxx" className="bg-white/20 border-white/30 text-white placeholder:text-white/60" />
                      </FormControl>
                      <FormMessage className="text-red-300" />
                    </FormItem>} />

                <FormField control={form.control} name="companyName" render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-white">اسم الشركة</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="أدخل اسم شركتك" className="bg-white/20 border-white/30 text-white placeholder:text-white/60" />
                      </FormControl>
                      <FormMessage className="text-red-300" />
                    </FormItem>} />

                <FormField control={form.control} name="plan" render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-white">اختر الخطة المناسبة</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-3">
                          {plans.map(plan => <div key={plan.id} className="flex items-center space-x-2 space-x-reverse">
                              <RadioGroupItem value={plan.id} id={plan.id} className="border-white/30 text-blue-400" />
                              <Label htmlFor={plan.id} className="text-white cursor-pointer flex-1">
                                {plan.name} - {plan.price}
                              </Label>
                            </div>)}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage className="text-red-300" />
                    </FormItem>} />

                <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
                  {isSubmitting ? 'جاري الإرسال...' : 'إرسال طلب الاشتراك'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>;
};
export default SubscriptionRequest;