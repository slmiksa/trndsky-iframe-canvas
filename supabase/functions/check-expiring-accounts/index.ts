
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Account {
  id: string;
  name: string;
  email: string;
  activation_end_date: string;
  database_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔍 بدء فحص الحسابات المنتهية الصلاحية...");

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // البحث عن الحسابات النشطة التي تنتهي صلاحيتها قريباً
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("id, name, email, activation_end_date, database_name")
      .eq("status", "active")
      .not("activation_end_date", "is", null);

    if (accountsError) {
      console.error("❌ خطأ في استعلام الحسابات:", accountsError);
      throw accountsError;
    }

    console.log(`📊 تم العثور على ${accounts.length} حساب نشط`);

    for (const account of accounts as Account[]) {
      const endDate = new Date(account.activation_end_date);
      
      // تحديد نوع الإشعار المطلوب
      let notificationType: string | null = null;
      if (endDate <= oneDayFromNow && endDate > now) {
        notificationType = "1_day";
      } else if (endDate <= threeDaysFromNow && endDate > oneDayFromNow) {
        notificationType = "3_days";
      } else if (endDate <= sevenDaysFromNow && endDate > threeDaysFromNow) {
        notificationType = "7_days";
      }

      if (!notificationType) continue;

      // التحقق من عدم إرسال الإشعار مسبقاً
      const { data: existingNotification } = await supabase
        .from("renewal_notifications")
        .select("id")
        .eq("account_id", account.id)
        .eq("notification_type", notificationType)
        .single();

      if (existingNotification) {
        console.log(`⏭️ تم إرسال إشعار ${notificationType} مسبقاً للحساب: ${account.name}`);
        continue;
      }

      // إرسال إشعار التجديد
      console.log(`📧 إرسال إشعار ${notificationType} للحساب: ${account.name}`);
      
      const { error: emailError } = await supabase.functions.invoke("send-renewal-notification", {
        body: {
          account_id: account.id,
          name: account.name,
          email: account.email,
          database_name: account.database_name,
          activation_end_date: account.activation_end_date,
          notification_type: notificationType
        }
      });

      if (emailError) {
        console.error(`❌ خطأ في إرسال إشعار التجديد للحساب ${account.name}:`, emailError);
        continue;
      }

      // تسجيل الإشعار في قاعدة البيانات
      const { error: notificationError } = await supabase
        .from("renewal_notifications")
        .insert({
          account_id: account.id,
          notification_type: notificationType
        });

      if (notificationError) {
        console.error(`❌ خطأ في تسجيل الإشعار للحساب ${account.name}:`, notificationError);
      } else {
        console.log(`✅ تم إرسال وتسجيل إشعار ${notificationType} للحساب: ${account.name}`);
      }
    }

    console.log("✅ انتهاء فحص الحسابات المنتهية الصلاحية");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "تم فحص الحسابات وإرسال الإشعارات بنجاح",
        processed_accounts: accounts.length 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("❌ خطأ في فحص الحسابات المنتهية الصلاحية:", error);
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
