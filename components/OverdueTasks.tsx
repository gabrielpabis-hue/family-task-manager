"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllTasks, updateTask, deleteTask, Task } from "@/lib/firestore";
import { useUser } from "@/lib/userContext";

// ── Date helpers ──────────────────────────────────────────────────────────────

function dateStr(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The "effective" date of a task – the later of dueDate and endDate */
function effectiveDate(task: Task): string {
  if (task.endDate && task.endDate > task.dueDate) return task.endDate;
  return task.dueDate;
}

function isOverdue(task: Task, today: string): boolean {
  return task.status === "pending" && effectiveDate(task) < today;
}

function formatDate(str: string): string {
  const [y, m, d] = str.split("-");
  return `${d}.${m}.${y}`;
}

// ── Child theme config ────────────────────────────────────────────────────────

interface ChildTheme {
  icon: string;
  headerBg: string;
  headerText: string;
  cardBg: string;
  borderLeft: string;
  badgeBg: string;
  badgeText: string;
}

const THEME_POOL: ChildTheme[] = [
  {
    icon: "🔥",
    headerBg: "bg-gradient-to-r from-orange-400 to-amber-400",
    headerText: "text-white",
    cardBg: "bg-orange-50/80 dark:bg-orange-950/30",
    borderLeft: "border-l-orange-400",
    badgeBg: "bg-orange-100 dark:bg-orange-900/50",
    badgeText: "text-orange-700 dark:text-orange-300",
  },
  {
    icon: "✨",
    headerBg: "bg-gradient-to-r from-pink-400 to-purple-400",
    headerText: "text-white",
    cardBg: "bg-pink-50/80 dark:bg-pink-950/30",
    borderLeft: "border-l-pink-400",
    badgeBg: "bg-pink-100 dark:bg-pink-900/50",
    badgeText: "text-pink-700 dark:text-pink-300",
  },
  {
    icon: "⭐",
    headerBg: "bg-gradient-to-r from-purple-400 to-blue-400",
    headerText: "text-white",
    cardBg: "bg-purple-50/80 dark:bg-purple-950/30",
    borderLeft: "border-l-purple-400",
    badgeBg: "bg-purple-100 dark:bg-purple-900/50",
    badgeText: "text-purple-700 dark:text-purple-300",
  },
  {
    icon: "🌟",
    headerBg: "bg-gradient-to-r from-green-400 to-teal-400",
    headerText: "text-white",
    cardBg: "bg-green-50/80 dark:bg-green-950/30",
    borderLeft: "border-l-green-400",
    badgeBg: "bg-green-100 dark:bg-green-900/50",
    badgeText: "text-green-700 dark:text-green-300",
  },
];

const EMAIL_THEME_IDX: Record<string, number> = {
  "igipabis@gmail.com": 0,
  "gabik.pabik@gmail.com": 1,
};

// ── Confirm modal ─────────────────────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel }: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-white dark:border-gray-700">
        <p className="text-gray-700 dark:text-gray-300 mb-5 text-sm">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
            Anuluj
          </button>
          <button onClick={onConfirm}
            className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600">
            Usuń wszystkie
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Child column ──────────────────────────────────────────────────────────────

function ChildColumn({
  name,
  email,
  tasks,
  theme,
  onRestoreToday,
  onRestoreTomorrow,
  onEdit,
  onClearAll,
}: {
  name: string;
  email: string;
  tasks: Task[];
  theme: ChildTheme;
  onRestoreToday: (task: Task) => void;
  onRestoreTomorrow: (task: Task) => void;
  onEdit: (task: Task) => void;
  onClearAll: (email: string) => void;
}) {
  const [confirmClear, setConfirmClear] = useState(false);

  if (tasks.length === 0) {
    return (
      <div className="flex-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-white dark:border-gray-700 shadow-lg shadow-violet-100/30 dark:shadow-gray-900/30 overflow-hidden">
        {/* Header */}
        <div className={`${theme.headerBg} px-4 py-3 flex items-center gap-2`}>
          <span className="text-xl">{theme.icon}</span>
          <div>
            <p className={`font-bold text-sm ${theme.headerText}`}>{name}</p>
            <p className="text-white/70 text-xs">Brak przeterminowanych celów</p>
          </div>
        </div>
        <div className="p-5 text-center text-gray-400 dark:text-gray-500 text-sm py-8">
          ✅ Wszystko na bieżąco!
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-white dark:border-gray-700 shadow-lg shadow-violet-100/30 dark:shadow-gray-900/30 overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`${theme.headerBg} px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{theme.icon}</span>
            <div>
              <p className={`font-bold text-sm ${theme.headerText}`}>{name}</p>
              <p className="text-white/70 text-xs">{tasks.length} przeterminowanych</p>
            </div>
          </div>
          <button
            onClick={() => setConfirmClear(true)}
            className="text-xs bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1.5 rounded-xl transition-all"
          >
            🗑️ Wyczyść wszystkie
          </button>
        </div>

        {/* Task list */}
        <div className="flex flex-col gap-2 p-4 flex-1">
          {tasks.map((task) => {
            const effDate = effectiveDate(task);
            const daysLate = Math.round(
              (new Date(dateStr()).getTime() - new Date(effDate).getTime()) / 86400000
            );
            return (
              <div
                key={task.id}
                className={`${theme.cardBg} border-l-4 ${theme.borderLeft} rounded-xl p-3 flex flex-col gap-2`}
              >
                <div>
                  <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 leading-snug">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${theme.badgeBg} ${theme.badgeText}`}>
                      do {formatDate(effDate)}
                    </span>
                    <span className="text-xs text-red-500 dark:text-red-400 font-medium">
                      -{daysLate} {daysLate === 1 ? "dzień" : "dni"}
                    </span>
                    {task.basePoints > 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{task.basePoints} pkt</span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => onRestoreToday(task)}
                    className="flex-1 min-w-0 text-xs py-1.5 px-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all text-center"
                  >
                    📅 Dziś
                  </button>
                  <button
                    onClick={() => onRestoreTomorrow(task)}
                    className="flex-1 min-w-0 text-xs py-1.5 px-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-semibold transition-all text-center"
                  >
                    📅 Jutro
                  </button>
                  <button
                    onClick={() => onEdit(task)}
                    className="text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {confirmClear && (
        <ConfirmModal
          message={`Czy na pewno chcesz usunąć wszystkie ${tasks.length} przeterminowane cele dla ${name}?`}
          onConfirm={() => { onClearAll(email); setConfirmClear(false); }}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OverdueTasks() {
  const router = useRouter();
  const { isAdmin, familyId, userDoc, familyMembers, loading: userLoading } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const today = dateStr();
  const children = familyMembers.filter((m) => m.role === "child");

  // Only visible to parents/admins
  const canSee = isAdmin || userDoc?.role === "parent";

  useEffect(() => {
    if (userLoading || !userDoc || !canSee) return;
    getAllTasks(familyId ?? undefined).then((all) => {
      setTasks(all.filter((t) => isOverdue(t, today)));
      setLoading(false);
    });
  }, [userLoading, userDoc, familyId]);

  async function handleRestore(task: Task, targetDate: string) {
    await updateTask(task.id, { dueDate: targetDate, endDate: undefined });
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  }

  async function handleClearAll(email: string) {
    const toDelete = tasks.filter((t) => t.assignedTo === email);
    await Promise.all(toDelete.map((t) => deleteTask(t.id)));
    setTasks((prev) => prev.filter((t) => t.assignedTo !== email));
  }

  if (!canSee || loading) return null;

  // Count total overdue across all children
  const totalOverdue = children.reduce(
    (sum, c) => sum + tasks.filter((t) => t.assignedTo === c.email).length,
    0
  );

  if (totalOverdue === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-base">
          ⚠️
        </div>
        <div>
          <h2 className="font-bold text-gray-700 dark:text-gray-200 text-base">Przeterminowane cele</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">{totalOverdue} {totalOverdue === 1 ? "cel wymaga" : "celów wymaga"} aktualizacji daty</p>
        </div>
      </div>

      {/* Child columns */}
      <div className={`flex gap-3 ${children.length > 1 ? "flex-row items-start" : "flex-col"}`}>
        {children.map((child, i) => {
          const themeIdx = EMAIL_THEME_IDX[child.email] ?? (i % THEME_POOL.length);
          const theme = THEME_POOL[themeIdx];
          const childTasks = tasks.filter((t) => t.assignedTo === child.email);
          return (
            <ChildColumn
              key={child.email}
              name={child.displayName}
              email={child.email}
              tasks={childTasks}
              theme={theme}
              onRestoreToday={(task) => handleRestore(task, dateStr(0))}
              onRestoreTomorrow={(task) => handleRestore(task, dateStr(1))}
              onEdit={(task) => router.push(`/goals?edit=${task.id}`)}
              onClearAll={handleClearAll}
            />
          );
        })}
      </div>
    </div>
  );
}
