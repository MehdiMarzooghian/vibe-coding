"use client";

import { useActionState } from "react";
import { RotateCcw } from "lucide-react";
import { postReturnAction, voidDocumentAction } from "@/app/actions";
import { ActionMessage, SubmitButton } from "@/components/submit-button";

export function ReturnForm() {
  const [state, action] = useActionState(postReturnAction, {});
  return <form action={action} className="card form-card">
    <div className="card-head"><div><h3>ثبت مرجوعی</h3><p>موجودی، بهای تمام‌شده و وضعیت فاکتور به‌صورت خودکار اصلاح می‌شود.</p></div><RotateCcw size={20} /></div>
    <div className="form-grid">
      <div className="field"><label>نوع سند</label><select className="select" name="type"><option value="sale">مرجوعی فروش</option><option value="purchase">مرجوعی خرید</option></select></div>
      <div className="field"><label>شماره فاکتور *</label><input className="input" name="invoiceNumber" dir="ltr" required /></div>
      <div className="field"><label>بارکد کالا *</label><input className="input" name="barcode" dir="ltr" required /></div>
      <div className="field"><label>تعداد *</label><input className="input" name="quantity" type="number" min="0.001" step="0.001" required /></div>
      <div className="field span-full"><label>دلیل مرجوعی *</label><textarea className="textarea" name="reason" placeholder="علت مرجوعی برای سابقه حسابرسی ثبت می‌شود." required /></div>
    </div>
    <div className="form-footer"><ActionMessage state={state} /><SubmitButton>ثبت مرجوعی</SubmitButton></div>
  </form>;
}

export function VoidDocumentForm() {
  const [state, action] = useActionState(voidDocumentAction, {});
  return <form action={action} className="card form-card">
    <div className="card-head"><div><h3>ابطال کامل سند</h3><p>همه اقلام معکوس می‌شوند و سند اصلی با وضعیت «باطل» در آرشیو می‌ماند.</p></div><RotateCcw size={20} /></div>
    <div className="form-grid cols-3"><div className="field"><label>نوع سند</label><select className="select" name="type"><option value="sale">فروش</option><option value="purchase">خرید</option></select></div><div className="field"><label>شماره فاکتور *</label><input className="input" name="invoiceNumber" dir="ltr" required /></div><div className="field"><label>دلیل ابطال *</label><input className="input" name="reason" required /></div></div>
    <div className="form-footer"><ActionMessage state={state} /><SubmitButton className="btn btn-danger">ابطال کامل سند</SubmitButton></div>
  </form>;
}
