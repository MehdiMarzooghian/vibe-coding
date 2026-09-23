import { redirect } from "next/navigation";
import { demoData } from "./demo-data";
import { isSupabaseConfigured } from "./env";
import { createSupabaseServerClient } from "./supabase/server";
import { getCurrentJalaliMonthRange } from "./format";
import type { AlertRow, AppData, DashboardData, DocumentDetail, DocumentRow, ExpenseRow, PartnerRow, Product, Role } from "./types";

export interface StoreContext {
  configured: boolean;
  storeId: string | null;
  storeName: string;
  role: Role;
  email: string;
}

export async function getStoreContext(): Promise<StoreContext> {
  if (!isSupabaseConfigured()) {
    return { configured: false, storeId: null, storeName: "سوپرمارکت من", role: "owner", email: "حالت نمایشی" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let { data: membership } = await supabase
    .from("store_memberships")
    .select("store_id, role, stores(name)")
    .eq("user_id", user.id)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    const { error } = await supabase.rpc("bootstrap_owner_store", { p_store_name: "سوپرمارکت من" });
    if (error) throw new Error(`راه‌اندازی حساب مالک انجام نشد: ${error.message}`);
    const result = await supabase
      .from("store_memberships")
      .select("store_id, role, stores(name)")
      .eq("user_id", user.id)
      .eq("active", true)
      .limit(1)
      .single();
    membership = result.data;
  }

  const store = membership?.stores as unknown as { name: string } | null;
  return {
    configured: true,
    storeId: membership!.store_id,
    storeName: store?.name ?? "سوپرمارکت من",
    role: membership!.role as Role,
    email: user.email ?? "",
  };
}

const emptyDashboard: DashboardData = {
  todaySales: 0, monthSales: 0, monthPurchases: 0, grossProfit: 0, netProfit: 0,
  expenses: 0, inventoryValue: 0, receivables: 0, payables: 0, lowStockCount: 0,
  expiringCount: 0, salesTrend: [], topProducts: [],
};

function num(value: unknown) {
  return Number(value ?? 0);
}

export async function getAppData(): Promise<AppData> {
  const context = await getStoreContext();
  if (!context.configured) return demoData;
  const supabase = await createSupabaseServerClient();
  const month = getCurrentJalaliMonthRange();

  const [productsResult, purchasesResult, salesResult, expensesResult, partnersResult, alertsResult, unitsResult, dashboardResult] = await Promise.all([
    supabase.from("product_overview").select("*").eq("store_id", context.storeId!).order("name"),
    supabase.from("purchase_overview").select("*").eq("store_id", context.storeId!).order("issued_at", { ascending: false }).limit(100),
    supabase.from("sale_overview").select("*").eq("store_id", context.storeId!).order("issued_at", { ascending: false }).limit(100),
    supabase.from("expenses").select("id,title,category,occurred_at,amount,payment_method").eq("store_id", context.storeId!).order("occurred_at", { ascending: false }).limit(100),
    supabase.from("partner_overview").select("*").eq("store_id", context.storeId!).order("name"),
    supabase.from("alert_overview").select("*").eq("store_id", context.storeId!).order("severity_order"),
    supabase.from("product_units").select("id,product_id,name,factor,barcode,sale_price").eq("store_id", context.storeId!).order("is_default", { ascending: false }),
    supabase.rpc("dashboard_metrics", { p_store_id: context.storeId, p_month_start: month.start, p_month_end: month.end }),
  ]);

  const products: Product[] = (productsResult.data ?? []).map((row) => ({
    id: row.id, defaultUnitId: row.default_unit_id, units: (unitsResult.data ?? []).filter((unit) => unit.product_id === row.id).map((unit) => ({ id: unit.id, name: unit.name, factor: num(unit.factor), barcode: unit.barcode, salePrice: num(unit.sale_price) })), name: row.name, sku: row.sku, barcode: row.barcode, category: row.category_name ?? "بدون دسته‌بندی",
    baseUnit: row.base_unit, salePrice: num(row.sale_price), averageCost: num(row.average_cost), stock: num(row.stock),
    minimumStock: num(row.minimum_stock), nearestExpiry: row.nearest_expiry, active: row.active,
  }));
  const mapDocument = (row: Record<string, unknown>): DocumentRow => ({
    id: String(row.id), number: String(row.invoice_number), party: String(row.party_name ?? "بدون نام"), date: String(row.issued_at),
    total: num(row.total), paid: num(row.paid), status: row.status as DocumentRow["status"], itemCount: num(row.item_count),
  });
  const expenses: ExpenseRow[] = (expensesResult.data ?? []).map((row) => ({
    id: row.id, title: row.title, category: row.category, date: row.occurred_at, amount: num(row.amount), paymentMethod: row.payment_method,
  }));
  const partners: PartnerRow[] = (partnersResult.data ?? []).map((row) => ({
    id: row.id, name: row.name, type: row.type, phone: row.phone, balance: num(row.balance),
  }));
  const alerts: AlertRow[] = (alertsResult.data ?? []).map((row) => ({
    id: String(row.id), type: row.alert_type, title: row.title, description: row.description, severity: row.severity,
  }));
  const rawDashboard = dashboardResult.data as Record<string, unknown> | null;
  const dashboard: DashboardData = rawDashboard ? {
    todaySales: num(rawDashboard.today_sales), monthSales: num(rawDashboard.month_sales), monthPurchases: num(rawDashboard.month_purchases),
    grossProfit: num(rawDashboard.gross_profit), netProfit: num(rawDashboard.net_profit), expenses: num(rawDashboard.expenses),
    inventoryValue: num(rawDashboard.inventory_value), receivables: num(rawDashboard.receivables), payables: num(rawDashboard.payables),
    lowStockCount: num(rawDashboard.low_stock_count), expiringCount: num(rawDashboard.expiring_count),
    salesTrend: (rawDashboard.sales_trend as DashboardData["salesTrend"]) ?? [],
    topProducts: (rawDashboard.top_products as DashboardData["topProducts"]) ?? [],
  } : emptyDashboard;

  return {
    products,
    purchases: (purchasesResult.data ?? []).map(mapDocument),
    sales: (salesResult.data ?? []).map(mapDocument),
    expenses,
    partners,
    alerts,
    dashboard,
  };
}

export async function getDocumentDetail(kind: "sale" | "purchase", id: string): Promise<DocumentDetail | null> {
  const context = await getStoreContext();
  if (!context.configured) {
    const row = (kind === "sale" ? demoData.sales : demoData.purchases).find((item) => item.id === id);
    if (!row) return null;
    const items = demoData.products.slice(0, Math.min(3, demoData.products.length)).map((p, index) => ({ id: p.id, name: p.name, barcode: p.barcode, unit: p.baseUnit, quantity: index + 1, unitAmount: kind === "sale" ? p.salePrice : p.averageCost, lineTotal: (index + 1) * (kind === "sale" ? p.salePrice : p.averageCost) }));
    return { id: row.id, kind, number: row.number, party: row.party, date: row.date, subtotal: row.total, discount: 0, tax: 0, total: row.total, paid: row.paid, returnedTotal: 0, status: row.status, notes: null, items, attachments: [] };
  }
  const supabase = await createSupabaseServerClient();
  const table = kind === "sale" ? "sales" : "purchases";
  const itemTable = kind === "sale" ? "sale_items" : "purchase_items";
  const partyJoin = kind === "sale" ? "partners!sales_customer_id_fkey(name)" : "partners!purchases_supplier_id_fkey(name)";
  const { data: header, error } = await supabase.from(table).select(`id,invoice_number,issued_at,subtotal,discount,tax,total,paid,returned_total,status,notes,${partyJoin}`).eq("store_id", context.storeId!).eq("id", id).maybeSingle();
  if (error || !header) return null;
  const amountColumn = kind === "sale" ? "unit_price" : "unit_cost";
  const { data: items } = await supabase.from(itemTable).select(`id,product_name,barcode,unit_name,quantity,${amountColumn},line_total`).eq("store_id", context.storeId!).eq(kind === "sale" ? "sale_id" : "purchase_id", id).order("created_at");
  const { data: attachments } = await supabase.from("attachments").select("file_name,storage_path").eq("store_id", context.storeId!).eq("entity_type", kind).eq("entity_id", id);
  const signed = await Promise.all((attachments ?? []).map(async (file) => {
    const { data } = await supabase.storage.from("invoice-attachments").createSignedUrl(file.storage_path, 300);
    return { name: file.file_name, url: data?.signedUrl ?? "" };
  }));
  const party = header.partners as unknown as { name: string } | null;
  return {
    id: header.id, kind, number: header.invoice_number, party: party?.name ?? (kind === "sale" ? "مشتری نقدی" : "بدون تأمین‌کننده"),
    date: header.issued_at, subtotal: num(header.subtotal), discount: num(header.discount), tax: num(header.tax), total: num(header.total), paid: num(header.paid),
    returnedTotal: num(header.returned_total), status: header.status, notes: header.notes,
    items: (items ?? []).map((item) => ({ id: item.id, name: item.product_name, barcode: item.barcode, unit: item.unit_name, quantity: num(item.quantity), unitAmount: num((item as Record<string, unknown>)[amountColumn]), lineTotal: num(item.line_total) })),
    attachments: signed.filter((file) => file.url),
  };
}
