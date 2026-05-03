import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Task Manager",
  description: "Zarządzanie zadaniami rodziny",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="bg-slate-50 min-h-screen">{children}</body>
    </html>
  );
}
