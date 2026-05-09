"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useUser } from "@/lib/userContext";
import { getPendingRequestCount } from "@/lib/families";

const links = [
  { href: "/calendar", label: "📅", full: "Kalendarz" },
  { href: "/goals", label: "🎯", full: "Cele" },
  { href: "/finances", label: "🏆", full: "Nagrody" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, isSuperAdmin, userDoc } = useUser();
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

  const initial = userDoc?.displayName?.[0]?.toUpperCase() ?? "?";

  return (
    <nav className="sticky top-0 z-40 bg-white/75 backdrop-blur-xl border-b border-white/60 shadow-sm shadow-violet-100/40">
      <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">

        {/* Logo */}
        <Link href="/calendar" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-base shadow-sm">
            🏠
          </div>
          <span className="font-bold text-sm bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent hidden sm:block">
            FamilyTask
          </span>
        </Link>

        {/* Main links */}
        <div className="flex items-center gap-1 bg-white/60 rounded-2xl p-1 border border-white/80 shadow-inner shadow-violet-50">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-sm shadow-violet-200"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/80"
                }`}
              >
                <span>{link.label}</span>
                <span className="hidden sm:block">{link.full}</span>
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <Link
              href="/admin"
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                pathname.startsWith("/admin")
                  ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-violet-600 hover:bg-violet-50"
              }`}
            >
              ⚙️
              <span className="hidden sm:block">Panel</span>
              {isSuperAdmin && pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse-soft shadow-sm">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </Link>
          )}

          {/* Avatar + logout */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {initial}
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-red-400 transition-all font-medium hidden sm:block"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
