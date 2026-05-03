"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { getAllBalances, getBalance, settleBalance } from "@/lib/firestore";
import { getUserRole } from "@/lib/roles";

const CHILD_NAMES: Record<string, string> = {
  "igipabis@gmail.com": "Igi",
  "gabik.pabik@gmail.com": "Gabi",
};

export default function PointsBoard() {
  const [role, setRole] = useState<string | null>(null);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user?.email) return;
      setUserEmail(user.email);
      const r = getUserRole(user.email);
      setRole(r);
      if (r === "admin") {
        const data = await getAllBalances();
        setBalances(data);
      } else {
        const data = await getBalance(user.email);
        setBalances([{ email: user.email, ...data }]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleSettle(email: string) {
    if (!userEmail) return;
    await settleBalance(email, userEmail);
    setBalances((prev) => prev.map((b) => b.email === email ? { ...b, currentBalance: 0 } : b));
  }

  if (loading) return <p className="text-gray-400 text-sm">Ładowanie...</p>;

  return (
    <div className="flex flex-col gap-4">
      {balances.map((b) => (
        <div key={b.email} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-700 text-lg">{CHILD_NAMES[b.email] || b.email.split("@")[0]}</p>
              <p className="text-xs text-gray-400">{b.email}</p>
            </div>
            {role === "admin" && (
              <button onClick={() => handleSettle(b.email)}
                className="text-xs bg-pink-50 text-pink-500 px-3 py-2 rounded-xl hover:bg-pink-100 transition-all">
                Rozlicz 💸
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-blue-400 mb-1">Aktualne saldo</p>
              <p className="text-2xl font-semibold text-blue-600">{b.currentBalance ?? 0}</p>
              <p className="text-xs text-blue-400">punktów</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xs text-green-400 mb-1">Łącznie zarobione</p>
              <p className="text-2xl font-semibold text-green-600">{b.totalEarned ?? 0}</p>
              <p className="text-xs text-green-400">punktów</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
