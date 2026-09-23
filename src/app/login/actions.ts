"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured, ownerEmail } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface LoginState { error?: string }

export async function signInAction(_: LoginState, formData: FormData): Promise<LoginState> {
  if (!isSupabaseConfigured()) redirect("/dashboard");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (email !== ownerEmail.toLowerCase()) return { error: "این ایمیل اجازه ورود به نسخه فعلی را ندارد." };
  if (!password) return { error: "رمز عبور را وارد کنید." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "ایمیل یا رمز عبور صحیح نیست." };
  redirect("/dashboard");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
