"use client";

import { useActionState } from "react";
import { PackageOpen } from "lucide-react";
import { createProductUnitAction } from "@/app/actions";
import { ActionMessage, SubmitButton } from "@/components/submit-button";
import type { Product } from "@/lib/types";

export function ProductUnitForm({ products }: { products: Product[] }) {
  const [state, action] = useActionState(createProductUnitAction, {});
  return <form action={action} className="card form-card"><div className="card-head"><div><h3>واحد فرعی کالا</h3><p>مثلاً یک کارتن برابر ۱۲ عدد؛ هر واحد می‌تواند بارکد و قیمت فروش جدا داشته باشد.</p></div><PackageOpen size={20} /></div><div className="form-grid"><div className="field"><label>کالا</label><select className="select" name="productId" required><option value="">انتخاب کالا</option>{products.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></div><div className="field"><label>نام واحد</label><input className="input" name="name" placeholder="کارتن" required /></div><div className="field"><label>ضریب نسبت به واحد اصلی</label><input className="input" name="factor" type="number" min="0.001" step="0.001" placeholder="12" required /></div><div className="field"><label>بارکد واحد</label><input className="input" name="barcode" dir="ltr" /></div><div className="field"><label>قیمت فروش واحد</label><input className="input" name="salePrice" type="number" min="0" defaultValue="0" /></div></div><div className="form-footer"><ActionMessage state={state} /><SubmitButton>ثبت واحد فرعی</SubmitButton></div></form>;
}
