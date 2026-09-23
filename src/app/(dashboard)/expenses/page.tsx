import { CircleDollarSign, Receipt } from "lucide-react";
import { ExpenseForm } from "@/components/forms/expense-form";
import { ExportButtons } from "@/components/data-tools";
import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import { formatJalali, formatToman, paymentLabel } from "@/lib/format";
import { getAppData } from "@/lib/data";

export const metadata = { title: "هزینه‌ها" };

export default async function ExpensesPage() {
  const data = await getAppData(); const total = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const rows = data.expenses.map((e) => ({ "عنوان": e.title, "دسته": e.category, "تاریخ": formatJalali(e.date), "مبلغ": e.amount, "روش پرداخت": paymentLabel(e.paymentMethod) }));
  return <><PageHeader title="هزینه‌های جاری" description="هزینه‌ها برای محاسبه سود خالص از سود ناخالص کسر می‌شوند."><ExportButtons fileName="هزینه‌های-فروشگاه" sheets={{ هزینه‌ها: rows }} /></PageHeader><section className="stats-grid"><StatCard label="جمع هزینه‌های ثبت‌شده" value={formatToman(total)} icon={CircleDollarSign} emphasis /><StatCard label="تعداد اسناد هزینه" value={data.expenses.length.toLocaleString("fa-IR")} icon={Receipt} /></section><ExpenseForm /><section className="card flush"><div className="table-wrap"><table className="data-table"><thead><tr><th>عنوان</th><th>دسته</th><th>تاریخ</th><th>روش پرداخت</th><th>مبلغ</th></tr></thead><tbody>{data.expenses.map((e) => <tr key={e.id}><td className="cell-title">{e.title}</td><td>{e.category}</td><td>{formatJalali(e.date)}</td><td>{paymentLabel(e.paymentMethod)}</td><td className="money">{formatToman(e.amount)}</td></tr>)}</tbody></table>{!data.expenses.length ? <EmptyState /> : null}</div></section></>;
}
