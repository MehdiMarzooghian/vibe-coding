import { CircleHelp, RotateCcw } from "lucide-react";
import { ReturnForm, VoidDocumentForm } from "@/components/forms/return-form";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "مرجوعی‌ها" };

export default function ReturnsPage() {
  return <><PageHeader title="مرجوعی و اصلاح اسناد" description="فاکتور نهایی حذف نمی‌شود؛ اصلاح با سند برگشتی و ردپای کامل انجام می‌شود." /><ReturnForm /><VoidDocumentForm /><section className="content-grid"><div className="card"><div className="card-head"><div><h3>مرجوعی فروش</h3><p>کالا به همان بچ‌های مصرف‌شده برمی‌گردد و سود با بهای ثبت‌شده اصلاح می‌شود.</p></div><RotateCcw size={20} /></div><p style={{ color: "var(--muted)", fontSize: 12, lineHeight: 2 }}>شماره فاکتور و بارکد روی رسید را وارد کنید. تعداد مرجوعی نمی‌تواند از مقدار فروش منهای مرجوعی‌های قبلی بیشتر باشد.</p></div><div className="card"><div className="card-head"><div><h3>مرجوعی خرید</h3><p>فقط از موجودی باقی‌مانده همان بچ قابل انجام است.</p></div><CircleHelp size={20} /></div><p style={{ color: "var(--muted)", fontSize: 12, lineHeight: 2 }}>ارزش موجودی و بدهی تأمین‌کننده متناسب با بهای اصلی فاکتور اصلاح می‌شود و علت در دفتر حسابرسی باقی می‌ماند.</p></div></section></>;
}
