"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { createPartnerAction } from "@/app/actions";
import { ActionMessage, SubmitButton } from "@/components/submit-button";

export function PartnerForm() {
  const [state, action] = useActionState(createPartnerAction, {});
  return <form action={action} className="card form-card">
    <div className="card-head"><div><h3>طرف حساب جدید</h3><p>تأمین‌کننده یا مشتری دارای حساب را ثبت کنید.</p></div><UserPlus size={20} /></div>
    <div className="form-grid cols-3">
      <div className="field"><label>نام *</label><input className="input" name="name" required /></div>
      <div className="field"><label>نوع حساب</label><select className="select" name="type"><option value="supplier">تأمین‌کننده</option><option value="customer">مشتری</option><option value="both">هردو</option></select></div>
      <div className="field"><label>تلفن</label><input className="input" name="phone" dir="ltr" /></div>
      <div className="field span-full"><label>یادداشت</label><textarea className="textarea" name="notes" /></div>
    </div>
    <div className="form-footer"><ActionMessage state={state} /><SubmitButton>ثبت طرف حساب</SubmitButton></div>
  </form>;
}
