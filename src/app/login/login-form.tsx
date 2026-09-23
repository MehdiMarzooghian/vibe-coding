"use client";

import { useActionState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { signInAction } from "./actions";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm({ ownerEmail, demo }: { ownerEmail: string; demo: boolean }) {
  const [state, action] = useActionState(signInAction, {});
  return <form className="login-form" action={action}>
    <div className="field"><label htmlFor="email">ایمیل مالک</label><div style={{ position: "relative" }}><Mail size={16} style={{ position: "absolute", right: 12, top: 13, color: "#7b8781" }} /><input id="email" name="email" type="email" className="input" style={{ paddingRight: 38 }} defaultValue={ownerEmail} autoComplete="email" required /></div></div>
    <div className="field"><label htmlFor="password">رمز عبور</label><div style={{ position: "relative" }}><KeyRound size={16} style={{ position: "absolute", right: 12, top: 13, color: "#7b8781" }} /><input id="password" name="password" type="password" className="input" style={{ paddingRight: 38 }} placeholder="رمز حساب Supabase" autoComplete="current-password" required={!demo} /></div></div>
    {state.error ? <div className="action-message error" style={{ marginBottom: 12 }}>{state.error}</div> : null}
    <SubmitButton>{demo ? "ورود به پیش‌نمایش" : "ورود امن"}</SubmitButton>
  </form>;
}
