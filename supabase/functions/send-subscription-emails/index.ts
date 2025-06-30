
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionEmailRequest {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fullName, email, phone, companyName }: SubscriptionEmailRequest = await req.json();

    console.log('Processing subscription emails for:', { fullName, email, companyName });

    // إرسال إيميل للعميل
    const customerEmailResponse = await resend.emails.send({
      from: "TRNDSKY <onboarding@resend.dev>",
      to: [email],
      subject: "تم استلام طلب الاشتراك - TRNDSKY",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;" dir="rtl">
          <!-- Header with gradient -->
          <div style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; font-size: 28px; margin: 0; font-weight: bold;">TRNDSKY</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">منصة إدارة الشاشات والمواقع</p>
          </div>
          
          <!-- Main content -->
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">مرحباً ${fullName}،</h2>
            
            <p style="color: #4b5563; line-height: 1.8; margin-bottom: 25px; font-size: 16px;">
              شكراً لك لاهتمامك بمنصة TRNDSKY. تم استلام طلب الاشتراك الخاص بك بنجاح.
            </p>
            
            <!-- Request details card -->
            <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; border-right: 4px solid #3b82f6;">
              <h3 style="color: #1f2937; margin-bottom: 20px; font-size: 18px;">📋 تفاصيل طلبك:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 35%;">الاسم الكامل:</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">اسم الشركة:</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${companyName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">البريد الإلكتروني:</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; font-weight: 600; color: #374151;">رقم التواصل:</td>
                  <td style="padding: 12px 0; color: #1f2937;">${phone}</td>
                </tr>
              </table>
            </div>
            
            <!-- Next steps -->
            <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #1e40af; margin-bottom: 15px; font-size: 18px;">📞 الخطوات التالية:</h3>
              <p style="color: #1e40af; margin: 0; line-height: 1.6; font-size: 15px;">
                سيقوم فريقنا المتخصص بالتواصل معك خلال <strong>24 ساعة</strong> لمناقشة احتياجاتك وتقديم العرض المناسب لشركتك.
              </p>
            </div>
            
            <!-- Features highlight -->
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;">استمتع بمميزات TRNDSKY:</p>
              <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 15px;">
                <span style="background: #f3f4f6; padding: 8px 16px; border-radius: 20px; color: #374151; font-size: 13px;">🖥️ إدارة الشاشات</span>
                <span style="background: #f3f4f6; padding: 8px 16px; border-radius: 20px; color: #374151; font-size: 13px;">🌐 توحيد المواقع</span>
                <span style="background: #f3f4f6; padding: 8px 16px; border-radius: 20px; color: #374151; font-size: 13px;">📊 تحليلات متقدمة</span>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
              <p style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">مع تحيات فريق</p>
              <p style="color: #1e40af; font-size: 20px; font-weight: bold; margin: 0;">TRNDSKY</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">هذا الإيميل تم إرساله تلقائياً من نظام TRNDSKY</p>
            <p style="margin: 5px 0 0 0;">يرجى عدم الرد على هذا الإيميل</p>
          </div>
        </div>
      `,
    });

    console.log("Customer email sent:", customerEmailResponse);

    // إرسال إيميل للإدارة
    const adminEmailResponse = await resend.emails.send({
      from: "TRNDSKY System <onboarding@resend.dev>",
      to: ["info@trndsky.com"],
      subject: "🚨 طلب اشتراك جديد - TRNDSKY",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;" dir="rtl">
          <!-- Alert Header -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 25px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; font-size: 24px; margin: 0 0 5px 0; font-weight: bold;">🚨 طلب اشتراك جديد</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">TRNDSKY Admin System</p>
          </div>
          
          <!-- Main content -->
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Customer info card -->
            <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
              <h2 style="color: #dc2626; margin-bottom: 20px; font-size: 20px;">👤 معلومات العميل الجديد</h2>
              
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <tr style="background: #f9fafb;">
                  <td style="padding: 15px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb; width: 35%;">الاسم الكامل:</td>
                  <td style="padding: 15px; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 15px; font-weight: bold; color: #374151; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">اسم الشركة:</td>
                  <td style="padding: 15px; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${companyName}</td>
                </tr>
                <tr style="background: #f9fafb;">
                  <td style="padding: 15px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">البريد الإلكتروني:</td>
                  <td style="padding: 15px; color: #1f2937; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 15px; font-weight: bold; color: #374151; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">رقم التواصل:</td>
                  <td style="padding: 15px; color: #1f2937; border-bottom: 1px solid #e5e7eb;"><a href="tel:${phone}" style="color: #2563eb; text-decoration: none;">${phone}</a></td>
                </tr>
                <tr style="background: #f9fafb;">
                  <td style="padding: 15px; font-weight: bold; color: #374151;">وقت الطلب:</td>
                  <td style="padding: 15px; color: #1f2937;">${new Date().toLocaleString('ar-SA', { 
                    timeZone: 'Asia/Riyadh',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</td>
                </tr>
              </table>
            </div>
            
            <!-- Action required alert -->
            <div style="background: #fef3c7; border-right: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 6px;">
              <h3 style="color: #92400e; margin-bottom: 10px; font-size: 16px;">⚡ إجراء مطلوب:</h3>
              <p style="color: #92400e; margin: 0; line-height: 1.6; font-size: 14px;">
                يرجى التواصل مع العميل خلال <strong>24 ساعة</strong> لمتابعة طلب الاشتراك وتقديم العرض المناسب.
              </p>
            </div>
            
            <!-- Quick actions -->
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px;">
              <h3 style="color: #374151; margin-bottom: 15px; font-size: 16px;">🎯 إجراءات سريعة:</h3>
              <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                <a href="mailto:${email}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px; display: inline-block;">📧 إرسال إيميل</a>
                <a href="tel:${phone}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px; display: inline-block;">📞 اتصال مباشر</a>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">تم إرسال هذا الإشعار تلقائياً من نظام إدارة TRNDSKY</p>
            <p style="margin: 5px 0 0 0;">تاريخ الإرسال: ${new Date().toLocaleString('ar-SA')}</p>
          </div>
        </div>
      `,
    });

    console.log("Admin email sent:", adminEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        customerEmail: customerEmailResponse,
        adminEmail: adminEmailResponse 
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in send-subscription-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
