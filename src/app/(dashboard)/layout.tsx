import { AppShell } from "@/components/app-shell";
import { getAppData, getStoreContext } from "@/lib/data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [context, data] = await Promise.all([getStoreContext(), getAppData()]);
  return <AppShell storeName={context.storeName} email={context.email} configured={context.configured} alertCount={data.alerts.length}>{!context.configured ? <div className="demo-banner">این پیش‌نمایش با داده نمونه اجرا شده است. پس از اتصال Supabase، همه فرم‌ها اطلاعات واقعی را ثبت می‌کنند.</div> : null}{children}</AppShell>;
}
