export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("YOUR_PROJECT"),
  );
}

export const ownerEmail = process.env.OWNER_EMAIL ?? process.env.NEXT_PUBLIC_OWNER_EMAIL ?? "mehdimarzooghian@gmail.com";
