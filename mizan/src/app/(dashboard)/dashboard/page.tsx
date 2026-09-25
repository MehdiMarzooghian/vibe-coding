import Link from "next/link";
import { AlertTriangle, ArrowLeft, BadgeDollarSign, BanknoteArrowDown, Boxes, CircleDollarSign, PackageOpen, ShoppingBasket, TrendingUp, WalletCards } from "lucide-react";
import { DashboardChart } from "@/components/dashboard-chart";
import { PageHeader, StatCard, StatusPill } from "@/components/ui";
import { formatJalali, formatNumber, formatToman } from "@/lib/format";
import { getAppData } from "@/lib/data";

export const metadata = { title: "داشبورد" };

export default async function DashboardPage() {
  const data = await getAppData(); const d = data.dashboard;
  return <>
    <PageHeader title="سلام، روز خوبی داشته باشید" description="خلاصه وضعیت فروشگاه و اتفاق‌های مهم امروز را اینجا می‌بینید."><Link className="btn btn-secondary" href="/purchases"><PackageOpen size={16} /> ثبت خرید</Link><Link className="btn btn-primary" href="/sales"><ShoppingBasket size={16} /> فروش جدید</Link></PageHeader>
    <section className="stats-grid">
      <StatCard label="فروش امروز" value={formatToman(d.todaySales)} icon={ShoppingBasket} emphasis meta="به‌روزرسانی لحظه‌ای" />
      <StatCard label="فروش این ماه" value={formatToman(d.monthSales)} icon={TrendingUp} />
      <StatCard label="سود خالص ماه" value={formatToman(d.netProfit)} icon={BadgeDollarSign} />
      <StatCard label="ارزش موجودی" value={formatToman(d.inventoryValue)} icon={Boxes} />
    </section>
    <section className="content-grid">
      <div className="card"><div className="card-head"><div><h3>روند فروش و سود</h3><p>هفت روز اخیر</p></div><Link href="/reports" className="card-link">گزارش کامل <ArrowLeft size={12} style={{ display: "inline" }} /></Link></div><DashboardChart data={d.salesTrend} /></div>
      <div className="card"><div className="card-head"><div><h3>هشدارهای مهم</h3><p>{formatNumber(data.alerts.length)} مورد نیازمند توجه</p></div><Link href="/alerts" className="card-link">مشاهده همه</Link></div><div className="alert-list">{data.alerts.slice(0, 4).map((alert) => <div className="alert-item" key={alert.id}><span className={`alert-mark ${alert.severity}`}><AlertTriangle size={16} /></span><div><strong>{alert.title}</strong><p>{alert.description}</p></div></div>)}{!data.alerts.length ? <div className="empty">هشداری وجود ندارد.</div> : null}</div></div>
    </section>
    <section className="content-grid">
      <div className="card flush"><div className="card-head" style={{ padding: "20px 20px 0" }}><div><h3>آخرین فروش‌ها</h3><p>جدیدترین فاکتورهای ثبت‌شده</p></div><Link href="/sales" className="card-link">مشاهده همه</Link></div><div className="table-wrap"><table className="data-table"><thead><tr><th>فاکتور</th><th>تاریخ</th><th>مشتری</th><th>مبلغ</th><th>وضعیت</th></tr></thead><tbody>{data.sales.slice(0, 5).map((sale) => <tr key={sale.id}><td><span className="cell-title" dir="ltr">{sale.number}</span><div className="cell-subtitle">{formatNumber(sale.itemCount)} قلم</div></td><td>{formatJalali(sale.date)}</td><td>{sale.party}</td><td className="money">{formatToman(sale.total)}</td><td><StatusPill status={sale.status} /></td></tr>)}</tbody></table></div></div>
      <div className="card"><div className="card-head"><div><h3>پرفروش‌ترین‌ها</h3><p>بر اساس مبلغ فروش ماه</p></div></div><div className="rank-list">{d.topProducts.map((product, index) => <div className="rank-row" key={product.name}><span className="rank">{formatNumber(index + 1)}</span><div><strong>{product.name}</strong><small>{formatNumber(product.quantity)} واحد فروش</small></div><strong className="money">{formatToman(product.revenue)}</strong></div>)}</div></div>
    </section>
    <section className="stats-grid">
      <StatCard label="خرید این ماه" value={formatToman(d.monthPurchases)} icon={BanknoteArrowDown} />
      <StatCard label="هزینه‌های ماه" value={formatToman(d.expenses)} icon={CircleDollarSign} />
      <StatCard label="طلب از مشتریان" value={formatToman(d.receivables)} icon={WalletCards} />
      <StatCard label="بدهی به تأمین‌کننده" value={formatToman(d.payables)} icon={WalletCards} />
    </section>
  </>;
}
