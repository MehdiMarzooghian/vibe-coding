"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "چاپ / ذخیره PDF", mode = "a4" }: { label?: string; mode?: "a4" | "thermal" }) {
  function print() {
    document.documentElement.dataset.printSize = mode;
    window.addEventListener("afterprint", () => { delete document.documentElement.dataset.printSize; }, { once: true });
    window.print();
  }
  return <button className="btn btn-primary no-print" onClick={print}><Printer size={16} /> {label}</button>;
}
