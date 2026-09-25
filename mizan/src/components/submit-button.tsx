"use client";

import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/actions";

export function SubmitButton({ children, className = "btn btn-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} type="submit" disabled={pending}>{pending ? "در حال ثبت…" : children}</button>;
}

export function ActionMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return <span className={`action-message ${state.ok ? "ok" : "error"}`}>{state.message}</span>;
}
