"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { createTask, Priority } from "@/lib/firestore";

const CHILDREN = [
  { email: "igipabis@gmail.com", name: "Igi" },
  { email: "gabik.pabik@gmail.com", name: "Gabi" },
];

export default function GoalForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState(CHILDREN[0].email);
  const [priority, setPriority] = useState<Priority>("normal");
  const [dueDate, setDueDate] = useState("");
  const [basePoints, setBasePoints] = useState(10);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const user = auth.currentUser;
    if (!user?.email) return;
    await createTask({
      title, description, assignedTo, createdBy: user.email,
      priority, dueDate, basePoints, status: "pending",
      isParentTask: false, qualityScore: undefined, finalPoints: undefined,
    });
    setTitle(""); setDescription(""); setDueDate(""); setBasePoints(10);
    setSaving(false); setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-semibold text-gray-700 mb-4">➕ Nowy cel</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input required placeholder="Nazwa zadania" value={title} onChange={(e) => setTitle(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-300" />
        <textarea placeholder="Opis (opcjonalnie)" value={description} onChange={(e) => setDescription(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-300 resize-none h-20" />
        <div className="grid grid-cols-2 gap-3">
          <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-300">
            {CHILDREN.map((c) => <option key={c.email} value={c.email}>{c.name}</option>)}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-300">
            <option value="normal">⚪ Zwykły</option>
            <option value="important">🟡 Ważny</option>
            <option value="critical">🔴 Bardzo ważny</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-300" />
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2">
            <span className="text-sm text-gray-400">Pkt:</span>
            <input type="number" min={1} max={100} value={basePoints} onChange={(e) => setBasePoints(Number(e.target.value))}
              className="w-full text-sm outline-none" />
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="bg-blue-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-600 transition-all disabled:opacity-50">
          {saving ? "Zapisuję..." : "Dodaj cel"}
        </button>
        {success && <p className="text-green-500 text-sm text-center">✅ Cel dodany!</p>}
      </form>
    </div>
  );
}
