
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  name: string;
  email: string;
  password: string;
  database_name: string;
  activation_start_date: string | null;
  activation_end_date: string | null;
  account_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      name, 
      email, 
      password, 
      database_name, 
      activation_start_date, 
      activation_end_date,
      account_id 
    }: WelcomeEmailRequest = await req.json();

    console.log('🚀 إرسال إيميل ترحيب للحساب:', { name, email, account_id });

    const formatDate = (dateString: string | null) => {
      if (!dateString) return 'غير محدد';
      return new Date(dateString).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const dashboardUrl = `${req.headers.get('origin')}/client/${account_id}`;
    const publicPageUrl = `${req.headers.get('origin')}/client/${account_id}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>مرحباً بك - تم إنشاء حسابك بنجاح</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
            text-align: right;
            background-color: #f7f9fc;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .content {
            padding: 30px;
          }
          .welcome-text {
            font-size: 18px;
            color: #2d3748;
            margin-bottom: 25px;
            line-height: 1.6;
          }
          .info-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            margin: 12px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-item:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: bold;
            color: #4a5568;
          }
          .info-value {
            color: #2d3748;
          }
          .password-highlight {
            background-color: #fed7d7;
            color: #c53030;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: monospace;
            font-weight: bold;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: bold;
            margin: 10px 5px;
            text-align: center;
          }
          .button:hover {
            opacity: 0.9;
          }
          .links-section {
            margin: 30px 0;
            text-align: center;
          }
          .footer {
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            color: #718096;
            font-size: 14px;
            border-top: 1px solid #e2e8f0;
          }
          .activation-dates {
            background-color: #e6fffa;
            border: 1px solid #38b2ac;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .warning {
            background-color: #fef5e7;
            border: 1px solid #ed8936;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #c05621;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 مرحباً بك ${name}</h1>
            <p>تم إنشاء حسابك وتفعيله بنجاح</p>
          </div>
          
          <div class="content">
            <div class="welcome-text">
              نتشرف بانضمامك إلينا! تم إنشاء حسابك بنجاح وهو جاهز للاستخدام الآن.
            </div>

            <div class="info-card">
              <h3 style="margin-top: 0; color: #2d3748;">تفاصيل حسابك:</h3>
              
              <div class="info-item">
                <span class="info-label">اسم الحساب:</span>
                <span class="info-value">${name}</span>
              </div>
              
              <div class="info-item">
                <span class="info-label">البريد الإلكتروني:</span>
                <span class="info-value">${email}</span>
              </div>
              
              <div class="info-item">
                <span class="info-label">كلمة المرور:</span>
                <span class="password-highlight">${password}</span>
              </div>
              
              <div class="info-item">
                <span class="info-label">اسم قاعدة البيانات:</span>
                <span class="info-value">${database_name}</span>
              </div>
            </div>

            ${activation_start_date || activation_end_date ? `
            <div class="activation-dates">
              <h4 style="margin-top: 0; color: #2c7a7b;">فترة التنشيط:</h4>
              <div class="info-item">
                <span class="info-label">تاريخ بداية التنشيط:</span>
                <span class="info-value">${formatDate(activation_start_date)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">تاريخ انتهاء التنشيط:</span>
                <span class="info-value">${formatDate(activation_end_date)}</span>
              </div>
            </div>
            ` : ''}

            <div class="warning">
              <strong>⚠️ مهم جداً:</strong> احتفظ بكلمة المرور في مكان آمن، ستحتاجها للدخول إلى حسابك.
            </div>

            <div class="links-section">
              <h3>روابط مهمة:</h3>
              <div>
                <a href="${dashboardUrl}" class="button">
                  🔧 دخول لوحة التحكم
                </a>
                <a href="${publicPageUrl}" class="button">
                  👥 صفحة العملاء العامة
                </a>
              </div>
              <p style="margin-top: 15px; color: #718096; font-size: 14px;">
                يمكنك مشاركة رابط صفحة العملاء مع عملائك ليتمكنوا من رؤية الإشعارات والمؤقتات
              </p>
            </div>

            <div class="info-card">
              <h4 style="margin-top: 0;">كيفية البدء:</h4>
              <ol style="color: #4a5568; line-height: 1.8;">
                <li>انقر على رابط "دخول لوحة التحكم" أعلاه</li>
                <li>استخدم بريدك الإلكتروني وكلمة المرور للدخول</li>
                <li>ابدأ بإعداد الإشعارات والمؤقتات</li>
                <li>شارك رابط صفحة العملاء مع عملائك</li>
              </ol>
            </div>
          </div>

          <div class="footer">
            <p>إذا كنت تحتاج إلى أي مساعدة، لا تتردد في التواصل معنا</p>
            <p>
              <a href="https://trndsky.com" style="color: #667eea; text-decoration: none;">
                🌐 زيارة موقعنا الرسمي
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "نظام إدارة الحسابات <onboarding@resend.dev>",
      to: [email],
      subject: `🎉 مرحباً ${name} - تم إنشاء حسابك بنجاح`,
      html: emailHtml,
    });

    console.log('✅ تم إرسال الإيميل بنجاح:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('❌ خطأ في إرسال الإيميل:', error);
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
