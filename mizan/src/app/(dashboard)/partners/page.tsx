import { UsersRound } from "lucide-react";
import { PartnerForm } from "@/components/forms/partner-form";
import { ExportButtons } from "@/components/data-tools";
import { EmptyState, PageHeader } from "@/components/ui";
import { formatToman } from "@/lib/format";
import { getAppData } from "@/lib/data";

export const metadata = { title: "اشخاص و حساب‌ها" };

export default async function PartnersPage() {
  const data = await getAppData();
  const rows = data.partners.map((p) => ({ "نام": p.name, "نوع": p.type, "تلفن": p.phone, "مانده حساب": p.balance }));
  return <><PageHeader title="اشخاص و حساب‌ها" description="تأمین‌کنندگان، مشتریان و مانده بدهکار یا بستانکار"><ExportButtons fileName="حساب-اشخاص" sheets={{ اشخاص: rows }} /></PageHeader><PartnerForm /><section className="card flush"><div className="card-head" style={{ padding: "20px 20px 0" }}><div><h3>دفتر اشخاص</h3><p>عدد مثبت طلب از شخص و عدد منفی بدهی فروشگاه است.</p></div><UsersRound size={20} /></div><div className="table-wrap"><table className="data-table"><thead><tr><th>نام</th><th>نوع</th><th>تلفن</th><th>مانده حساب</th><th>وضعیت</th></tr></thead><tbody>{data.partners.map((p) => <tr key={p.id}><td className="cell-title">{p.name}</td><td>{p.type === "supplier" ? "تأمین‌کننده" : p.type === "customer" ? "مشتری" : "تأمین‌کننده و مشتری"}</td><td dir="ltr">{p.phone || "—"}</td><td className="money">{formatToman(Math.abs(p.balance))}</td><td>{p.balance === 0 ? <span className="pill green"><i className="dot" />تسویه</span> : p.balance > 0 ? <span className="pill blue"><i className="dot" />طلبکاریم</span> : <span className="pill amber"><i className="dot" />بدهکاریم</span>}</td></tr>)}</tbody></table>{!data.partners.length ? <EmptyState text="اولین تأمین‌کننده یا مشتری را ثبت کنید." /> : null}</div></section></>;
}
