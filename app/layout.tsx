import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/themeContext";

export const metadata: Metadata = {
  title: "FamilyTiTask",
  description: "Organizuj obowiązki i zadania Twojej rodziny",
};

// Inline script prevents flash of wrong theme before React hydrates
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || ((!t || t === 'auto') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch(e){}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
