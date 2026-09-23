import type { AppData } from "./types";

export const demoData: AppData = {
  products: [
    { id: "p1", defaultUnitId: "u1", units: [{ id: "u1", name: "عدد", factor: 1, barcode: "626000100001", salePrice: 48000 }], name: "شیر کم‌چرب", sku: "MILK-01", barcode: "626000100001", category: "لبنیات", baseUnit: "عدد", salePrice: 48000, averageCost: 39000, stock: 8, minimumStock: 12, nearestExpiry: "2026-10-01", active: true },
    { id: "p2", defaultUnitId: "u2", units: [{ id: "u2", name: "کیلوگرم", factor: 1, barcode: "626000100002", salePrice: 220000 }], name: "برنج ایرانی", sku: "RICE-01", barcode: "626000100002", category: "خواربار", baseUnit: "کیلوگرم", salePrice: 220000, averageCost: 185000, stock: 42.5, minimumStock: 15, nearestExpiry: null, active: true },
    { id: "p3", defaultUnitId: "u3", units: [{ id: "u3", name: "عدد", factor: 1, barcode: "626000100003", salePrice: 59000 }], name: "آبمیوه پرتقال", sku: "JUICE-02", barcode: "626000100003", category: "نوشیدنی", baseUnit: "عدد", salePrice: 59000, averageCost: 44000, stock: 24, minimumStock: 10, nearestExpiry: "2026-09-29", active: true },
    { id: "p4", defaultUnitId: "u4", units: [{ id: "u4", name: "بطری", factor: 1, barcode: "626000100004", salePrice: 189000 }], name: "روغن آفتابگردان", sku: "OIL-04", barcode: "626000100004", category: "خواربار", baseUnit: "بطری", salePrice: 189000, averageCost: 161000, stock: 5, minimumStock: 8, nearestExpiry: "2027-03-12", active: true },
  ],
  purchases: [
    { id: "pu1", number: "PU-14050721-001", party: "پخش بهار", date: "2026-09-22T08:30:00Z", total: 7850000, paid: 5000000, status: "posted", itemCount: 7 },
    { id: "pu2", number: "PU-14050719-004", party: "توزیع سپهر", date: "2026-09-20T11:15:00Z", total: 4260000, paid: 4260000, status: "posted", itemCount: 4 },
  ],
  sales: [
    { id: "s1", number: "SA-14050722-031", party: "مشتری نقدی", date: "2026-09-23T07:45:00Z", total: 684000, paid: 684000, status: "posted", itemCount: 5 },
    { id: "s2", number: "SA-14050722-030", party: "فروش روزانه", date: "2026-09-23T07:30:00Z", total: 392000, paid: 300000, status: "posted", itemCount: 3 },
    { id: "s3", number: "SA-14050721-024", party: "مشتری نقدی", date: "2026-09-22T16:20:00Z", total: 1125000, paid: 1125000, status: "posted", itemCount: 8 },
  ],
  expenses: [
    { id: "e1", title: "قبض برق", category: "قبوض", date: "2026-09-21T09:00:00Z", amount: 920000, paymentMethod: "card" },
    { id: "e2", title: "حمل بار", category: "حمل‌ونقل", date: "2026-09-22T12:00:00Z", amount: 350000, paymentMethod: "cash" },
  ],
  partners: [
    { id: "pa1", name: "پخش بهار", type: "supplier", phone: "09120000001", balance: -2850000 },
    { id: "pa2", name: "توزیع سپهر", type: "supplier", phone: "09120000002", balance: 0 },
    { id: "pa3", name: "حساب مشتریان", type: "customer", phone: null, balance: 92000 },
  ],
  alerts: [
    { id: "a1", type: "expiry", title: "آبمیوه پرتقال", description: "۶ روز تا تاریخ انقضا باقی مانده است.", severity: "danger" },
    { id: "a2", type: "low_stock", title: "شیر کم‌چرب", description: "موجودی ۸ عدد؛ حد سفارش ۱۲ عدد.", severity: "warning" },
    { id: "a3", type: "debt", title: "بدهی به پخش بهار", description: "۲٬۸۵۰٬۰۰۰ تومان مانده پرداخت.", severity: "info" },
  ],
  dashboard: {
    todaySales: 1076000,
    monthSales: 38740000,
    monthPurchases: 29180000,
    grossProfit: 9560000,
    netProfit: 8290000,
    expenses: 1270000,
    inventoryValue: 56300000,
    receivables: 1240000,
    payables: 7110000,
    lowStockCount: 2,
    expiringCount: 1,
    salesTrend: [
      { label: "۱۷ شهریور", sales: 4100000, profit: 980000 },
      { label: "۱۸ شهریور", sales: 5300000, profit: 1220000 },
      { label: "۱۹ شهریور", sales: 4600000, profit: 1090000 },
      { label: "۲۰ شهریور", sales: 6200000, profit: 1510000 },
      { label: "۲۱ شهریور", sales: 5800000, profit: 1380000 },
      { label: "۲۲ شهریور", sales: 7100000, profit: 1760000 },
      { label: "امروز", sales: 1076000, profit: 310000 },
    ],
    topProducts: [
      { name: "شیر کم‌چرب", quantity: 86, revenue: 4128000 },
      { name: "برنج ایرانی", quantity: 18.5, revenue: 4070000 },
      { name: "روغن آفتابگردان", quantity: 21, revenue: 3969000 },
    ],
  },
};
