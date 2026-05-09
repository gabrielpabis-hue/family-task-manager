"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllTasks, getTasksForUser, deleteTask, markTaskDone, Task, TaskStatus } from "@/lib/firestore";
import { uploadProofPhoto } from "@/lib/storage";
import { useUser } from "@/lib/userContext";

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
    bg: { normal: "bg-orange-50 dark:bg-orange-950/40", important: "bg-amber-100 dark:bg-amber-950/40", critical: "bg-red-100 dark:bg-red-950/40" },
    border: { normal: "border-l-orange-400", important: "border-l-amber-500", critical: "border-l-red-600" },
    text: "text-orange-900 dark:text-orange-300",
    dot: "bg-orange-400",
  },
  "gabik.pabik@gmail.com": {
    icon: "✨",
    bg: { normal: "bg-pink-50 dark:bg-pink-950/40", important: "bg-purple-50 dark:bg-purple-950/40", critical: "bg-fuchsia-100 dark:bg-fuchsia-950/40" },
    border: { normal: "border-l-pink-300", important: "border-l-purple-400", critical: "border-l-fuchsia-500" },
    text: "text-pink-900 dark:text-pink-300",
    dot: "bg-pink-400",
  },
};

const DEFAULT_THEME: UserTheme = {
  icon: "📋",
  bg: { normal: "bg-gray-50 dark:bg-gray-800/60", important: "bg-yellow-50 dark:bg-yellow-950/40", critical: "bg-red-50 dark:bg-red-950/40" },
  border: { normal: "border-l-gray-400", important: "border-l-yellow-400", critical: "border-l-red-400" },
  text: "text-gray-800 dark:text-gray-200",
  dot: "bg-gray-400",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
  done: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
  approved: "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400",
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
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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
  return tasks.filter((t) => {
    if (t.dueDate > str) return false;
    if (!t.endDate) return t.dueDate === str;
    return str <= t.endDate;
  });
}

// ── TaskTile ──────────────────────────────────────────────────────────────────

