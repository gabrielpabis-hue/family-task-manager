"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createTask, getAllTasks, getTask, updateTask, Priority, Task } from "@/lib/firestore";
import { useUser } from "@/lib/userContext";

const PRIORITY_POINTS: Record<Priority, number> = {
  normal: 5,
  important: 10,
  critical: 20,
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function GoalFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { userDoc, familyMembers, familyId } = useUser();
  const children = familyMembers.filter((m) => m.role === "child");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [dueDate, setDueDate] = useState(todayStr());
  const [endDate, setEndDate] = useState("");
  const [basePoints, setBasePoints] = useState(PRIORITY_POINTS.normal);
  const [recurring, setRecurring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [editTitle, setEditTitle] = useState("");

  const [templates, setTemplates] = useState<Task[]>([]);
  const [templateId, setTemplateId] = useState("");

  useEffect(() => {
    if (children.length > 0 && !assignedTo) setAssignedTo(children[0].email);
  }, [children]);

  useEffect(() => {
    getAllTasks(familyId ?? undefined).then(setTemplates).catch(() => {});
  }, [familyId]);

  useEffect(() => {
    if (!editId) {
      resetForm();
      setEditTitle("");
      return;
    }
    setLoadingEdit(true);
    getTask(editId).then((t) => {
      if (!t) return;
      setTitle(t.title);
      setDescription(t.description ?? "");
      setAssignedTo(t.assignedTo);
      setPriority(t.priority);
      setDueDate(t.dueDate);
      setEndDate(t.endDate ?? "");
      setBasePoints(t.basePoints);
      setRecurring(t.recurring ?? false);
      setEditTitle(t.title);
      setTemplateId("");
    }).catch(() => {}).finally(() => setLoadingEdit(false));
  }, [editId]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setDueDate(todayStr());
    setEndDate("");
    setPriority("normal");
    setBasePoints(PRIORITY_POINTS.normal);
    setRecurring(false);
    setTemplateId("");
  }

  function handlePriorityChange(p: Priority) {
    setPriority(p);
    setBasePoints(PRIORITY_POINTS[p]);
  }

  function applyTemplate(taskId: string) {
    setTemplateId(taskId);
    if (!taskId) return;
    const t = templates.find((t) => t.id === taskId);
    if (!t) return;
    setTitle(t.title);
    setDescription(t.description ?? "");
    setAssignedTo(t.assignedTo);
    setPriority(t.priority);
    setBasePoints(t.basePoints);
    setRecurring(t.recurring ?? false);
    setDueDate(todayStr());
    setEndDate("");
  }

  function cancelEdit() {
    router.push("/goals");
    resetForm();
    setEditTitle("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (!userDoc?.email) throw new Error("Brak użytkownika");

      if (editId) {
        await updateTask(editId, {
          title,
          description,
          assignedTo,
          priority,
          dueDate,
          endDate: endDate || undefined,
          basePoints,
          recurring,
        });
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          router.push("/goals");
        }, 2000);
      } else {
        await createTask({
          title,
          description,
          assignedTo,
          createdBy: userDoc.email,
          priority,
          dueDate,
          endDate: endDate || undefined,
          basePoints,
          status: "pending",
          isParentTask: false,
          recurring,
          familyId: familyId ?? null,
          qualityScore: null,
          finalPoints: null,
        });
        resetForm();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError("Błąd zapisu. Sprawdź połączenie i spróbuj ponownie.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white shadow-lg shadow-violet-100/40 overflow-hidden flex flex-col gap-0">

      {/* Gradient header */}
      <div className="bg-gradient-to-r from-violet-500 to-blue-500 px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg">
          {editId ? "✏️" : "🎯"}
        </div>
        <div>
          <p className="font-bold text-white text-base">{editId ? "Edytuj cel" : "Nowy cel"}</p>
          <p className="text-white/70 text-xs">{editId ? "Zmodyfikuj istniejący cel" : "Dodaj cel dla członka rodziny"}</p>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">

      {/* Edit mode banner */}
      {editId && (
        <div className="flex items-start justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-blue-500 text-lg shrink-0">✏️</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Tryb edycji</p>
              {loadingEdit ? (
                <p className="text-sm text-blue-400">Ładowanie...</p>
              ) : (
                <p className="text-sm font-semibold text-blue-800 truncate">{editTitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={cancelEdit}
            className="shrink-0 text-xs text-blue-400 hover:text-blue-600 bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 font-medium transition-all"
          >
            Anuluj
          </button>
        </div>
      )}

      {/* Template picker — only in create mode */}
      {!editId && templates.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-600 font-medium">🔄 Użyj poprzedniego celu jako szablon</label>
          <select
            value={templateId}
            onChange={(e) => applyTemplate(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-gray-50"
          >
            <option value="">— wybierz cel do skopiowania —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
                {t.recurring ? " 🔁" : ""}
                {" · "}
                {t.assignedTo === "igipabis@gmail.com" ? "Igi" : "Gabi"}
              </option>
            ))}
          </select>
          {templateId && (
            <p className="text-xs text-blue-500">Formularz uzupełniony — sprawdź datę i kliknij Dodaj cel.</p>
          )}
        </div>
      )}

      <div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            required
            placeholder="Nazwa zadania"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-gray-50/50 transition-all"
          />
          <textarea
            placeholder="Opis (opcjonalnie)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none h-20 bg-gray-50/50 transition-all"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Wykonawca</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-gray-50/50 transition-all"
              >
                {children.map((c) => (
                  <option key={c.email} value={c.email}>{c.displayName}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Priorytet</label>
              <select
                value={priority}
                onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-gray-50/50 transition-all"
              >
                <option value="normal">⚪ Zwykły</option>
                <option value="important">🟡 Ważny</option>
                <option value="critical">🔴 Bardzo ważny</option>
              </select>
            </div>
          </div>

          {/* Two date fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">
                Data założenia <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-gray-50/50 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">
                Maks. data realizacji <span className="text-gray-400 font-normal">(opcjonalna)</span>
              </label>
              <input
                type="date"
                value={endDate}
                min={dueDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-gray-50/50 transition-all"
              />
            </div>
          </div>
          {endDate && dueDate && (
            <p className="text-xs text-blue-500 -mt-1">
              📅 Cel aktywny przez {Math.round((new Date(endDate).getTime() - new Date(dueDate).getTime()) / 86400000) + 1} dni w kalendarzu
            </p>
          )}

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
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-gray-50/50 transition-all"
            />
          </div>

          {/* Recurring checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none px-1">
            <div className="relative">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                recurring ? "bg-blue-500 border-blue-500" : "border-gray-300 bg-white"
              }`}>
                {recurring && <span className="text-white text-xs font-bold">✓</span>}
              </div>
            </div>
            <span className="text-sm text-gray-700">🔁 Cel cykliczny</span>
          </label>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={saving || loadingEdit}
            className="bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl py-3 text-sm font-bold hover:from-violet-600 hover:to-blue-600 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-violet-200/60"
          >
            {saving ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Zapisuję...
              </>
            ) : editId ? "Zapisz zmiany" : "Dodaj cel"}
          </button>
          {success && (
            <p className="text-green-600 text-sm text-center bg-green-50 rounded-xl py-2">
              {editId ? "✅ Cel zaktualizowany!" : "✅ Cel dodany!"}
            </p>
          )}
        </form>
      </div>

      </div>{/* end p-5 wrapper */}
    </div>
  );
}

export default function GoalForm() {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-gray-400 text-sm">
        Ładowanie...
      </div>
    }>
      <GoalFormContent />
    </Suspense>
  );
}
