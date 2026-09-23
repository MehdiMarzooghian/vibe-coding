import Link from "next/link";
import { Printer } from "lucide-react";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { ExportButtons } from "@/components/data-tools";
import { EmptyState, PageHeader, StatusPill } from "@/components/ui";
import { formatJalali, formatNumber, formatToman } from "@/lib/format";
import { getAppData } from "@/lib/data";

export const metadata = { title: "فروش و صندوق" };

export default async function SalesPage() {
  const data = await getAppData(); const customers = data.partners.filter((p) => p.type !== "supplier");
  const rows = data.sales.map((s) => ({ "شماره فاکتور": s.number, "مشتری": s.party, "تاریخ": formatJalali(s.date), "اقلام": s.itemCount, "فروش": s.total, "دریافتی": s.paid, "طلب": s.total - s.paid, "وضعیت": s.status }));
  return <><PageHeader title="فروش و صندوق" description="فروش سریع با بارکدخوان و ثبت خودکار سود و موجودی"><ExportButtons fileName="آرشیو-فروش" sheets={{ فروش‌ها: rows }} /></PageHeader><InvoiceForm kind="sale" products={data.products} partners={customers} /><section className="card flush"><div className="card-head" style={{ padding: "20px 20px 0" }}><div><h3>آخرین فروش‌ها</h3><p>رسیدها برای چاپ مجدد در آرشیو باقی می‌مانند.</p></div><Printer size={19} /></div><div className="table-wrap"><table className="data-table"><thead><tr><th>شماره</th><th>مشتری</th><th>تاریخ</th><th>اقلام</th><th>مبلغ</th><th>طلب</th><th>وضعیت</th></tr></thead><tbody>{data.sales.map((s) => <tr key={s.id}><td><Link href={`/sales/${s.id}`} className="cell-title" dir="ltr">{s.number}</Link></td><td>{s.party}</td><td>{formatJalali(s.date)}</td><td>{formatNumber(s.itemCount)}</td><td className="money">{formatToman(s.total)}</td><td className="money">{formatToman(s.total - s.paid)}</td><td><StatusPill status={s.status} /></td></tr>)}</tbody></table>{!data.sales.length ? <EmptyState text="هنوز فروشی ثبت نشده است." /> : null}</div></section></>;
}
