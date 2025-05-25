
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RenewalNotificationRequest {
  account_id: string;
  name: string;
  email: string;
  database_name: string;
  activation_end_date: string;
  notification_type: "7_days" | "3_days" | "1_day";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      account_id,
      name, 
      email, 
      database_name,
      activation_end_date,
      notification_type 
    }: RenewalNotificationRequest = await req.json();

    console.log(`🔔 إرسال إشعار تجديد ${notification_type} للحساب:`, { name, email, account_id });

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const getNotificationDetails = (type: string) => {
      switch (type) {
        case "7_days":
          return {
            title: "⚠️ تنبيه: باقي 7 أيام على انتهاء تنشيط حسابك",
            urgency: "تنبيه مبكر",
            color: "#FFA500"
          };
        case "3_days":
          return {
            title: "⚠️ تحذير: باقي 3 أيام على انتهاء تنشيط حسابك",
            urgency: "تحذير مهم",
            color: "#FF6B35"
          };
        case "1_day":
          return {
            title: "🚨 عاجل: باقي يوم واحد على انتهاء تنشيط حسابك",
            urgency: "تحذير عاجل",
            color: "#DC3545"
          };
        default:
          return {
            title: "تذكير بتجديد الحساب",
            urgency: "تذكير",
            color: "#007BFF"
          };
      }
    };

    const notificationDetails = getNotificationDetails(notification_type);
    const dashboardUrl = `${req.headers.get('origin')}/client/${account_id}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notificationDetails.title}</title>
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
            background: linear-gradient(135deg, ${notificationDetails.color} 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          .content {
            padding: 30px;
          }
          .urgency-badge {
            background-color: ${notificationDetails.color};
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 20px;
          }
          .expiry-card {
            background-color: #fff5f5;
            border: 2px solid ${notificationDetails.color};
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .expiry-date {
            font-size: 20px;
            font-weight: bold;
            color: ${notificationDetails.color};
            margin: 10px 0;
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
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: bold;
            margin: 15px 10px;
            text-align: center;
            font-size: 16px;
          }
          .button:hover {
            opacity: 0.9;
          }
          .contact-section {
            background-color: #e8f5e8;
            border: 1px solid #28a745;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
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
          .website-link {
            color: #007BFF;
            text-decoration: none;
            font-weight: bold;
          }
          .renewal-steps {
            background-color: #f0f9ff;
            border: 1px solid #0284c7;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${notificationDetails.title}</h1>
            <p>مرحباً ${name}</p>
          </div>
          
          <div class="content">
            <div class="urgency-badge">${notificationDetails.urgency}</div>
            
            <div class="expiry-card">
              <h3 style="margin-top: 0; color: ${notificationDetails.color};">📅 موعد انتهاء التنشيط</h3>
              <div class="expiry-date">${formatDate(activation_end_date)}</div>
              <p style="color: #666; margin-bottom: 0;">يرجى التجديد قبل هذا التاريخ لتجنب انقطاع الخدمة</p>
            </div>

            <div class="info-card">
              <h4 style="margin-top: 0; color: #2d3748;">معلومات الحساب:</h4>
              
              <div class="info-item">
                <span class="info-label">اسم الحساب:</span>
                <span class="info-value">${name}</span>
              </div>
              
              <div class="info-item">
                <span class="info-label">البريد الإلكتروني:</span>
                <span class="info-value">${email}</span>
              </div>
              
              <div class="info-item">
                <span class="info-label">اسم قاعدة البيانات:</span>
                <span class="info-value">${database_name}</span>
              </div>
            </div>

            <div class="contact-section">
              <h3 style="margin-top: 0; color: #28a745;">📞 للتجديد، تواصل معنا الآن</h3>
              <p style="font-size: 16px; margin: 15px 0;">
                لتجديد تنشيط حسابك وضمان استمرارية الخدمة، يرجى التواصل معنا فوراً
              </p>
              <p style="font-size: 18px; font-weight: bold; color: #28a745; margin: 10px 0;">
                🌐 زيارة موقعنا: 
                <a href="https://trndsky.com" class="website-link">trndsky.com</a>
              </p>
            </div>

            <div class="renewal-steps">
              <h4 style="margin-top: 0; color: #0284c7;">خطوات التجديد:</h4>
              <ol style="color: #4a5568; line-height: 1.8; padding-right: 20px;">
                <li>زيارة موقعنا الرسمي: <a href="https://trndsky.com" class="website-link">trndsky.com</a></li>
                <li>التواصل مع فريق الدعم الفني</li>
                <li>تقديم معلومات حسابك للمراجعة</li>
                <li>اختيار خطة التجديد المناسبة</li>
                <li>إتمام عملية الدفع</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" class="button">
                🔧 دخول لوحة التحكم
              </a>
              <a href="https://trndsky.com" class="button">
                🌐 زيارة موقعنا
              </a>
            </div>
          </div>

          <div class="footer">
            <p><strong>⚠️ تنبيه مهم:</strong> في حالة عدم التجديد، سيتم تعطيل حسابك تلقائياً بعد انتهاء تاريخ التنشيط</p>
            <p style="margin-top: 15px;">
              فريق الدعم الفني - 
              <a href="https://trndsky.com" class="website-link">trndsky.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "نظام التجديد - TrndSky <noreply@mail.trndsky.com>",
      to: [email],
      subject: notificationDetails.title,
      html: emailHtml,
    });

    console.log(`✅ تم إرسال إشعار التجديد ${notification_type} بنجاح:`, emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("❌ خطأ في إرسال إشعار التجديد:", error);
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
