import { BadgeDollarSign, BanknoteArrowDown, ChartNoAxesCombined, CircleDollarSign, TrendingUp, WalletCards } from "lucide-react";
import { DashboardChart } from "@/components/dashboard-chart";
import { ExportButtons } from "@/components/data-tools";
import { PageHeader, StatCard } from "@/components/ui";
import { formatJalali, formatToman } from "@/lib/format";
import { getAppData } from "@/lib/data";

export const metadata = { title: "گزارش‌ها" };

export default async function ReportsPage() {
  const data = await getAppData(); const d = data.dashboard;
  const sheets = {
    فروش: data.sales.map((s) => ({ شماره: s.number, تاریخ: formatJalali(s.date), مشتری: s.party, مبلغ: s.total, دریافتی: s.paid, مانده: s.total - s.paid, وضعیت: s.status })),
    خرید: data.purchases.map((p) => ({ شماره: p.number, تاریخ: formatJalali(p.date), تأمین‌کننده: p.party, مبلغ: p.total, پرداختی: p.paid, مانده: p.total - p.paid, وضعیت: p.status })),
    هزینه: data.expenses.map((e) => ({ عنوان: e.title, دسته: e.category, تاریخ: formatJalali(e.date), مبلغ: e.amount })),
    موجودی: data.products.map((p) => ({ کالا: p.name, موجودی: p.stock, واحد: p.baseUnit, "میانگین بها": p.averageCost, ارزش: p.stock * p.averageCost })),
  };
  return <><PageHeader title="گزارش‌های مدیریتی" description="تصویر مالی فروشگاه بر اساس اسناد نهایی‌شده و بهای میانگین موزون"><ExportButtons fileName="گزارش-جامع-فروشگاه" sheets={sheets} /></PageHeader><section className="stats-grid"><StatCard label="فروش ماه" value={formatToman(d.monthSales)} icon={TrendingUp} emphasis /><StatCard label="سود ناخالص" value={formatToman(d.grossProfit)} icon={BadgeDollarSign} /><StatCard label="هزینه‌ها" value={formatToman(d.expenses)} icon={CircleDollarSign} /><StatCard label="سود خالص" value={formatToman(d.netProfit)} icon={ChartNoAxesCombined} /></section><section className="content-grid"><div className="card"><div className="card-head"><div><h3>روند هفت روزه</h3><p>فروش و سود ناخالص</p></div></div><DashboardChart data={d.salesTrend} /></div><div className="card"><div className="card-head"><div><h3>تعهدات مالی</h3><p>مانده حساب‌ها</p></div><WalletCards size={20} /></div><div className="rank-list"><div className="rank-row"><span className="rank">۱</span><div><strong>طلب از مشتریان</strong><small>فروش‌های تسویه‌نشده</small></div><strong>{formatToman(d.receivables)}</strong></div><div className="rank-row"><span className="rank">۲</span><div><strong>بدهی به تأمین‌کنندگان</strong><small>خریدهای تسویه‌نشده</small></div><strong>{formatToman(d.payables)}</strong></div><div className="rank-row"><span className="rank">۳</span><div><strong>ارزش موجودی</strong><small>موجودی × میانگین بها</small></div><strong>{formatToman(d.inventoryValue)}</strong></div></div></div></section><section className="card"><div className="card-head"><div><h3>مبنای محاسبه</h3><p>شفافیت اعداد گزارش</p></div><BanknoteArrowDown size={20} /></div><p style={{ color: "var(--muted)", lineHeight: 2, fontSize: 12 }}>سود ناخالص از فروش خالص منهای بهای تمام‌شده اقلام فروخته‌شده به دست می‌آید. سود خالص برابر سود ناخالص منهای هزینه‌های جاری است. مبلغ خرید کالا تا زمان فروش، هزینه دوره محسوب نمی‌شود و در ارزش موجودی باقی می‌ماند.</p></section></>;
}
