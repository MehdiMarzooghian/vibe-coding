import { BarChart3, Boxes, Store, WalletCards } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { isSupabaseConfigured, ownerEmail } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "ورود" };

export default async function LoginPage() {
  const configured = isSupabaseConfigured();
  if (configured) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/dashboard");
  }
  return <main className="login-page">
    <section className="login-visual">
      <div className="brand"><span className="brand-mark"><Store size={25} /></span><div><h1>میزان</h1><p>مدیریت هوشمند فروشگاه</p></div></div>
      <div className="login-copy"><span className="eyebrow">همه‌چیز، دقیق و یک‌جا</span><h2>نبض فروشگاه شما<br />زیر انگشتانتان.</h2><p>از خرید و موجودی تا فروش، سود و بدهی‌ها؛ میزان تصویر روشنی از کسب‌وکار شما می‌سازد تا تصمیم‌ها بر پایه عددهای واقعی باشند.</p><div className="login-features"><span className="login-feature"><Boxes size={13} /> موجودی لحظه‌ای</span><span className="login-feature"><WalletCards size={13} /> حساب اشخاص</span><span className="login-feature"><BarChart3 size={13} /> سود روزانه و ماهانه</span></div></div>
    </section>
    <section className="login-panel"><div className="login-box"><h1>خوش آمدید</h1><p>برای ورود به پنل مدیریت اطلاعات حساب مالک را وارد کنید.</p><LoginForm ownerEmail={ownerEmail} demo={!configured} /><p className="login-note">ورود کارکنان در نسخه بعدی فعال می‌شود. این نسخه فقط برای حساب مالک فروشگاه در دسترس است.</p></div></section>
  </main>;
}
