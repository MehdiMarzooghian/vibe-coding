import { Search } from "lucide-react";
import { ProductForm } from "@/components/forms/product-form";
import { ProductUnitForm } from "@/components/forms/product-unit-form";
import { ProductImport, ExportButtons } from "@/components/data-tools";
import { PageHeader, EmptyState } from "@/components/ui";
import { formatJalali, formatNumber, formatToman } from "@/lib/format";
import { getAppData } from "@/lib/data";

export const metadata = { title: "کالاها" };

export default async function ProductsPage() {
  const data = await getAppData();
  const exportRows = data.products.map((p) => ({ "نام کالا": p.name, "کد کالا": p.sku, "بارکد": p.barcode, "دسته‌بندی": p.category, "واحد": p.baseUnit, "قیمت فروش": p.salePrice, "میانگین خرید": p.averageCost, "موجودی": p.stock, "حداقل موجودی": p.minimumStock, "نزدیک‌ترین انقضا": p.nearestExpiry }));
  return <>
    <PageHeader title="کالاها" description={`${formatNumber(data.products.length)} کالا در فهرست فروشگاه`}><ExportButtons fileName="کالاهای-فروشگاه" sheets={{ کالاها: exportRows }} /></PageHeader>
    <ProductForm />
    <ProductUnitForm products={data.products} />
    <ProductImport />
    <section className="card flush"><div className="card-head" style={{ padding: "20px 20px 0" }}><div><h3>فهرست کالاها</h3><p>قیمت، موجودی و وضعیت سفارش</p></div><div className="search-box"><Search size={16} /><input className="input" placeholder="جست‌وجوی نام یا بارکد" /></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>کالا</th><th>دسته</th><th>قیمت فروش</th><th>میانگین خرید</th><th>موجودی</th><th>انقضای نزدیک</th><th>وضعیت</th></tr></thead><tbody>{data.products.map((p) => <tr key={p.id}><td><span className="cell-title">{p.name}</span><div className="cell-subtitle" dir="ltr">{p.barcode || p.sku}</div></td><td>{p.category}</td><td className="money">{formatToman(p.salePrice)}</td><td className="money">{formatToman(p.averageCost)}</td><td>{formatNumber(p.stock)} {p.baseUnit}</td><td>{formatJalali(p.nearestExpiry)}</td><td>{p.stock <= p.minimumStock ? <span className="pill red"><i className="dot" />نیاز به سفارش</span> : <span className="pill green"><i className="dot" />موجود</span>}</td></tr>)}</tbody></table>{!data.products.length ? <EmptyState text="اولین کالا را از فرم بالا ثبت کنید." /> : null}</div></section>
  </>;
}
