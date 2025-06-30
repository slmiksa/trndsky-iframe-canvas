
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
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; font-size: 24px; margin-bottom: 10px;">TRNDSKY</h1>
            <div style="width: 50px; height: 3px; background: linear-gradient(to right, #3b82f6, #8b5cf6); margin: 0 auto;"></div>
          </div>
          
          <h2 style="color: #1f2937; margin-bottom: 20px;">مرحباً ${fullName}،</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            شكراً لك لاهتمامك بمنصة TRNDSKY لإدارة الشاشات والمواقع.
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-bottom: 15px;">تفاصيل طلبك:</h3>
            <ul style="color: #4b5563; line-height: 1.8;">
              <li><strong>الاسم:</strong> ${fullName}</li>
              <li><strong>الشركة:</strong> ${companyName}</li>
              <li><strong>البريد الإلكتروني:</strong> ${email}</li>
              <li><strong>رقم التواصل:</strong> ${phone}</li>
            </ul>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 20px 0;">
            <strong>طلبك قيد المراجعة</strong> وسيقوم فريقنا بالتواصل معك خلال 24 ساعة لمناقشة احتياجاتك وتقديم العرض المناسب.
          </p>
          
          <div style="background: #dbeafe; border-right: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="color: #1e40af; margin: 0; font-weight: 500;">
              💡 في الأثناء، يمكنك زيارة موقعنا للتعرف على المزيد من مميزات TRNDSKY
            </p>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">
            مع تحيات فريق TRNDSKY<br>
            <strong>منصة إدارة وتوحيد الشاشات والمواقع</strong>
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px;">
              هذا الإيميل تم إرساله تلقائياً، يرجى عدم الرد عليه
            </p>
          </div>
        </div>
      `,
    });

    console.log("Customer email sent:", customerEmailResponse);

    // إرسال إيميل للإدارة
    const adminEmailResponse = await resend.emails.send({
      from: "TRNDSKY System <onboarding@resend.dev>",
      to: ["info@trndsky.com"],
      subject: "طلب اشتراك جديد - TRNDSKY",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 10px;">🚨 طلب اشتراك جديد</h1>
            <div style="width: 50px; height: 3px; background: linear-gradient(to right, #dc2626, #f59e0b); margin: 0 auto;"></div>
          </div>
          
          <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #dc2626; margin-bottom: 20px;">تفاصيل طلب الاشتراك</h2>
            
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="color: #374151; margin-bottom: 10px;">معلومات العميل:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; background: #f9fafb; font-weight: bold; color: #374151; width: 30%;">الاسم الكامل:</td>
                  <td style="padding: 8px; color: #1f2937;">${fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; background: #f9fafb; font-weight: bold; color: #374151;">اسم الشركة:</td>
                  <td style="padding: 8px; color: #1f2937;">${companyName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; background: #f9fafb; font-weight: bold; color: #374151;">البريد الإلكتروني:</td>
                  <td style="padding: 8px; color: #1f2937;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; background: #f9fafb; font-weight: bold; color: #374151;">رقم التواصل:</td>
                  <td style="padding: 8px; color: #1f2937;">${phone}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; background: #f9fafb; font-weight: bold; color: #374151;">وقت الطلب:</td>
                  <td style="padding: 8px; color: #1f2937;">${new Date().toLocaleString('ar-SA')}</td>
                </tr>
              </table>
            </div>
          </div>
          
          <div style="background: #fef3c7; border-right: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-weight: 500;">
              ⚡ يرجى التواصل مع العميل خلال 24 ساعة لمتابعة الطلب
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px;">
              تم إرسال هذا الإيميل تلقائياً من نظام TRNDSKY
            </p>
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
