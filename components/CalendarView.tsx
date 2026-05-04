"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { getAllTasks, getTasksForUser, deleteTask, Task } from "@/lib/firestore";
import { getUserRole } from "@/lib/roles";

type ViewMode = "day" | "week" | "month";

interface UserTheme {
  icon: string;
  bg: Record<string, string>;
  border: Record<string, string>;
  text: string;
  dot: string;
}

const USER_THEMES: Record<string, UserTheme> = {
  "igipabis@gmail.com": {
    icon: "🔥",
    bg: { normal: "bg-orange-50", important: "bg-amber-100", critical: "bg-red-100" },
    border: { normal: "border-l-orange-400", important: "border-l-amber-500", critical: "border-l-red-600" },
    text: "text-orange-900",
    dot: "bg-orange-400",
  },
  "gabik.pabik@gmail.com": {
    icon: "✨",
    bg: { normal: "bg-pink-50", important: "bg-purple-50", critical: "bg-fuchsia-100" },
    border: { normal: "border-l-pink-300", important: "border-l-purple-400", critical: "border-l-fuchsia-500" },
    text: "text-pink-900",
    dot: "bg-pink-400",
  },
};

const DEFAULT_THEME: UserTheme = {
  icon: "📋",
  bg: { normal: "bg-gray-50", important: "bg-yellow-50", critical: "bg-red-50" },
  border: { normal: "border-l-gray-400", important: "border-l-yellow-400", critical: "border-l-red-400" },
  text: "text-gray-800",
  dot: "bg-gray-400",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-gray-100 text-gray-500",
  done: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Do zrobienia",
  done: "Oczekuje oceny",
  approved: "Zatwierdzone",
};
const PRIORITY_ICONS: Record<string, string> = {
  normal: "⚪",
  important: "🟡",
  critical: "🔴",
};

const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];
const WEEK_DAYS_SHORT = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const w = new Date(d);
    w.setDate(d.getDate() + i);
    return w;
  });
}

