"use client";

import { useEffect, useState } from "react";
import { getAllBalances } from "@/lib/firestore";
import { useUser } from "@/lib/userContext";

const MEDALS = ["🥇", "🥈", "🥉"];

const THEME_POOL = [
  { barColor: "from-orange-400 to-amber-400", textClass: "text-orange-600 dark:text-orange-400", bgClass: "bg-orange-50 dark:bg-orange-950/30", icon: "🔥" },
  { barColor: "from-pink-400 to-purple-400", textClass: "text-pink-600 dark:text-pink-400", bgClass: "bg-pink-50 dark:bg-pink-950/30", icon: "✨" },
  { barColor: "from-purple-400 to-blue-400", textClass: "text-purple-600 dark:text-purple-400", bgClass: "bg-purple-50 dark:bg-purple-950/30", icon: "⭐" },
  { barColor: "from-green-400 to-teal-400", textClass: "text-green-600 dark:text-green-400", bgClass: "bg-green-50 dark:bg-green-950/30", icon: "🌟" },
];

const EMAIL_THEME_IDX: Record<string, number> = {
  "igipabis@gmail.com": 0,
  "gabik.pabik@gmail.com": 1,
};

interface ChildBalance {
  email: string;
  name: string;
  totalEarned: number;
  currentBalance: number;
  themeIdx: number;
}

export default function Leaderboard() {
  const { familyMembers, userDoc, loading: userLoading } = useUser();
  const [data, setData] = useState<ChildBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const children = familyMembers.filter((m) => m.role === "child");

  useEffect(() => {
    if (userLoading || !userDoc || children.length === 0) {
      setLoading(false);
      return;
    }
    const emails = children.map((c) => c.email);
    getAllBalances(emails).then((balances) => {
      const items: ChildBalance[] = children.map((child, i) => {
        const bal = balances.find((b) => b.email === child.email);
        const balData = bal as Record<string, unknown> | undefined;
        return {
          email: child.email,
          name: child.displayName,
          totalEarned: (balData?.totalEarned as number) ?? 0,
          currentBalance: (balData?.currentBalance as number) ?? 0,
          themeIdx: EMAIL_THEME_IDX[child.email] ?? (i % THEME_POOL.length),
        };
      });
      // Sort by totalEarned descending
      items.sort((a, b) => b.totalEarned - a.totalEarned);
      setData(items);
      setLoading(false);
    });
  }, [userLoading, userDoc, familyMembers]);

  if (loading || data.length < 2) return null;

  const maxEarned = Math.max(...data.map((d) => d.totalEarned), 1);

  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-white dark:border-gray-700 shadow-lg shadow-violet-100/30 dark:shadow-gray-900/30 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-blue-500 px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg">🏆</div>
        <div>
          <p className="font-bold text-white text-base">Tabela wyników</p>
          <p className="text-white/70 text-xs">Łącznie zarobione punkty</p>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {data.map((child, idx) => {
          const theme = THEME_POOL[child.themeIdx];
          const medal = MEDALS[idx] ?? `#${idx + 1}`;
          const barWidth = maxEarned > 0 ? Math.round((child.totalEarned / maxEarned) * 100) : 0;
          const isLeader = idx === 0;

          return (
            <div
              key={child.email}
              className={`${theme.bgClass} rounded-2xl p-4 ${isLeader ? "ring-2 ring-offset-2 ring-violet-300 dark:ring-violet-700 dark:ring-offset-gray-900" : ""}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{medal}</span>
                <span className="text-xl">{theme.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${theme.textClass}`}>{child.name}</p>
                  {isLeader && (
                    <p className="text-xs text-violet-500 dark:text-violet-400 font-semibold">👑 Lider</p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${theme.textClass}`}>{child.totalEarned}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">łącznie</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 bg-white/60 dark:bg-gray-800/60 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${theme.barColor} rounded-full transition-all duration-700`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <div className="flex justify-between mt-1.5">
                <p className="text-xs text-gray-400 dark:text-gray-500">Saldo: <span className={`font-semibold ${theme.textClass}`}>{child.currentBalance} pkt</span></p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{barWidth}% maksimum</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
