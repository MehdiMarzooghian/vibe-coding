import Link from "next/link";
import { FileText } from "lucide-react";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { ExportButtons } from "@/components/data-tools";
import { EmptyState, PageHeader, StatusPill } from "@/components/ui";
import { formatJalali, formatNumber, formatToman } from "@/lib/format";
import { getAppData } from "@/lib/data";

export const metadata = { title: "خرید فروشگاه" };

export default async function PurchasesPage() {
  const data = await getAppData(); const suppliers = data.partners.filter((p) => p.type !== "customer");
  const rows = data.purchases.map((p) => ({ "شماره فاکتور": p.number, "تأمین‌کننده": p.party, "تاریخ": formatJalali(p.date), "تعداد اقلام": p.itemCount, "مبلغ کل": p.total, "پرداخت‌شده": p.paid, "مانده": p.total - p.paid, "وضعیت": p.status }));
  return <><PageHeader title="خرید فروشگاه" description="ثبت خرید، آرشیو فاکتورها و بدهی تأمین‌کنندگان"><ExportButtons fileName="آرشیو-خرید" sheets={{ خریدها: rows }} /></PageHeader><InvoiceForm kind="purchase" products={data.products} partners={suppliers} /><section className="card flush"><div className="card-head" style={{ padding: "20px 20px 0" }}><div><h3>آرشیو خریدها</h3><p>{formatNumber(data.purchases.length)} فاکتور اخیر</p></div><FileText size={19} /></div><div className="table-wrap"><table className="data-table"><thead><tr><th>شماره فاکتور</th><th>تأمین‌کننده</th><th>تاریخ</th><th>اقلام</th><th>کل فاکتور</th><th>مانده</th><th>وضعیت</th></tr></thead><tbody>{data.purchases.map((p) => <tr key={p.id}><td><Link href={`/purchases/${p.id}`} className="cell-title" dir="ltr">{p.number}</Link></td><td>{p.party}</td><td>{formatJalali(p.date)}</td><td>{formatNumber(p.itemCount)}</td><td className="money">{formatToman(p.total)}</td><td className="money">{formatToman(p.total - p.paid)}</td><td><StatusPill status={p.status} /></td></tr>)}</tbody></table>{!data.purchases.length ? <EmptyState text="هنوز خریدی ثبت نشده است." /> : null}</div></section></>;
}
