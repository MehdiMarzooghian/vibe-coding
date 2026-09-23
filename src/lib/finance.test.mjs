import test from "node:test";
import assert from "node:assert/strict";
import { applyPurchase, applyPurchaseReturn, applySale, applySaleReturn, calculateProfit, convertToBase, outstanding } from "./finance.ts";

test("میانگین موزون سناریوی مرجع را محاسبه می‌کند", () => {
  const first = applyPurchase({ quantity: 0, averageCost: 0 }, 10, 100);
  const second = applyPurchase(first, 10, 200);
  const sale = applySale(second, 5);
  assert.equal(second.averageCost, 150);
  assert.equal(sale.costOfGoods, 750);
  assert.equal(calculateProfit(1250, sale.costOfGoods).grossProfit, 500);
});

test("مرجوعی فروش را با هزینه ثبت‌شده به موجودی برمی‌گرداند", () => {
  assert.deepEqual(applySaleReturn({ quantity: 5, averageCost: 200 }, 5, 100), { quantity: 10, averageCost: 150 });
});

test("مرجوعی خرید ارزش موجودی را اصلاح می‌کند", () => {
  assert.deepEqual(applyPurchaseReturn({ quantity: 20, averageCost: 150 }, 10, 200), { quantity: 10, averageCost: 100 });
});

test("کمبود موجودی را رد می‌کند", () => {
  assert.throws(() => applySale({ quantity: 2, averageCost: 10 }, 3), /موجودی کافی نیست/);
});

test("تبدیل واحد و مانده حساب را محاسبه می‌کند", () => {
  assert.equal(convertToBase(2, 12), 24);
  assert.equal(outstanding(1000, 650), 350);
});
