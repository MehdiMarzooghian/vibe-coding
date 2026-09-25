import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "میزان | مدیریت سوپرمارکت", template: "%s | میزان" },
  description: "سامانه فارسی مدیریت خرید، فروش، انبار و سود فروشگاه",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#173f35", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        {children}
        <Toaster position="top-center" richColors dir="rtl" />
      </body>
    </html>
  );
}
