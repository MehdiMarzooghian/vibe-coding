import type { LucideIcon } from "lucide-react";

export function PageHeader({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return <div className="page-head"><div><h2>{title}</h2><p>{description}</p></div>{children ? <div className="actions">{children}</div> : null}</div>;
}

export function StatCard({ label, value, icon: Icon, emphasis, meta }: { label: string; value: string; icon: LucideIcon; emphasis?: boolean; meta?: string }) {
  return <div className={`stat-card ${emphasis ? "emphasis" : ""}`}><span className="stat-icon"><Icon size={19} /></span><div className="stat-label">{label}</div><div className="stat-value">{value}</div>{meta ? <span className="stat-meta">{meta}</span> : null}</div>;
}

export function EmptyState({ text = "هنوز اطلاعاتی ثبت نشده است." }: { text?: string }) {
  return <div className="empty">{text}</div>;
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    posted: { label: "نهایی", color: "green" }, draft: { label: "پیش‌نویس", color: "amber" }, voided: { label: "باطل", color: "red" },
    partially_returned: { label: "مرجوعی جزئی", color: "amber" }, returned: { label: "مرجوع‌شده", color: "blue" },
  };
  const item = map[status] ?? { label: status, color: "blue" };
  return <span className={`pill ${item.color}`}><i className="dot" />{item.label}</span>;
}