function getMonthGrid(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getTasksForDate(tasks: Task[], date: Date): Task[] {
  const str = toDateStr(date);
  return tasks.filter((t) => t.dueDate === str);
}

function TaskTile({
  task,
  isAdmin,
  onDelete,
  compact = false,
}: {
  task: Task;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const theme = USER_THEMES[task.assignedTo] ?? DEFAULT_THEME;
  const bgCls = theme.bg[task.priority] ?? theme.bg.normal;
  const borderCls = theme.border[task.priority] ?? theme.border.normal;

  if (compact) {
    return (
      <div
        className={`${bgCls} border-l-2 ${borderCls} rounded px-1.5 py-0.5 text-xs ${theme.text} truncate flex items-center gap-0.5`}
      >
        <span>{theme.icon}</span>
        <span className="truncate">{task.title}</span>
      </div>
    );
  }

  return (
    <div className={`${bgCls} border-l-4 ${borderCls} rounded-2xl p-4 flex items-start gap-3 shadow-sm`}>
      <span className="text-2xl shrink-0 mt-0.5">{theme.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm ${theme.text} leading-snug`}>{task.title}</p>
        {task.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-xs">{PRIORITY_ICONS[task.priority]}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[task.status]}`}>
            {STATUS_LABELS[task.status]}
          </span>
          {task.recurring && (
            <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">🔁 Cykliczny</span>
          )}
          <span className="text-xs text-gray-400">{task.basePoints} pkt</span>
        </div>
      </div>
      {isAdmin && task.status === "pending" && (
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => router.push(`/goals?edit=${task.id}`)}
            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-sm hover:bg-blue-50 hover:border-blue-300 transition-all"
            title="Edytuj"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-sm hover:bg-red-50 hover:border-red-300 transition-all"
            title="Usuń"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}

function DeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full">
        <h3 className="font-bold text-gray-800 mb-2">Usuń cel</h3>
        <p className="text-sm text-gray-500 mb-5">
          Czy na pewno chcesz usunąć ten cel? Tej operacji nie można cofnąć.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            Anuluj
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600 transition-all"
          >
            Usuń
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CalendarView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user?.email) return;
      const r = getUserRole(user.email);
      setRole(r);
      const data = r === "admin" ? await getAllTasks() : await getTasksForUser(user.email);
      setTasks(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function confirmDelete() {
    if (!deleteConfirmId) return;
    try {
      await deleteTask(deleteConfirmId);
      setTasks((prev) => prev.filter((t) => t.id !== deleteConfirmId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfirmId(null);
    }
  }

  function navigate(dir: -1 | 1) {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (view === "day") d.setDate(d.getDate() + dir);
      else if (view === "week") d.setDate(d.getDate() + 7 * dir);
      else d.setMonth(d.getMonth() + dir);
      return d;
    });
  }

  function goToToday() {
    setCurrentDate(new Date(today));
  }

  function navLabel() {
    if (view === "day") {
      return currentDate.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
    if (view === "week") {
      const days = getWeekDays(currentDate);
      const first = days[0];
      const last = days[6];
      if (first.getMonth() === last.getMonth()) {
        return `${first.getDate()}–${last.getDate()} ${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`;
      }
      return `${first.getDate()} ${MONTH_NAMES[first.getMonth()]} – ${last.getDate()} ${MONTH_NAMES[last.getMonth()]} ${last.getFullYear()}`;
    }
    return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }

  const isAdmin = role === "admin";

  // ── Day view ──────────────────────────────────────────────────────────────
  function DayView() {
    const dayTasks = getTasksForDate(tasks, currentDate);
    return (
      <div className="flex flex-col gap-3">
        {dayTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-gray-400 text-sm">Brak zadań na ten dzień</p>
          </div>
        ) : (
          dayTasks.map((t) => (
            <TaskTile key={t.id} task={t} isAdmin={isAdmin} onDelete={setDeleteConfirmId} />
          ))
        )}
      </div>
    );
  }

  // ── Week view ─────────────────────────────────────────────────────────────
  function WeekView() {
    const days = getWeekDays(currentDate);
    return (
      <div className="overflow-x-auto -mx-1">
        <div className="grid grid-cols-7 gap-1.5 min-w-[560px] px-1">
          {days.map((day) => {
            const isToday = isSameDay(day, today);
            const dayTasks = getTasksForDate(tasks, day);
            return (
              <div key={day.toISOString()} className="flex flex-col">
                <div
                  className={`text-center py-2 px-1 rounded-xl mb-1.5 cursor-pointer transition-all ${
                    isToday
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                  onClick={() => { setCurrentDate(new Date(day)); setView("day"); }}
                >
                  <p className="text-xs font-medium">{WEEK_DAYS_SHORT[day.getDay() === 0 ? 6 : day.getDay() - 1]}</p>
                  <p className="text-base font-bold">{day.getDate()}</p>
                </div>
                <div className="flex flex-col gap-1 min-h-[60px]">
                  {dayTasks.map((t) => (
                    <div key={t.id} className="group relative">
                      <TaskTile task={t} isAdmin={isAdmin} onDelete={setDeleteConfirmId} compact />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Month view ────────────────────────────────────────────────────────────
  function MonthView() {
    const cells = getMonthGrid(currentDate);
    return (
      <div>
        <div className="grid grid-cols-7 mb-1">
          {WEEK_DAYS_SHORT.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const isToday = isSameDay(day, today);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const dayTasks = getTasksForDate(tasks, day);
            const visible = dayTasks.slice(0, 2);
            const extra = dayTasks.length - visible.length;
            return (
              <div
                key={day.toISOString()}
                onClick={() => { setCurrentDate(new Date(day)); setView("day"); }}
                className={`rounded-xl p-1.5 cursor-pointer transition-all border ${
                  isToday
                    ? "border-blue-400 bg-blue-50"
                    : "border-transparent bg-white hover:bg-gray-50"
                } ${!isCurrentMonth ? "opacity-40" : ""}`}
              >
                <p className={`text-xs font-bold mb-1 text-center ${isToday ? "text-blue-600" : "text-gray-600"}`}>
                  {day.getDate()}
                </p>
                <div className="flex flex-col gap-0.5">
                  {visible.map((t) => {
                    const theme = USER_THEMES[t.assignedTo] ?? DEFAULT_THEME;
                    return (
                      <div
                        key={t.id}
                        className={`${theme.bg[t.priority] ?? theme.bg.normal} border-l-2 ${theme.border[t.priority] ?? theme.border.normal} rounded px-1 py-0.5 text-xs ${theme.text} truncate`}
                      >
                        {theme.icon} {t.title}
                      </div>
                    );
                  })}
                  {extra > 0 && (
                    <p className="text-xs text-gray-400 text-center">+{extra} więcej</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="inline-block w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
        {/* View toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 self-start">
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                view === v ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {v === "day" ? "Dzień" : v === "week" ? "Tydzień" : "Miesiąc"}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all font-bold"
          >
            ‹
          </button>
          <p className="flex-1 text-center text-sm font-semibold text-gray-700 capitalize">{navLabel()}</p>
          <button
            onClick={() => navigate(1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all font-bold"
          >
            ›
          </button>
          {!isSameDay(currentDate, today) && (
            <button
              onClick={goToToday}
              className="text-xs font-semibold text-blue-500 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all"
            >
              Dziś
            </button>
          )}
        </div>
      </div>

      {/* Calendar content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        {view === "day" && <DayView />}
        {view === "week" && <WeekView />}
        {view === "month" && <MonthView />}
      </div>

      {/* Delete modal */}
      {deleteConfirmId && (
        <DeleteModal onConfirm={confirmDelete} onCancel={() => setDeleteConfirmId(null)} />
      )}
    </div>
  );
}
