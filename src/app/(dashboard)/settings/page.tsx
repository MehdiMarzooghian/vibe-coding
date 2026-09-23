import { Database, LockKeyhole, ShieldCheck, UserRoundCog } from "lucide-react";
import { SettingsForm } from "@/components/forms/settings-form";
import { PageHeader } from "@/components/ui";
import { getStoreContext } from "@/lib/data";

export const metadata = { title: "تنظیمات" };

export default async function SettingsPage() {
  const context = await getStoreContext();
  return <><PageHeader title="تنظیمات فروشگاه" description="مشخصات، قواعد پیش‌فرض و وضعیت امنیت برنامه" /><SettingsForm name={context.storeName} /><section className="content-grid"><div className="card"><div className="card-head"><div><h3>امنیت و دسترسی</h3><p>نسخه فعلی تک‌مالک</p></div><ShieldCheck size={20} /></div><div className="alert-list"><div className="alert-item"><span className="alert-mark info"><LockKeyhole size={16} /></span><div><strong>ورود محدود به مالک</strong><p>{context.email} تنها حساب فعال این فروشگاه است.</p></div></div><div className="alert-item"><span className="alert-mark warning"><UserRoundCog size={16} /></span><div><strong>نقش‌های آینده</strong><p>ساختار مالک، صندوق‌دار و انباردار در دیتابیس آماده است؛ رابط دعوت کارکنان در نسخه بعد فعال می‌شود.</p></div></div></div></div><div className="card"><div className="card-head"><div><h3>پایگاه داده</h3><p>وضعیت اتصال</p></div><Database size={20} /></div><div className="alert-item"><span className={`alert-mark ${context.configured ? "info" : "warning"}`}><Database size={16} /></span><div><strong>{context.configured ? "Supabase متصل است" : "حالت نمایشی"}</strong><p>{context.configured ? "داده‌ها با RLS و نشست مالک محافظت می‌شوند." : "برای ذخیره اطلاعات واقعی، متغیرهای محیطی را طبق README تنظیم کنید."}</p></div></div></div></section></>;
}
