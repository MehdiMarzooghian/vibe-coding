"use client";

import { useActionState } from "react";
import { PackagePlus } from "lucide-react";
import { createProductAction } from "@/app/actions";
import { ActionMessage, SubmitButton } from "@/components/submit-button";

export function ProductForm() {
  const [state, action] = useActionState(createProductAction, {});
  return <form action={action} className="card form-card">
    <div className="card-head"><div><h3>کالای جدید</h3><p>موجودی اولیه به‌عنوان سند افتتاحیه در گردش انبار ثبت می‌شود.</p></div><PackagePlus size={20} /></div>
    <div className="form-grid">
      <div className="field"><label>نام کالا *</label><input className="input" name="name" placeholder="مثلاً شیر کم‌چرب" required /></div>
      <div className="field"><label>کد کالا *</label><input className="input" name="sku" placeholder="MILK-01" dir="ltr" required /></div>
      <div className="field"><label>بارکد</label><input className="input" name="barcode" placeholder="626…" dir="ltr" /></div>
      <div className="field"><label>دسته‌بندی</label><input className="input" name="category" placeholder="لبنیات" /></div>
      <div className="field"><label>واحد اصلی *</label><select className="select" name="baseUnit" defaultValue="عدد"><option>عدد</option><option>بسته</option><option>کارتن</option><option>کیلوگرم</option><option>گرم</option><option>لیتر</option><option>بطری</option></select></div>
      <div className="field"><label>قیمت فروش (تومان)</label><input className="input" name="salePrice" type="number" min="0" defaultValue="0" /></div>
      <div className="field"><label>موجودی اولیه</label><input className="input" name="initialStock" type="number" min="0" step="0.001" defaultValue="0" /></div>
      <div className="field"><label>بهای واحد اولیه</label><input className="input" name="initialCost" type="number" min="0" defaultValue="0" /></div>
      <div className="field"><label>حداقل موجودی</label><input className="input" name="minimumStock" type="number" min="0" step="0.001" defaultValue="0" /></div>
      <div className="field"><label>تاریخ انقضای موجودی اولیه</label><input className="input" name="expiryDate" type="date" /></div>
    </div>
    <div className="form-footer"><ActionMessage state={state} /><SubmitButton>ثبت کالا</SubmitButton></div>
  </form>;
}
