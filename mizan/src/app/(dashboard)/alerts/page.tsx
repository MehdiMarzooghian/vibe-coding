import { AlertTriangle, BellRing, CalendarClock, PackageX, WalletCards } from "lucide-react";
import { PageHeader, StatCard } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { getAppData } from "@/lib/data";

export const metadata = { title: "هشدارها" };

export default async function AlertsPage() {
  const data = await getAppData(); const low = data.alerts.filter((a) => a.type === "low_stock"); const expiry = data.alerts.filter((a) => a.type === "expiry"); const debt = data.alerts.filter((a) => a.type === "debt");
  const icon = { low_stock: PackageX, expiry: CalendarClock, debt: WalletCards };
  return <><PageHeader title="مرکز هشدارها" description="مواردی که برای جلوگیری از کمبود، ضایعات یا تأخیر پرداخت نیاز به توجه دارند." /><section className="stats-grid"><StatCard label="کل هشدارها" value={formatNumber(data.alerts.length)} icon={BellRing} emphasis /><StatCard label="موجودی کم" value={formatNumber(low.length)} icon={PackageX} /><StatCard label="انقضای نزدیک" value={formatNumber(expiry.length)} icon={CalendarClock} /><StatCard label="مانده حساب" value={formatNumber(debt.length)} icon={WalletCards} /></section><section className="card"><div className="card-head"><div><h3>موارد فعال</h3><p>هشدارها از داده‌های واقعی موجودی و حساب‌ها ساخته می‌شوند.</p></div><AlertTriangle size={20} /></div><div className="alert-list">{data.alerts.map((alert) => { const Icon = icon[alert.type]; return <div className="alert-item" key={alert.id}><span className={`alert-mark ${alert.severity}`}><Icon size={17} /></span><div><strong>{alert.title}</strong><p>{alert.description}</p></div></div>; })}{!data.alerts.length ? <div className="empty">همه‌چیز مرتب است؛ هشدار فعالی ندارید.</div> : null}</div></section></>;
}
