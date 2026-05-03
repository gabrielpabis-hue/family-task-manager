"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { createTask, Priority } from "@/lib/firestore";

const CHILDREN = [
  { email: "igipabis@gmail.com", name: "Igi" },
  { email: "gabik.pabik@gmail.com", name: "Gabi" },
];

const PRIORITY_POINTS: Record<Priority, number> = {
  normal: 1,
  important: 2,
  critical: 3,
};

export default function GoalForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState(CHILDREN[0].email);
  const [priority, setPriority] = useState<Priority>("normal");
  const [dueDate, setDueDate] = useState("");
  const [basePoints, setBasePoints] = useState(1);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function handlePriorityChange(p: Priority) {
    setPriority(p);
    setBasePoints(PRIORITY_POINTS[p]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user?.email) throw new Error("Brak użytkownika");
      await createTask({
        title,
        description,
        assignedTo,
        createdBy: user.email,
        priority,
        dueDate,
        basePoints,
        status: "pending",
        isParentTask: false,
        qualityScore: undefined,
        finalPoints: undefined,
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("normal");
      setBasePoints(1);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Błąd zapisu. Sprawdź połączenie i spróbuj ponownie.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <h2 className="font-semibold text-gray-800 mb-4 text-base">➕ Nowy cel</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          required
          placeholder="Nazwa zadania"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
        />
        <textarea
          placeholder="Opis (opcjonalnie)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none h-20"
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-medium">Wykonawca</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none focus:border-blue-400"
            >
              {CHILDREN.map((c) => (
                <option key={c.email} value={c.email}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-medium">Priorytet</label>
            <select
              value={priority}
              onChange={(e) => handlePriorityChange(e.target.value as Priority)}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none focus:border-blue-400"
            >
              <option value="normal">⚪ Zwykły</option>
              <option value="important">🟡 Ważny</option>
              <option value="critical">🔴 Bardzo ważny</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-medium">Termin</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-medium">
              Punkty bazowe
              <span className="text-gray-400 font-normal ml-1">(podpowiedź: {PRIORITY_POINTS[priority]})</span>
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={basePoints}
              onChange={(e) => setBasePoints(Number(e.target.value))}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none focus:border-blue-400"
            />
          </div>
        </div>
        {error && (
          <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-600 active:bg-blue-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Zapisuję...
            </>
          ) : "Dodaj cel"}
        </button>
        {success && (
          <p className="text-green-600 text-sm text-center bg-green-50 rounded-xl py-2">✅ Cel dodany!</p>
        )}
      </form>
    </div>
  );
}