function TaskTile({
  task,
  isAdmin,
  onDelete,
  onMarkDone,
  compact = false,
}: {
  task: Task;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onMarkDone?: (task: Task) => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const theme = USER_THEMES[task.assignedTo] ?? DEFAULT_THEME;
  const bgCls = theme.bg[task.priority] ?? theme.bg.normal;
  const borderCls = theme.border[task.priority] ?? theme.border.normal;

  if (compact) {
    return (
      <div className={`${bgCls} border-l-2 ${borderCls} rounded px-1.5 py-0.5 text-xs ${theme.text} truncate flex items-center gap-0.5`}>
        <span>{theme.icon}</span>
        <span className="truncate">{task.title}</span>
      </div>
    );
  }

  return (
    <div className={`${bgCls} border-l-4 ${borderCls} rounded-2xl p-4 flex flex-col gap-3 shadow-sm`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0 mt-0.5">{theme.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm ${theme.text} leading-snug`}>{task.title}</p>
          {task.description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-xs">{PRIORITY_ICONS[task.priority]}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </span>
            {task.recurring && (
              <span className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 px-2 py-0.5 rounded-full">🔁 Cykliczny</span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">{task.basePoints} pkt</span>
          </div>
        </div>
        {isAdmin && task.status === "pending" && (
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={() => router.push(`/goals?edit=${task.id}`)}
              className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 transition-all"
              title="Edytuj"
            >✏️</button>
            <button
              onClick={() => onDelete(task.id)}
              className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 transition-all"
              title="Usuń"
            >🗑️</button>
          </div>
        )}
      </div>

      {/* Proof photo preview (if submitted) */}
      {task.proofPhotoUrl && (
        <a href={task.proofPhotoUrl} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={task.proofPhotoUrl}
            alt="Dowód wykonania"
            className="w-full max-h-40 object-cover rounded-xl border border-gray-200 dark:border-gray-600 hover:opacity-90 transition-opacity"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">📸 Kliknij aby powiększyć</p>
        </a>
      )}

      {/* Zrobiłem! button for children */}
      {!isAdmin && task.status === "pending" && onMarkDone && (
        <button
          onClick={() => onMarkDone(task)}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-green-200/50 dark:shadow-green-900/30"
        >
          ✅ Zrobiłem!
        </button>
      )}
    </div>
  );
}

// ── DeleteModal ───────────────────────────────────────────────────────────────

function DeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-white dark:border-gray-700">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Usuń cel</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Czy na pewno chcesz usunąć ten cel? Tej operacji nie można cofnąć.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">Anuluj</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600 transition-all">Usuń</button>
        </div>
      </div>
    </div>
  );
}

// ── DoneModal ─────────────────────────────────────────────────────────────────

function DoneModal({
  task,
  onConfirm,
  onCancel,
}: {
  task: Task;
  onConfirm: (file: File | null) => void;
  onCancel: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  function clearPhoto() {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const theme = USER_THEMES[task.assignedTo] ?? DEFAULT_THEME;

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full border border-white dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">{theme.icon}</span>
          <div>
            <p className="font-bold text-white text-sm">Oznacz jako zrobione</p>
            <p className="text-white/70 text-xs truncate">{task.title}</p>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Photo upload */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">📸 Dodaj zdjęcie jako dowód</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Opcjonalne – pomoże rodzicowi ocenić pracę</p>

            {preview ? (
              <div className="relative">
                <img src={preview} alt="Podgląd" className="w-full max-h-48 object-cover rounded-xl border border-gray-200 dark:border-gray-600" />
                <button
                  onClick={clearPhoto}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-sm transition-all"
                >×</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-5 cursor-pointer hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all">
                <span className="text-3xl">📷</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Kliknij aby dodać zdjęcie</span>
                <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
              </label>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">Anuluj</button>
            <button
              onClick={() => onConfirm(file)}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl py-2.5 text-sm font-bold transition-all"
            >
              ✅ Potwierdź
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CalendarView ──────────────────────────────────────────────────────────────

export default function CalendarView() {
  const router = useRouter();
  const { isAdmin, familyId, userDoc, loading: userLoading } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [doneModal, setDoneModal] = useState<Task | null>(null);
  const [submittingDone, setSubmittingDone] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (userLoading || !userDoc) return;
    const load = async () => {
      const data = isAdmin
        ? await getAllTasks(familyId)
        : await getTasksForUser(userDoc.email, familyId ?? undefined);
      setTasks(data);
      setLoading(false);
    };
    load();
  }, [userLoading, userDoc, isAdmin, familyId]);

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

  async function handleMarkDone(file: File | null) {
    if (!doneModal) return;
    setSubmittingDone(true);
    try {
      let photoUrl: string | undefined;
      if (file) photoUrl = await uploadProofPhoto(doneModal.id, file);
      await markTaskDone(doneModal.id, photoUrl);
      setTasks((prev) => prev.map((t) =>
        t.id === doneModal.id
          ? { ...t, status: "done" as TaskStatus, ...(photoUrl ? { proofPhotoUrl: photoUrl } : {}) }
          : t
      ));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingDone(false);
      setDoneModal(null);
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

  function goToToday() { setCurrentDate(new Date(today)); }

  function navLabel() {
    if (view === "day") return currentDate.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    if (view === "week") {
      const days = getWeekDays(currentDate);
      const first = days[0], last = days[6];
      if (first.getMonth() === last.getMonth()) return `${first.getDate()}–${last.getDate()} ${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`;
      return `${first.getDate()} ${MONTH_NAMES[first.getMonth()]} – ${last.getDate()} ${MONTH_NAMES[last.getMonth()]} ${last.getFullYear()}`;
    }
    return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }

  // ── Day view ──────────────────────────────────────────────────────────────
  function DayView() {
    const dayTasks = getTasksForDate(tasks, currentDate);
    const dateParam = toDateStr(currentDate);
    return (
      <div className="flex flex-col gap-3">
        {dayTasks.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-950/60 dark:to-blue-950/60 flex items-center justify-center text-3xl">📭</div>
            <div>
              <p className="font-semibold text-gray-500 dark:text-gray-400">Wolny dzień!</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">Brak zadań na ten dzień</p>
            </div>
          </div>
        ) : (
          dayTasks.map((t) => (
            <TaskTile
              key={t.id}
              task={t}
              isAdmin={isAdmin}
              onDelete={setDeleteConfirmId}
              onMarkDone={!isAdmin ? setDoneModal : undefined}
            />
          ))
        )}
        {isAdmin && (
          <button
            onClick={() => router.push(`/goals?date=${dateParam}`)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl border-2 border-dashed border-violet-300 dark:border-violet-700 text-violet-500 dark:text-violet-400 text-sm font-semibold hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:border-violet-400 dark:hover:border-violet-600 transition-all"
          >
            ➕ Dodaj cel na ten dzień
          </button>
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
                  className={`text-center py-2 px-1 rounded-xl mb-1.5 cursor-pointer transition-all ${isToday ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
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
            <div key={d} className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 py-1">{d}</div>
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
                className={`rounded-xl p-1.5 cursor-pointer transition-all border ${isToday ? "border-blue-400 bg-blue-50 dark:bg-blue-950/40" : "border-transparent bg-white dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800"} ${!isCurrentMonth ? "opacity-40" : ""}`}
              >
                <p className={`text-xs font-bold mb-1 text-center ${isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}>{day.getDate()}</p>
                <div className="flex flex-col gap-0.5">
                  {visible.map((t) => {
                    const theme = USER_THEMES[t.assignedTo] ?? DEFAULT_THEME;
                    return (
                      <div key={t.id} className={`${theme.bg[t.priority] ?? theme.bg.normal} border-l-2 ${theme.border[t.priority] ?? theme.border.normal} rounded px-1 py-0.5 text-xs ${theme.text} truncate`}>
                        {theme.icon} {t.title}
                      </div>
                    );
                  })}
                  {extra > 0 && <p className="text-xs text-gray-400 dark:text-gray-500 text-center">+{extra} więcej</p>}
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
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-white dark:border-gray-700 shadow-lg shadow-violet-100/30 dark:shadow-gray-900/30 p-4 flex flex-col gap-3">
        <div className="flex gap-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl p-1 self-start">
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === v ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-sm" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`}>
              {v === "day" ? "Dzień" : v === "week" ? "Tydzień" : "Miesiąc"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-bold">‹</button>
          <p className="flex-1 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 capitalize">{navLabel()}</p>
          <button onClick={() => navigate(1)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-bold">›</button>
          {!isSameDay(currentDate, today) && (
            <button onClick={goToToday} className="text-xs font-semibold text-blue-500 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/60 px-3 py-1.5 rounded-xl transition-all">Dziś</button>
          )}
        </div>
      </div>

      {/* Calendar content */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-white dark:border-gray-700 shadow-lg shadow-violet-100/30 dark:shadow-gray-900/30 p-4">
        {view === "day" && <DayView />}
        {view === "week" && <WeekView />}
        {view === "month" && <MonthView />}
      </div>

      {deleteConfirmId && <DeleteModal onConfirm={confirmDelete} onCancel={() => setDeleteConfirmId(null)} />}

      {doneModal && (
        <DoneModal
          task={doneModal}
          onConfirm={handleMarkDone}
          onCancel={() => setDoneModal(null)}
        />
      )}

      {/* Submitting overlay */}
      {submittingDone && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 flex flex-col items-center gap-3 shadow-2xl border border-white dark:border-gray-700">
            <span className="inline-block w-8 h-8 border-3 border-green-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Zapisuję...</p>
          </div>
        </div>
      )}
    </div>
  );
}
