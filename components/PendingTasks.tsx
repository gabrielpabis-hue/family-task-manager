"use client";

import { useEffect, useState } from "react";
import { getAllTasks, approveTask, Task } from "@/lib/firestore";
import { useUser } from "@/lib/userContext";
import { QualityScore } from "@/lib/points";

const QUALITY_OPTIONS: { value: QualityScore; label: string }[] = [
  { value: "weak", label: "😐 Słabo" },
  { value: "good", label: "👍 Dobrze" },
  { value: "excellent", label: "⭐ Wybitnie" },
];

export default function PendingTasks() {
  const { familyId, userDoc, loading: userLoading } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading || !userDoc) return;
    getAllTasks(familyId ?? undefined).then((all) => {
      setTasks(all.filter((t) => t.status === "done"));
      setLoading(false);
    });
  }, [userLoading, userDoc, familyId]);

  async function handleApprove(taskId: string, score: QualityScore) {
    if (!userDoc?.email) return;
    await approveTask(taskId, score, userDoc.email);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  if (loading) return null;
  if (tasks.length === 0)
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white shadow-lg shadow-violet-100/30 p-5">
        <h2 className="font-semibold text-gray-700 mb-2">⏳ Oczekuje na ocenę</h2>
        <p className="text-gray-400 text-sm">Brak zadań do oceny.</p>
      </div>
    );

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white shadow-lg shadow-violet-100/30 shadow-sm p-5">
      <h2 className="font-semibold text-gray-700 mb-4">⏳ Oczekuje na ocenę</h2>
      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <div key={task.id} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
            <div>
              <p className="font-medium text-gray-700">{task.title}</p>
              <p className="text-xs text-gray-400">{task.assignedTo.split("@")[0]} · {task.basePoints} pkt bazowo</p>
            </div>
            <div className="flex gap-2">
              {QUALITY_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => handleApprove(task.id, opt.value)}
                  className="flex-1 text-xs py-2 rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all">
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
