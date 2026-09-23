"use client";

import { useActionState } from "react";
import { Receipt } from "lucide-react";
import { createExpenseAction } from "@/app/actions";
import { ActionMessage, SubmitButton } from "@/components/submit-button";

export function ExpenseForm() {
  const [state, action] = useActionState(createExpenseAction, {});
  return <form action={action} className="card form-card">
    <div className="card-head"><div><h3>ثبت هزینه</h3><p>هزینه‌های جاری در محاسبه سود خالص لحاظ می‌شوند.</p></div><Receipt size={20} /></div>
    <div className="form-grid">
      <div className="field"><label>عنوان *</label><input className="input" name="title" placeholder="مثلاً قبض برق" required /></div>
      <div className="field"><label>دسته‌بندی *</label><select className="select" name="category"><option>قبوض</option><option>اجاره</option><option>حقوق</option><option>حمل‌ونقل</option><option>تعمیرات</option><option>سایر</option></select></div>
      <div className="field"><label>مبلغ (تومان) *</label><input className="input" name="amount" type="number" min="1" required /></div>
      <div className="field"><label>روش پرداخت</label><select className="select" name="paymentMethod"><option value="card">کارت‌خوان</option><option value="cash">نقدی</option><option value="bank_transfer">انتقال بانکی</option></select></div>
      <div className="field span-full"><label>یادداشت</label><textarea className="textarea" name="notes" /></div>
    </div>
    <div className="form-footer"><ActionMessage state={state} /><SubmitButton>ثبت هزینه</SubmitButton></div>
  </form>;
}
