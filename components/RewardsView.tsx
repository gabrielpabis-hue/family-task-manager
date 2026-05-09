"use client";

import { useEffect, useState } from "react";
import { getAllBalances, getBalance, settleBalance, getAllPointsHistory, PointEntry } from "@/lib/firestore";
import { useUser } from "@/lib/userContext";
import { UserDoc } from "@/lib/families";

type SharedToggle = "own" | "shared";
type ChartPeriod = "week" | "month" | "year";

interface ChildConfig {
  email: string;
  name: string;
  icon: string;
  barColor: string;
  cardBg: string;
  textClass: string;
  borderClass: string;
}

const WEEK_LABELS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];
const MONTH_LABELS_SHORT = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];

// ── Chart helpers ─────────────────────────────────────────────────────────────

function getWeekData(history: PointEntry[], email: string): number[] {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const start = new Date(monday);
    start.setDate(monday.getDate() + i);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return history
      .filter((e) => e.userId === email && e.awardedAt >= start && e.awardedAt < end)
      .reduce((s, e) => s + e.points, 0);
  });
}

function getMonthData(history: PointEntry[], email: string): { data: number[]; labels: string[] } {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const data = Array.from({ length: days }, (_, i) => {
    const start = new Date(year, month, i + 1);
    const end = new Date(year, month, i + 2);
    return history
      .filter((e) => e.userId === email && e.awardedAt >= start && e.awardedAt < end)
      .reduce((s, e) => s + e.points, 0);
  });
  const labels = Array.from({ length: days }, (_, i) =>
    (i + 1) % 5 === 1 ? String(i + 1) : ""
  );
  return { data, labels };
}

function getYearData(history: PointEntry[], email: string): number[] {
  const year = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, i) => {
    const start = new Date(year, i, 1);
    const end = new Date(year, i + 1, 1);
    return history
      .filter((e) => e.userId === email && e.awardedAt >= start && e.awardedAt < end)
      .reduce((s, e) => s + e.points, 0);
  });
}

// ── BarChart ──────────────────────────────────────────────────────────────────

