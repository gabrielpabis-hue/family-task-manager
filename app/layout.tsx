import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FamilyTask",
  description: "Zarządzanie zadaniami rodziny",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
