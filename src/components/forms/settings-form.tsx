"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { updateSettingsAction } from "@/app/actions";
import { ActionMessage, SubmitButton } from "@/components/submit-button";

export function SettingsForm({ name }: { name: string }) {
  const [state, action] = useActionState(updateSettingsAction, {});
  return <form action={action} className="card form-card"><div className="card-head"><div><h3>تنظیمات عمومی</h3><p>این اطلاعات روی گزارش‌ها و رسید فروش نمایش داده می‌شود.</p></div><Save size={20} /></div><div className="form-grid cols-2"><div className="field"><label>نام فروشگاه</label><input className="input" name="storeName" defaultValue={name} required /></div><div className="field"><label>نرخ پیش‌فرض مالیات (درصد)</label><input className="input" name="taxRate" type="number" min="0" max="100" step="0.01" defaultValue="0" /></div><div className="field"><label>هشدار انقضا از چند روز قبل</label><input className="input" name="expiryWarningDays" type="number" min="1" max="365" defaultValue="30" /></div><div className="field"><label>واحد پول</label><input className="input" value="تومان" disabled /></div><div className="field span-full"><label>متن پایین رسید</label><textarea className="textarea" name="receiptFooter" defaultValue="از خرید شما سپاسگزاریم." /></div></div><div className="form-footer"><ActionMessage state={state} /><SubmitButton>ذخیره تنظیمات</SubmitButton></div></form>;
}
