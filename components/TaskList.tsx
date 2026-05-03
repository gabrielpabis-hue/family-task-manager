"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { getAllTasks, getTasksForUser, markTaskDone, Task } from "@/lib/firestore";
import { getUserRole } from "@/lib/roles";

const PRIORITY_LABELS: Record<string, string> = {
  normal: "⚪ Zwykły",
  important: "🟡 Ważny",
  critical: "🔴 Bardzo ważny",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Do zrobienia",
  done: "Oczekuje oceny",
  approved: "Zatwierdzone ✅",
};

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user?.email) return;
      setUserEmail(user.email);
      const r = getUserRole(user.email);
      setRole(r);
      const data = r === "admin" ? await getAllTasks() : await getTasksForUser(user.email);
      setTasks(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleMarkDone(taskId: string) {
    await markTaskDone(taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "done" } : t)));
  }

  if (loading) return <p className="text-gray-400 text-sm">Ładowanie...</p>;
  if (tasks.length === 0) return <p className="text-gray-400 text-sm">Brak zadań.</p>;

  const grouped = tasks.reduce((acc, task) => {
    const date = task.dueDate || "Bez terminu";
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{date}</p>
          <div className="flex flex-col gap-2">
            {items.map((task) => (
              <div key={task.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">{PRIORITY_LABELS[task.priority]}</span>
                    {role === "admin" && (
                      <span className="text-xs text-blue-400">→ {task.assignedTo.split("@")[0]}</span>
                    )}
                  </div>
                  <p className="font-medium text-gray-700">{task.title}</p>
                  {task.description && <p className="text-sm text-gray-400 mt-1">{task.description}</p>}
                  <p className="text-xs text-gray-300 mt-2">
                    {STATUS_LABELS[task.status]}
                    {task.finalPoints ? ` · ${task.finalPoints} pkt` : ""}
                  </p>
                </div>
                {task.status === "pending" && (role === "child" || task.assignedTo === userEmail) && (
                  <button
                    onClick={() => handleMarkDone(task.id)}
                    className="bg-green-50 text-green-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-green-100 transition-all whitespace-nowrap"
                  >
                    Zrobione ✓
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
