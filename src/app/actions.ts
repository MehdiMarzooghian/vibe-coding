"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStoreContext } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ActionState { ok?: boolean; message?: string }
const requiredText = z.string().trim().min(1, "این فیلد الزامی است");
const nonNegative = z.coerce.number().min(0, "مقدار نمی‌تواند منفی باشد");

function demoState(): ActionState {
  return { ok: false, message: "برای ثبت اطلاعات واقعی ابتدا Supabase را از فایل راهنما متصل کنید." };
}

async function dbContext() {
  const context = await getStoreContext();
  if (!context.configured || !context.storeId) return null;
  return { context, supabase: await createSupabaseServerClient() };
}

export async function createProductAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return demoState();
  const schema = z.object({
    name: requiredText, sku: requiredText, barcode: z.string().trim().optional(), category: z.string().trim().optional(),
    baseUnit: requiredText, salePrice: nonNegative, initialStock: nonNegative, initialCost: nonNegative, minimumStock: nonNegative,
    expiryDate: z.string().optional(),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  const db = await dbContext();
  if (!db) return demoState();
  const { error } = await db.supabase.rpc("create_product_with_opening_stock", {
    p_store_id: db.context.storeId,
    p_payload: {
      name: parsed.data.name, sku: parsed.data.sku, barcode: parsed.data.barcode || null, category: parsed.data.category || null,
      base_unit: parsed.data.baseUnit, sale_price: parsed.data.salePrice, initial_stock: parsed.data.initialStock,
      initial_cost: parsed.data.initialCost, minimum_stock: parsed.data.minimumStock, expiry_date: parsed.data.expiryDate || null,
    },
  });
  if (error) return { ok: false, message: error.message.includes("duplicate") ? "کد یا بارکد تکراری است." : error.message };
  revalidatePath("/products"); revalidatePath("/dashboard"); revalidatePath("/inventory");
  return { ok: true, message: "کالا با موفقیت ثبت شد." };
}

export async function importProductsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return demoState();
  let rows: unknown;
  try { rows = JSON.parse(String(formData.get("rows") ?? "[]")); } catch { return { ok: false, message: "فایل قابل خواندن نیست." }; }
  const rowSchema = z.object({
    name: requiredText, sku: requiredText, barcode: z.string().optional(), category: z.string().optional(), base_unit: requiredText,
    sale_price: nonNegative, initial_stock: nonNegative, initial_cost: nonNegative, minimum_stock: nonNegative, expiry_date: z.string().nullable().optional(),
  });
  const parsed = z.array(rowSchema).min(1).max(2000).safeParse(rows);
  if (!parsed.success) return { ok: false, message: `ردیف نامعتبر: ${parsed.error.issues[0]?.message}` };
  const db = await dbContext(); if (!db) return demoState();
  const { data, error } = await db.supabase.rpc("import_products", { p_store_id: db.context.storeId, p_rows: parsed.data });
  if (error) return { ok: false, message: error.message };
  const result = data as { imported?: number } | null;
  revalidatePath("/products"); revalidatePath("/inventory"); revalidatePath("/dashboard");
  return { ok: true, message: `${result?.imported ?? parsed.data.length} کالا وارد شد.` };
}

export async function createPartnerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return demoState();
  const schema = z.object({ name: requiredText, type: z.enum(["supplier", "customer", "both"]), phone: z.string().trim().optional(), notes: z.string().trim().optional() });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  const db = await dbContext(); if (!db) return demoState();
  const { error } = await db.supabase.from("partners").insert({ store_id: db.context.storeId, ...parsed.data, phone: parsed.data.phone || null, notes: parsed.data.notes || null });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/partners");
  return { ok: true, message: "طرف حساب ثبت شد." };
}

export async function createProductUnitAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return demoState();
  const schema = z.object({ productId: z.string().uuid(), name: requiredText, factor: z.coerce.number().positive(), barcode: z.string().trim().optional(), salePrice: nonNegative });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "نام، ضریب و قیمت واحد را درست وارد کنید." };
  const db = await dbContext(); if (!db) return demoState();
  const { error } = await db.supabase.from("product_units").insert({ store_id: db.context.storeId, product_id: parsed.data.productId, name: parsed.data.name, factor: parsed.data.factor, barcode: parsed.data.barcode || null, sale_price: parsed.data.salePrice, is_default: false });
  if (error) return { ok: false, message: error.message.includes("duplicate") ? "نام یا بارکد این واحد تکراری است." : error.message };
  revalidatePath("/products"); revalidatePath("/sales"); revalidatePath("/purchases");
  return { ok: true, message: "واحد فرعی کالا ثبت شد." };
}

