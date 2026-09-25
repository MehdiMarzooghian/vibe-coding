import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { PrintButton } from "./print-button";
import { PageHeader, StatusPill } from "./ui";
import { formatJalali, formatNumber, formatToman } from "@/lib/format";
import type { DocumentDetail } from "@/lib/types";

export function DocumentDetailView({ document }: { document: DocumentDetail }) {
  const title = document.kind === "sale" ? "رسید فروش" : "فاکتور خرید";
  return <>
    <PageHeader title={title} description={`شماره ${document.number}`}>
      <Link className="btn btn-secondary no-print" href={document.kind === "sale" ? "/sales" : "/purchases"}><ArrowRight size={16} /> بازگشت</Link>
      {document.kind === "sale" ? <PrintButton label="رسید ۸۰mm" mode="thermal" /> : null}
      <PrintButton label="A4 / PDF" />
    </PageHeader>
    <article className="card receipt">
      <div className="receipt-head"><div><h2>میزان</h2><p>سامانه مدیریت سوپرمارکت</p></div><div><StatusPill status={document.status} /><p dir="ltr">{document.number}</p></div></div>
      <div className="receipt-meta"><div><span>{document.kind === "sale" ? "مشتری" : "تأمین‌کننده"}</span><strong>{document.party}</strong></div><div><span>تاریخ</span><strong>{formatJalali(document.date)}</strong></div><div><span>نوع سند</span><strong>{title}</strong></div></div>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>#</th><th>شرح کالا</th><th>تعداد</th><th>فی واحد</th><th>جمع</th></tr></thead><tbody>{document.items.map((item,index) => <tr key={item.id}><td>{formatNumber(index+1)}</td><td><span className="cell-title">{item.name}</span><div className="cell-subtitle" dir="ltr">{item.barcode || "—"}</div></td><td>{formatNumber(item.quantity)} {item.unit}</td><td className="money">{formatToman(item.unitAmount)}</td><td className="money">{formatToman(item.lineTotal)}</td></tr>)}</tbody></table></div>
      <div className="receipt-totals"><div><span>جمع اقلام</span><strong>{formatToman(document.subtotal)}</strong></div><div><span>تخفیف</span><strong>{formatToman(document.discount)}</strong></div><div><span>مالیات</span><strong>{formatToman(document.tax)}</strong></div><div className="grand"><span>مبلغ نهایی</span><strong>{formatToman(document.total-document.returnedTotal)}</strong></div><div><span>پرداخت‌شده</span><strong>{formatToman(document.paid)}</strong></div><div><span>مانده</span><strong>{formatToman(Math.max(0,document.total-document.returnedTotal-document.paid))}</strong></div></div>
      {document.notes ? <div className="receipt-note"><strong>یادداشت:</strong> {document.notes}</div> : null}
      {document.attachments.length ? <div className="attachments no-print"><h3>فایل‌های ضمیمه</h3>{document.attachments.map((file) => <a className="btn btn-secondary" href={file.url} target="_blank" rel="noreferrer" key={file.url}><Download size={15} /> {file.name}</a>)}</div> : null}
      <footer className="receipt-footer">از خرید شما سپاسگزاریم.</footer>
    </article>
  </>;
}
