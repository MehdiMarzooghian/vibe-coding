"use client";

import { useActionState, useState } from "react";
import { Download, FileSpreadsheet, Printer, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { importProductsAction } from "@/app/actions";
import { ActionMessage, SubmitButton } from "./submit-button";

type Cell = string | number | boolean | null | undefined;

export function ExportButtons({ fileName, sheets }: { fileName: string; sheets: Record<string, Array<Record<string, Cell>>> }) {
  function exportExcel() {
    const workbook = XLSX.utils.book_new();
    Object.entries(sheets).forEach(([name, rows]) => XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), name.slice(0, 31)));
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }
  function exportCsv() {
    const [name, rows] = Object.entries(sheets)[0] ?? ["data", []];
    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(rows), { FS: "," });
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${fileName}-${name}.csv`; link.click(); URL.revokeObjectURL(url);
  }
  return <div className="actions no-print"><button className="btn btn-secondary" onClick={exportExcel}><FileSpreadsheet size={16} /> Excel</button><button className="btn btn-secondary" onClick={exportCsv}><Download size={16} /> CSV</button><button className="btn btn-secondary" onClick={() => window.print()}><Printer size={16} /> PDF / چاپ</button></div>;
}

const aliases: Record<string, string> = {
  "نام کالا": "name", name: "name", "کد کالا": "sku", sku: "sku", بارکد: "barcode", barcode: "barcode",
  "دسته‌بندی": "category", category: "category", واحد: "base_unit", base_unit: "base_unit", "قیمت فروش": "sale_price", sale_price: "sale_price",
  "موجودی اولیه": "initial_stock", initial_stock: "initial_stock", "بهای اولیه": "initial_cost", initial_cost: "initial_cost",
  "حداقل موجودی": "minimum_stock", minimum_stock: "minimum_stock", "تاریخ انقضا": "expiry_date", expiry_date: "expiry_date",
};

export function ProductImport() {
  const [state, action] = useActionState(importProductsAction, {});
  const [rows, setRows] = useState<Array<Record<string, Cell>>>([]);
  const [error, setError] = useState("");
  async function readFile(file?: File) {
    if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const raw = XLSX.utils.sheet_to_json<Record<string, Cell>>(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
      const normalized: Array<Record<string, Cell>> = raw.map((row) => {
        const item: Record<string, Cell> = {};
        Object.entries(row).forEach(([key, value]) => { const alias = aliases[key.trim()]; if (alias) item[alias] = value; });
        return { ...item, base_unit: item.base_unit || "عدد", sale_price: Number(item.sale_price || 0), initial_stock: Number(item.initial_stock || 0), initial_cost: Number(item.initial_cost || 0), minimum_stock: Number(item.minimum_stock || 0), expiry_date: item.expiry_date || null };
      });
      const invalid = normalized.findIndex((row) => !row["name"] || !row["sku"]);
      if (invalid >= 0) throw new Error(`نام یا کد کالا در ردیف ${invalid + 2} خالی است.`);
      setRows(normalized); setError("");
    } catch (reason) { setRows([]); setError(reason instanceof Error ? reason.message : "فایل معتبر نیست."); }
  }
  function template() {
    const rows = [{ "نام کالا": "نمونه کالا", "کد کالا": "SKU-001", بارکد: "626000000000", "دسته‌بندی": "خواربار", واحد: "عدد", "قیمت فروش": 100000, "موجودی اولیه": 10, "بهای اولیه": 80000, "حداقل موجودی": 3, "تاریخ انقضا": "2027-01-01" }];
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), "کالاها"); XLSX.writeFile(book, "قالب-ورود-کالا.xlsx");
  }
  return <form action={action} className="card form-card">
    <div className="card-head"><div><h3>ورود گروهی کالا</h3><p>فایل Excel یا CSV را بررسی کنید و سپس ردیف‌های معتبر را وارد کنید.</p></div><Upload size={20} /></div>
    <div className="form-grid cols-2"><div className="field"><label>فایل کالاها</label><input className="input" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => readFile(e.target.files?.[0])} /></div><div className="field"><label>وضعیت بررسی</label><div className="input" style={{ display: "flex", alignItems: "center" }}>{error || (rows.length ? `${rows.length.toLocaleString("fa-IR")} ردیف آماده ورود است.` : "هنوز فایلی انتخاب نشده است.")}</div></div></div>
    <input type="hidden" name="rows" value={JSON.stringify(rows)} />
    <div className="form-footer"><ActionMessage state={state} /><button type="button" className="btn btn-secondary" onClick={template}><Download size={15} /> دریافت قالب</button><SubmitButton>ورود {rows.length ? rows.length.toLocaleString("fa-IR") : ""} کالا</SubmitButton></div>
  </form>;
}
