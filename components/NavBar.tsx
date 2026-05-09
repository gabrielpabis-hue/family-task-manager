"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useUser } from "@/lib/userContext";
import { getPendingRequestCount } from "@/lib/families";

const links = [
  { href: "/calendar", label: "📅 Kalendarz" },
  { href: "/goals", label: "🎯 Cele" },
  { href: "/finances", label: "🏆 Nagrody" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, isSuperAdmin } = useUser();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isSuperAdmin) return;
    getPendingRequestCount().then(setPendingCount).catch(() => {});
  }, [isSuperAdmin]);

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              pathname.startsWith(link.href)
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <Link
            href="/admin"
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              pathname.startsWith("/admin")
                ? "bg-violet-50 text-violet-600"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            ⚙️ Panel
            {isSuperAdmin && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-gray-600 transition-all"
        >
          Wyloguj
        </button>
      </div>
    </nav>
  );
}