export async function createExpenseAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return demoState();
  const schema = z.object({ title: requiredText, category: requiredText, amount: z.coerce.number().positive(), paymentMethod: z.enum(["cash", "card", "bank_transfer"]), notes: z.string().optional() });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "اطلاعات هزینه کامل نیست." };
  const db = await dbContext(); if (!db) return demoState();
  const { error } = await db.supabase.from("expenses").insert({
    store_id: db.context.storeId, title: parsed.data.title, category: parsed.data.category, amount: parsed.data.amount,
    payment_method: parsed.data.paymentMethod, notes: parsed.data.notes || null,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/expenses"); revalidatePath("/dashboard"); revalidatePath("/reports");
  return { ok: true, message: "هزینه ثبت شد." };
}

const invoiceSchema = z.object({
  partyId: z.string().uuid().nullable().optional(), discount: nonNegative.default(0), tax: nonNegative.default(0),
  paidAmount: nonNegative.default(0), paymentMethod: z.enum(["cash", "card", "mixed", "credit", "bank_transfer"]),
  notes: z.string().optional(), items: z.array(z.object({ productId: z.string().uuid(), unitId: z.string().uuid(), quantity: z.number().positive(), unitPrice: z.number().min(0), expiryDate: z.string().nullable().optional() })).min(1),
});

async function postDocument(kind: "purchase" | "sale", formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return demoState();
  let payload: unknown;
  try { payload = JSON.parse(String(formData.get("payload") ?? "{}")); } catch { return { ok: false, message: "اطلاعات فاکتور معتبر نیست." }; }
  const parsed = invoiceSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "اقلام فاکتور ناقص است." };
  const db = await dbContext(); if (!db) return demoState();
  const rpc = kind === "purchase" ? "post_purchase" : "post_sale";
  const { data, error } = await db.supabase.rpc(rpc, { p_store_id: db.context.storeId, p_payload: parsed.data });
  if (error) return { ok: false, message: error.message };

  const attachment = formData.get("attachment");
  const result = data as { id?: string } | null;
  if (kind === "purchase" && attachment instanceof File && attachment.size > 0 && result?.id) {
    if (attachment.size > 10 * 1024 * 1024) return { ok: true, message: "خرید ثبت شد؛ فایل بزرگ‌تر از ۱۰ مگابایت بود و بارگذاری نشد." };
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(attachment.type)) {
      const extension = attachment.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "bin";
      const path = `${db.context.storeId}/purchases/${result.id}/${crypto.randomUUID()}.${extension}`;
      const upload = await db.supabase.storage.from("invoice-attachments").upload(path, attachment, { contentType: attachment.type });
      if (!upload.error) await db.supabase.from("attachments").insert({ store_id: db.context.storeId, entity_type: "purchase", entity_id: result.id, storage_path: path, file_name: attachment.name, mime_type: attachment.type, size_bytes: attachment.size });
    }
  }
  ["/dashboard", "/products", "/inventory", kind === "purchase" ? "/purchases" : "/sales", "/reports", "/alerts"].forEach((path) => revalidatePath(path));
  return { ok: true, message: kind === "purchase" ? "خرید و موجودی با موفقیت ثبت شد." : "فروش با موفقیت ثبت شد." };
}

export async function postPurchaseAction(_: ActionState, formData: FormData) { return postDocument("purchase", formData); }
export async function postSaleAction(_: ActionState, formData: FormData) { return postDocument("sale", formData); }

export async function postReturnAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return demoState();
  const schema = z.object({ type: z.enum(["sale", "purchase"]), invoiceNumber: requiredText, barcode: requiredText, quantity: z.coerce.number().positive(), reason: requiredText });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "اطلاعات مرجوعی کامل نیست." };
  const db = await dbContext(); if (!db) return demoState();
  const { error } = await db.supabase.rpc(parsed.data.type === "sale" ? "post_sale_return" : "post_purchase_return", {
    p_store_id: db.context.storeId, p_invoice_number: parsed.data.invoiceNumber, p_barcode: parsed.data.barcode,
    p_quantity: parsed.data.quantity, p_reason: parsed.data.reason,
  });
  if (error) return { ok: false, message: error.message };
  ["/returns", "/sales", "/purchases", "/inventory", "/dashboard", "/reports"].forEach((path) => revalidatePath(path));
  return { ok: true, message: "مرجوعی ثبت و موجودی/حساب‌ها اصلاح شد." };
}

export async function voidDocumentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return demoState();
  const schema = z.object({ type: z.enum(["sale", "purchase"]), invoiceNumber: requiredText, reason: requiredText });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "شماره سند و دلیل ابطال الزامی است." };
  const db = await dbContext(); if (!db) return demoState();
  const { error } = await db.supabase.rpc("void_document", { p_store_id: db.context.storeId, p_type: parsed.data.type, p_invoice_number: parsed.data.invoiceNumber, p_reason: parsed.data.reason });
  if (error) return { ok: false, message: error.message };
  ["/returns", "/sales", "/purchases", "/inventory", "/dashboard", "/reports"].forEach((path) => revalidatePath(path));
  return { ok: true, message: "سند با حفظ ردپای حسابرسی باطل شد." };
}

export async function updateSettingsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return demoState();
  const schema = z.object({ storeName: requiredText, taxRate: z.coerce.number().min(0).max(100), expiryWarningDays: z.coerce.number().int().min(1).max(365), receiptFooter: z.string().max(500).optional() });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "تنظیمات واردشده معتبر نیست." };
  const db = await dbContext(); if (!db) return demoState();
  const { error } = await db.supabase.from("stores").update({ name: parsed.data.storeName, tax_rate: parsed.data.taxRate, expiry_warning_days: parsed.data.expiryWarningDays, receipt_footer: parsed.data.receiptFooter || null }).eq("id", db.context.storeId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/", "layout");
  return { ok: true, message: "تنظیمات فروشگاه ذخیره شد." };
}
