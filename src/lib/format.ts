import { toGregorian, toJalaali } from "jalaali-js";

const number = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 3 });

export function formatToman(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(amount)} تومان`;
}

export function formatNumber(value: number | string | null | undefined): string {
  return number.format(Number(value ?? 0));
}

export function formatJalali(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const local = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
  const jalali = toJalaali(local.getFullYear(), local.getMonth() + 1, local.getDate());
  return `${number.format(jalali.jy)}/${number.format(jalali.jm).padStart(2, "۰")}/${number.format(jalali.jd).padStart(2, "۰")}`;
}

export function paymentLabel(method: string): string {
  return ({
    cash: "نقدی",
    card: "کارت‌خوان",
    mixed: "ترکیبی",
    credit: "بدهی",
    bank_transfer: "انتقال بانکی",
  } as Record<string, string>)[method] ?? method;
}

export function statusLabel(status: string): string {
  return ({
    draft: "پیش‌نویس",
    posted: "نهایی",
    voided: "باطل",
    partially_returned: "مرجوعی جزئی",
    returned: "مرجوع‌شده",
  } as Record<string, string>)[status] ?? status;
}

export function getCurrentJalaliMonthRange() {
  const now = new Date();
  const tehran = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
  const current = toJalaali(tehran.getFullYear(), tehran.getMonth() + 1, tehran.getDate());
  const nextMonth = current.jm === 12 ? { jy: current.jy + 1, jm: 1 } : { jy: current.jy, jm: current.jm + 1 };
  const start = toGregorian(current.jy, current.jm, 1);
  const end = toGregorian(nextMonth.jy, nextMonth.jm, 1);
  const iso = (value: { gy: number; gm: number; gd: number }) => `${value.gy}-${String(value.gm).padStart(2, "0")}-${String(value.gd).padStart(2, "0")}T00:00:00+03:30`;
  return { start: iso(start), end: iso(end) };
}
