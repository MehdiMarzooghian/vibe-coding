"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatToman } from "@/lib/format";

export function DashboardChart({ data }: { data: Array<{ label: string; sales: number; profit: number }> }) {
  if (!data.length) return <div className="empty">پس از ثبت فروش، نمودار اینجا نمایش داده می‌شود.</div>;
  return <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 12, left: 0, right: 4, bottom: 0 }}><defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#245d4e" stopOpacity={0.28} /><stop offset="100%" stopColor="#245d4e" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ece6" /><XAxis dataKey="label" tick={{ fontSize: 10, fill: "#77817c" }} axisLine={false} tickLine={false} /><YAxis hide /><Tooltip formatter={(value) => formatToman(Number(value))} contentStyle={{ borderRadius: 12, border: "1px solid #e4e8df", fontFamily: "Tahoma", fontSize: 11, direction: "rtl" }} /><Area type="monotone" dataKey="sales" name="فروش" stroke="#245d4e" strokeWidth={2.5} fill="url(#salesFill)" /><Area type="monotone" dataKey="profit" name="سود" stroke="#a2bc4a" strokeWidth={2} fill="transparent" /></AreaChart></ResponsiveContainer></div>;
}
