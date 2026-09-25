"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Box, ChartNoAxesCombined, CircleDollarSign, ClipboardList, Gauge, LogOut, PackagePlus, RefreshCcw, Settings, ShoppingBasket, Store, Tags, UsersRound } from "lucide-react";
import { signOutAction } from "@/app/login/actions";

const primary = [
  { href: "/dashboard", label: "داشبورد", icon: Gauge },
  { href: "/sales", label: "فروش و صندوق", icon: ShoppingBasket },
  { href: "/purchases", label: "خرید فروشگاه", icon: PackagePlus },
  { href: "/products", label: "کالاها", icon: Tags },
  { href: "/inventory", label: "موجودی و انبار", icon: Box },
];
const secondary = [
  { href: "/returns", label: "مرجوعی‌ها", icon: RefreshCcw },
  { href: "/partners", label: "اشخاص و حساب‌ها", icon: UsersRound },
  { href: "/expenses", label: "هزینه‌ها", icon: CircleDollarSign },
  { href: "/reports", label: "گزارش‌ها", icon: ChartNoAxesCombined },
  { href: "/alerts", label: "هشدارها", icon: Bell },
  { href: "/settings", label: "تنظیمات", icon: Settings },
];

function NavLink({ item, badge }: { item: (typeof primary)[number]; badge?: number }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return <Link href={item.href} className={`nav-link ${active ? "active" : ""}`}><Icon size={18} /> <span>{item.label}</span>{badge ? <span className="badge">{badge.toLocaleString("fa-IR")}</span> : null}</Link>;
}

export function AppShell({ children, storeName, email, configured, alertCount }: { children: React.ReactNode; storeName: string; email: string; configured: boolean; alertCount: number }) {
  const pathname = usePathname();
  const today = new Intl.DateTimeFormat("fa-IR", { dateStyle: "full", timeZone: "Asia/Tehran" }).format(new Date());
  const mobile = [...primary.slice(0, 4), { href: "/reports", label: "گزارش", icon: ClipboardList }];
  return <div className="app-layout">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Store size={25} /></span><div><h1>میزان</h1><p>مدیریت هوشمند فروشگاه</p></div></div>
      <div className="nav-section-label">عملیات روزانه</div>
      <nav className="nav-list">{primary.map((item) => <NavLink item={item} key={item.href} />)}</nav>
      <div className="nav-section-label">مدیریت و گزارش</div>
      <nav className="nav-list">{secondary.map((item) => <NavLink item={item} badge={item.href === "/alerts" ? alertCount : undefined} key={item.href} />)}</nav>
      <div className="sidebar-user"><span className="avatar">م</span><div><strong>{storeName}</strong><span>{email}</span></div>{configured ? <form action={signOutAction}><button className="signout" aria-label="خروج"><LogOut size={17} /></button></form> : null}</div>
    </aside>
    <main className="main-shell">
      <header className="topbar">
        <span className="topbar-date">{today}</span>
        <div className="topbar-actions"><span className="connection-chip"><i className="connection-dot" />{configured ? "متصل به پایگاه داده" : "نسخه نمایشی"}</span><Link href="/alerts" className="icon-button" aria-label="هشدارها"><Bell size={18} /></Link></div>
      </header>
      {children}
    </main>
    <nav className="mobile-nav">{mobile.map((item) => { const Icon = item.icon; const active = pathname === item.href; return <Link href={item.href} className={active ? "active" : ""} key={item.href}><Icon size={19} /><span>{item.label}</span></Link>; })}</nav>
  </div>;
}
