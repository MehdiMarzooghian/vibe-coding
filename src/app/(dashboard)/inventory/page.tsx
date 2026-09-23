import { AlertTriangle, Boxes, CalendarClock, PackageSearch } from "lucide-react";
import { ExportButtons } from "@/components/data-tools";
import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import { formatJalali, formatNumber, formatToman } from "@/lib/format";
import { getAppData } from "@/lib/data";

export const metadata = { title: "موجودی و انبار" };

export default async function InventoryPage() {
  const data = await getAppData(); const value = data.products.reduce((sum, p) => sum + p.stock * p.averageCost, 0); const low = data.products.filter((p) => p.stock <= p.minimumStock);
  const rows = data.products.map((p) => ({ "نام": p.name, "کد": p.sku, "بارکد": p.barcode, "موجودی": p.stock, "واحد": p.baseUnit, "میانگین بها": p.averageCost, "ارزش موجودی": p.stock * p.averageCost, "حد سفارش": p.minimumStock, "نزدیک‌ترین انقضا": p.nearestExpiry }));
  return <><PageHeader title="موجودی و انبار" description="موجودی لحظه‌ای، ارزش انبار و بچ‌های نزدیک به انقضا"><ExportButtons fileName="گزارش-موجودی" sheets={{ موجودی: rows }} /></PageHeader><section className="stats-grid"><StatCard label="ارزش کل موجودی" value={formatToman(value)} icon={Boxes} emphasis /><StatCard label="تعداد کالاها" value={`${formatNumber(data.products.length)} قلم`} icon={PackageSearch} /><StatCard label="نیازمند سفارش" value={`${formatNumber(low.length)} کالا`} icon={AlertTriangle} /><StatCard label="نزدیک انقضا" value={`${formatNumber(data.dashboard.expiringCount)} بچ`} icon={CalendarClock} /></section><section className="card flush"><div className="card-head" style={{ padding: "20px 20px 0" }}><div><h3>دفتر موجودی</h3><p>ارزش بر اساس میانگین موزون فعلی محاسبه شده است.</p></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>کالا</th><th>موجودی</th><th>حد سفارش</th><th>میانگین بها</th><th>ارزش</th><th>نزدیک‌ترین انقضا</th><th>وضعیت</th></tr></thead><tbody>{data.products.map((p) => <tr key={p.id}><td><span className="cell-title">{p.name}</span><div className="cell-subtitle">{p.sku}</div></td><td>{formatNumber(p.stock)} {p.baseUnit}</td><td>{formatNumber(p.minimumStock)}</td><td className="money">{formatToman(p.averageCost)}</td><td className="money">{formatToman(p.stock * p.averageCost)}</td><td>{formatJalali(p.nearestExpiry)}</td><td>{p.stock <= p.minimumStock ? <span className="pill red"><i className="dot" />کمبود</span> : <span className="pill green"><i className="dot" />عادی</span>}</td></tr>)}</tbody></table>{!data.products.length ? <EmptyState /> : null}</div></section></>;
}
