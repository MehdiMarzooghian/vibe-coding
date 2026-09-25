"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { Barcode, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { postPurchaseAction, postSaleAction } from "@/app/actions";
import { ActionMessage, SubmitButton } from "@/components/submit-button";
import { formatToman } from "@/lib/format";
import type { PartnerRow, Product } from "@/lib/types";

interface Line { key: number; productId: string; unitId: string; quantity: number; unitPrice: number; expiryDate: string }

export function InvoiceForm({ kind, products, partners }: { kind: "purchase" | "sale"; products: Product[]; partners: PartnerRow[] }) {
  const actionFn = kind === "purchase" ? postPurchaseAction : postSaleAction;
  const [state, action] = useActionState(actionFn, {});
  const keyRef = useRef(1);
  const first = products[0];
  const [lines, setLines] = useState<Line[]>(first ? [{ key: 0, productId: first.id, unitId: first.defaultUnitId, quantity: 1, unitPrice: kind === "sale" ? first.salePrice : first.averageCost, expiryDate: "" }] : []);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paid, setPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [partyId, setPartyId] = useState("");
  const [notes, setNotes] = useState("");
  const [barcode, setBarcode] = useState("");
  const relevant = partners.filter((p) => kind === "purchase" ? p.type !== "customer" : p.type !== "supplier");
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0), [lines]);
  const total = Math.max(0, subtotal - discount + tax);
  const payload = {
    partyId: partyId || undefined, discount, tax, paidAmount: paymentMethod === "credit" ? 0 : Math.min(paid, total), paymentMethod, notes,
    items: lines.map((line) => ({ productId: line.productId, unitId: line.unitId, quantity: line.quantity, unitPrice: line.unitPrice, expiryDate: kind === "purchase" && line.expiryDate ? line.expiryDate : null })),
  };

  function updateLine(key: number, patch: Partial<Line>) { setLines((value) => value.map((line) => line.key === key ? { ...line, ...patch } : line)); }
  function unitPrice(product: Product, unitId: string) { const unit = product.units.find((item) => item.id === unitId); return kind === "sale" ? (unit?.salePrice ?? product.salePrice) : product.averageCost * (unit?.factor ?? 1); }
  function chooseProduct(key: number, id: string) { const product = products.find((p) => p.id === id); if (product) updateLine(key, { productId: id, unitId: product.defaultUnitId, unitPrice: unitPrice(product, product.defaultUnitId) }); }
  function chooseUnit(key: number, product: Product, unitId: string) { updateLine(key, { unitId, unitPrice: unitPrice(product, unitId) }); }
  function addLine(product = first, unitId = product?.defaultUnitId) { if (!product || !unitId) return; setLines((value) => [...value, { key: keyRef.current++, productId: product.id, unitId, quantity: 1, unitPrice: unitPrice(product, unitId), expiryDate: "" }]); }
  function scan(event: React.FormEvent) { event.preventDefault(); const code = barcode.trim(); const product = products.find((p) => p.barcode === code || p.units.some((unit) => unit.barcode === code)); if (!product) return; const unit = product.units.find((item) => item.barcode === code) ?? product.units.find((item) => item.id === product.defaultUnitId); if (!unit) return; const existing = lines.find((line) => line.productId === product.id && line.unitId === unit.id); if (existing) updateLine(existing.key, { quantity: existing.quantity + 1 }); else addLine(product, unit.id); setBarcode(""); }

  return <form action={action} className="card form-card">
    <div className="card-head"><div><h3>{kind === "purchase" ? "فاکتور خرید جدید" : "فروش جدید"}</h3><p>{kind === "purchase" ? "ثبت خرید، بچ انبار و میانگین موزون در یک عملیات انجام می‌شود." : "بارکد را اسکن کنید یا کالا را از فهرست انتخاب کنید."}</p></div><ShoppingCart size={21} /></div>
    {kind === "sale" ? <div className="barcode-line"><div className="search-box" style={{ flex: 1 }}><Barcode size={17} /><input className="input" value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") scan(e); }} placeholder="بارکد را اسکن کنید و Enter بزنید" dir="ltr" /></div><button className="btn btn-secondary" type="button" onClick={scan}>افزودن</button></div> : null}
    <div>
      {lines.map((line) => { const selected = products.find((p) => p.id === line.productId); return <div className="invoice-row" key={line.key}>
        <div className="field product-field"><label>کالا و واحد</label><select className="select" value={line.productId} onChange={(e) => chooseProduct(line.key, e.target.value)}>{products.map((p) => <option value={p.id} key={p.id}>{p.name} — موجودی {p.stock.toLocaleString("fa-IR")}</option>)}</select><select className="select" value={line.unitId} onChange={(e) => selected && chooseUnit(line.key, selected, e.target.value)}>{selected?.units.map((unit) => <option value={unit.id} key={unit.id}>{unit.name}{unit.factor !== 1 ? ` × ${unit.factor.toLocaleString("fa-IR")}` : ""}</option>)}</select></div>
        <div className="field"><label>تعداد ({selected?.units.find((unit) => unit.id === line.unitId)?.name ?? selected?.baseUnit})</label><input className="input" type="number" min="0.001" step="0.001" value={line.quantity} onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) })} /></div>
        <div className="field"><label>{kind === "purchase" ? "بهای خرید" : "قیمت فروش"}</label><input className="input" type="number" min="0" value={line.unitPrice} onChange={(e) => updateLine(line.key, { unitPrice: Number(e.target.value) })} /></div>
        {kind === "purchase" ? <div className="field"><label>تاریخ انقضا</label><input className="input" type="date" value={line.expiryDate} onChange={(e) => updateLine(line.key, { expiryDate: e.target.value })} /></div> : <div className="field"><label>جمع</label><div className="input money" style={{ display: "flex", alignItems: "center" }}>{formatToman(line.quantity * line.unitPrice)}</div></div>}
        <button className="icon-button" type="button" onClick={() => setLines((value) => value.filter((item) => item.key !== line.key))} disabled={lines.length === 1} aria-label="حذف"><Trash2 size={16} /></button>
      </div>; })}
    </div>
    <button className="btn btn-secondary" type="button" onClick={() => addLine()}><Plus size={16} /> افزودن ردیف</button>
    <div className="form-grid" style={{ marginTop: 16 }}>
      <div className="field"><label>{kind === "purchase" ? "تأمین‌کننده" : "مشتری"}</label><select className="select" value={partyId} onChange={(e) => setPartyId(e.target.value)}><option value="">{kind === "purchase" ? "بدون تأمین‌کننده" : "مشتری نقدی"}</option>{relevant.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></div>
      <div className="field"><label>تخفیف کل</label><input className="input" type="number" min="0" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
      <div className="field"><label>مالیات</label><input className="input" type="number" min="0" value={tax} onChange={(e) => setTax(Number(e.target.value))} /></div>
      <div className="field"><label>مبلغ پرداخت‌شده</label><input className="input" type="number" min="0" max={total} value={paid} onChange={(e) => setPaid(Number(e.target.value))} /></div>
      <div className="field"><label>روش پرداخت</label><select className="select" value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); if (e.target.value === "credit") setPaid(0); }}><option value="card">کارت‌خوان</option><option value="cash">نقدی</option><option value="bank_transfer">انتقال بانکی</option><option value="mixed">ترکیبی</option><option value="credit">بدهی</option></select></div>
      <div className="field span-2"><label>یادداشت</label><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      {kind === "purchase" ? <div className="field span-2"><label>تصویر یا PDF فاکتور (حداکثر ۱۰MB)</label><input className="input" type="file" name="attachment" accept="image/jpeg,image/png,image/webp,application/pdf" /></div> : null}
    </div>
    <input type="hidden" name="payload" value={JSON.stringify(payload)} />
    <div className="invoice-summary"><div className="summary-box"><span>جمع اقلام</span><strong>{formatToman(subtotal)}</strong></div><div className="summary-box"><span>مبلغ نهایی</span><strong>{formatToman(total)}</strong></div><div className="summary-box"><span>پرداخت</span><strong>{formatToman(paymentMethod === "credit" ? 0 : Math.min(paid, total))}</strong></div><div className="summary-box"><span>مانده حساب</span><strong>{formatToman(Math.max(0, total - (paymentMethod === "credit" ? 0 : paid)))}</strong></div></div>
    <div className="form-footer"><ActionMessage state={state} /><SubmitButton>{kind === "purchase" ? "ثبت نهایی خرید" : "ثبت و چاپ فروش"}</SubmitButton></div>
  </form>;
}