function BarChart({ data, labels, barColor }: { data: number[]; labels: string[]; barColor: string }) {
  const max = Math.max(...data, 1);
  const W = 300;
  const H = 90;
  const n = data.length;
  const slotW = W / n;
  const barW = Math.max(slotW - (n > 20 ? 1 : 3), 2);
  const total = data.reduce((s, v) => s + v, 0);

  return (
    <div>
      <div className="text-right text-xs text-gray-400 dark:text-gray-500 mb-1">
        Łącznie: <span className="font-semibold text-gray-600 dark:text-gray-300">{total} pkt</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" preserveAspectRatio="none">
        {data.map((val, i) => {
          const bh = max > 0 ? (val / max) * H : 0;
          const x = i * slotW + (slotW - barW) / 2;
          return (
            <g key={i}>
              <rect
                x={x} y={H - bh}
                width={barW} height={Math.max(bh, val > 0 ? 2 : 0)}
                fill={barColor} rx={Math.min(barW / 2, 3)}
                opacity={val > 0 ? 1 : 0.15}
              />
              {val > 0 && bh > 12 && (
                <text x={x + barW / 2} y={H - bh - 2} textAnchor="middle" fontSize="6" fill="#6b7280">{val}</text>
              )}
              {labels[i] && (
                <text x={x + barW / 2} y={H + 13} textAnchor="middle" fontSize="6.5" fill="#9ca3af">{labels[i]}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── BalanceCard ───────────────────────────────────────────────────────────────

function BalanceCard({
  child,
  balance,
  isAdmin,
  onSettle,
}: {
  child: ChildConfig;
  balance: Record<string, number>;
  isAdmin: boolean;
  onSettle: () => void;
}) {
  return (
    <div className={`flex-1 ${child.cardBg} border ${child.borderClass} rounded-2xl p-5 shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{child.icon}</span>
          <div>
            <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{child.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{child.email}</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={onSettle}
            className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium text-gray-700 dark:text-gray-300"
          >
            Rozlicz 💸
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-800/80 rounded-xl p-3 text-center shadow-sm">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Aktualne saldo</p>
          <p className={`text-3xl font-bold ${child.textClass}`}>{balance.currentBalance ?? 0}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">punktów</p>
        </div>
        <div className="bg-white dark:bg-gray-800/80 rounded-xl p-3 text-center shadow-sm">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Łącznie zarobione</p>
          <p className={`text-3xl font-bold ${child.textClass}`}>{balance.totalEarned ?? 0}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">punktów</p>
        </div>
      </div>
    </div>
  );
}

// ── ChartCard ─────────────────────────────────────────────────────────────────

function ChartCard({
  child,
  history,
  period,
}: {
  child: ChildConfig;
  history: PointEntry[];
  period: ChartPeriod;
}) {
  let data: number[];
  let labels: string[];

  if (period === "week") {
    data = getWeekData(history, child.email);
    labels = WEEK_LABELS;
  } else if (period === "month") {
    const m = getMonthData(history, child.email);
    data = m.data;
    labels = m.labels;
  } else {
    data = getYearData(history, child.email);
    labels = MONTH_LABELS_SHORT;
  }

  return (
    <div className={`flex-1 bg-white dark:bg-gray-800/60 border ${child.borderClass} rounded-2xl p-4 shadow-sm`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{child.icon}</span>
        <p className={`font-semibold text-sm ${child.textClass}`}>{child.name}</p>
      </div>
      <BarChart data={data} labels={labels} barColor={child.barColor} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RewardsView() {
  const { isAdmin, isSuperAdmin, userDoc, familyMembers, familyId, loading: userLoading } = useUser();
  const [viewToggle, setViewToggle] = useState<SharedToggle>("own");
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("week");
  const [balances, setBalances] = useState<Record<string, Record<string, number>>>({});
  const [history, setHistory] = useState<PointEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const familyChildren = familyMembers.filter((m) => m.role === "child");

  useEffect(() => {
    if (userLoading || !userDoc) return;
    const childEmails = familyChildren.map((c) => c.email);
    Promise.all([
      getAllBalances(childEmails.length > 0 ? childEmails : undefined),
      getAllPointsHistory(familyId ?? undefined),
    ]).then(([allBalances, allHistory]) => {
      const balMap: Record<string, Record<string, number>> = {};
      for (const b of allBalances) {
        const bal = b as Record<string, unknown>;
        balMap[b.email] = {
          currentBalance: (bal.currentBalance as number) ?? 0,
          totalEarned: (bal.totalEarned as number) ?? 0,
        };
      }
      setBalances(balMap);
      setHistory(allHistory);
      setLoading(false);
    });
  }, [userLoading, userDoc, familyId]);

  async function handleSettle(email: string) {
    if (!userDoc?.email) return;
    await settleBalance(email, userDoc.email);
    setBalances((prev) => ({
      ...prev,
      [email]: { ...prev[email], currentBalance: 0 },
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="inline-block w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const showBoth = isAdmin || viewToggle === "shared";

  // Build dynamic child config from family members
  const THEME_POOL = [
    { icon: "🔥", barColor: "#f97316", cardBg: "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40", textClass: "text-orange-700 dark:text-orange-400", borderClass: "border-orange-200 dark:border-orange-800" },
    { icon: "✨", barColor: "#ec4899", cardBg: "bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/40 dark:to-purple-950/40", textClass: "text-pink-700 dark:text-pink-400", borderClass: "border-pink-200 dark:border-pink-800" },
    { icon: "⭐", barColor: "#8b5cf6", cardBg: "bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/40 dark:to-blue-950/40", textClass: "text-purple-700 dark:text-purple-400", borderClass: "border-purple-200 dark:border-purple-800" },
    { icon: "🌟", barColor: "#10b981", cardBg: "bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/40 dark:to-teal-950/40", textClass: "text-green-700 dark:text-green-400", borderClass: "border-green-200 dark:border-green-800" },
  ];

  // Map known emails to fixed themes, others get sequential
  const EMAIL_THEMES: Record<string, number> = {
    "igipabis@gmail.com": 0,
    "gabik.pabik@gmail.com": 1,
  };

  const childConfigs = familyChildren.map((child, i) => {
    const themeIdx = EMAIL_THEMES[child.email] ?? (i % THEME_POOL.length);
    const theme = THEME_POOL[themeIdx];
    return { email: child.email, name: child.displayName, ...theme };
  });

  const visibleChildren = showBoth
    ? childConfigs
    : childConfigs.filter((c) => c.email === userDoc?.email);

  const chartPeriodLabel: Record<ChartPeriod, string> = {
    week: `Tydzień`,
    month: `Miesiąc`,
    year: `Rok`,
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Child-only toggle */}
      {!isAdmin && (
        <div className="flex gap-1 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-xl p-1 self-start border border-white dark:border-gray-700 shadow-sm">
          {(["own", "shared"] as SharedToggle[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewToggle(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                viewToggle === v ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-sm" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              {v === "own" ? "Tylko ja" : "Wspólny"}
            </button>
          ))}
        </div>
      )}

      {/* Balance cards */}
      <div className={`flex gap-3 ${showBoth ? "flex-row" : "flex-col"}`}>
        {visibleChildren.map((child) => (
          <BalanceCard
            key={child.email}
            child={child}
            balance={balances[child.email] ?? { currentBalance: 0, totalEarned: 0 }}
            isAdmin={isAdmin}
            onSettle={() => handleSettle(child.email)}
          />
        ))}
      </div>

      {/* Charts section */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-white dark:border-gray-700 shadow-lg shadow-violet-100/30 dark:shadow-gray-900/30 p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-700 dark:text-gray-200 text-sm">📊 Zdobyte punkty</p>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(["week", "month", "year"] as ChartPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setChartPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  chartPeriod === p ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-sm" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                {chartPeriodLabel[p]}
              </button>
            ))}
          </div>
        </div>

        <div className={`flex gap-3 ${showBoth ? "flex-row" : "flex-col"}`}>
          {visibleChildren.map((child) => (
            <ChartCard key={child.email} child={child} history={history} period={chartPeriod} />
          ))}
        </div>
      </div>
    </div>
  );
}
