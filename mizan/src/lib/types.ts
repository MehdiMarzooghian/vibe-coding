export type Role = "owner" | "cashier" | "inventory_clerk";
export type DocumentStatus = "draft" | "posted" | "voided" | "partially_returned" | "returned";
export type PaymentMethod = "cash" | "card" | "mixed" | "credit" | "bank_transfer";

export interface Product {
  id: string;
  defaultUnitId: string;
  units: Array<{ id: string; name: string; factor: number; barcode: string | null; salePrice: number }>;
  name: string;
  sku: string;
  barcode: string | null;
  category: string;
  baseUnit: string;
  salePrice: number;
  averageCost: number;
  stock: number;
  minimumStock: number;
  nearestExpiry: string | null;
  active: boolean;
}

export interface DocumentRow {
  id: string;
  number: string;
  party: string;
  date: string;
  total: number;
  paid: number;
  status: DocumentStatus;
  itemCount: number;
}

export interface ExpenseRow {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface PartnerRow {
  id: string;
  name: string;
  type: "supplier" | "customer" | "both";
  phone: string | null;
  balance: number;
}

export interface AlertRow {
  id: string;
  type: "low_stock" | "expiry" | "debt";
  title: string;
  description: string;
  severity: "danger" | "warning" | "info";
}

export interface DashboardData {
  todaySales: number;
  monthSales: number;
  monthPurchases: number;
  grossProfit: number;
  netProfit: number;
  expenses: number;
  inventoryValue: number;
  receivables: number;
  payables: number;
  lowStockCount: number;
  expiringCount: number;
  salesTrend: Array<{ label: string; sales: number; profit: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
}

export interface AppData {
  products: Product[];
  purchases: DocumentRow[];
  sales: DocumentRow[];
  expenses: ExpenseRow[];
  partners: PartnerRow[];
  alerts: AlertRow[];
  dashboard: DashboardData;
}

export interface DocumentDetail {
  id: string;
  kind: "sale" | "purchase";
  number: string;
  party: string;
  date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  returnedTotal: number;
  status: DocumentStatus;
  notes: string | null;
  items: Array<{ id: string; name: string; barcode: string | null; unit: string; quantity: number; unitAmount: number; lineTotal: number }>;
  attachments: Array<{ name: string; url: string }>;
}
