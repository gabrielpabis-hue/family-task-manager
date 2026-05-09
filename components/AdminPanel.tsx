"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/userContext";
import {
  getAllUsers, getAllFamilies, getAllRequests, createUser, updateUser, deleteUser,
  createFamily, updateFamily, deleteFamily, createRequest, resolveRequest,
  UserDoc, FamilyDoc, RequestDoc,
} from "@/lib/families";
import { UserRole } from "@/lib/roles";

type Tab = "users" | "families" | "requests" | "myFamily" | "settings";

const ROLE_LABELS: Record<UserRole, string> = {
  superAdmin: "⭐ Super Admin",
  familyAdmin: "👑 Admin rodziny",
  parent: "👤 Rodzic",
  child: "🧒 Dziecko",
};

const ROLE_OPTIONS: UserRole[] = ["familyAdmin", "parent", "child"];

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-800 text-base">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <p className="text-gray-700 mb-5 text-sm">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Anuluj</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600">Potwierdź</button>
        </div>
      </div>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab({ families }: { families: FamilyDoc[] }) {
  const { userDoc } = useUser();
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<UserDoc | null>(null);
  const [deleting, setDeleting] = useState<UserDoc | null>(null);

  const [form, setForm] = useState({ email: "", displayName: "", role: "child" as UserRole, familyId: "" });

  useEffect(() => { getAllUsers().then(setUsers).finally(() => setLoading(false)); }, []);

  function openAdd() {
    setForm({ email: "", displayName: "", role: "child", familyId: families[0]?.id ?? "" });
    setShowAdd(true);
  }

  function openEdit(u: UserDoc) {
    setForm({ email: u.email, displayName: u.displayName, role: u.role, familyId: u.familyId ?? "" });
    setEditing(u);
  }

  async function handleSave() {
    if (!form.email || !form.displayName) return;
    if (editing) {
      await updateUser(editing.email, {
        displayName: form.displayName,
        role: form.role,
        familyId: form.familyId || null,
      });
      setUsers((prev) => prev.map((u) => u.email === editing.email
        ? { ...u, displayName: form.displayName, role: form.role, familyId: form.familyId || null }
        : u));
      setEditing(null);
    } else {
      await createUser({ email: form.email, displayName: form.displayName, role: form.role, familyId: form.familyId || null });
      setUsers((prev) => [...prev, { email: form.email, displayName: form.displayName, role: form.role, familyId: form.familyId || null, createdAt: new Date() }].sort((a, b) => a.displayName.localeCompare(b.displayName)));
      setShowAdd(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    await deleteUser(deleting.email);
    setUsers((prev) => prev.filter((u) => u.email !== deleting.email));
    setDeleting(null);
  }

  if (loading) return <p className="text-gray-400 text-sm">Ładowanie...</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{users.length} użytkowników</p>
        <button onClick={openAdd} className="bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-600 transition-all">
          + Dodaj użytkownika
        </button>
      </div>

      {users.map((u) => {
        const fam = families.find((f) => f.id === u.familyId);
        const initial = u.displayName?.[0]?.toUpperCase() ?? "?";
        const roleColors: Record<UserRole, string> = { superAdmin: "from-yellow-400 to-orange-400", familyAdmin: "from-violet-400 to-purple-400", parent: "from-blue-400 to-cyan-400", child: "from-pink-400 to-rose-400" };
        return (
          <div key={u.email} className="bg-gray-50/80 rounded-xl p-4 flex items-center justify-between gap-3 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleColors[u.role]} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                {initial}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{u.displayName}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                <div className="flex gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">{ROLE_LABELS[u.role]}</span>
                  {fam && <span className="text-xs text-violet-500">· {fam.name}</span>}
                </div>
              </div>
            </div>
            {u.email !== userDoc?.email && (
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => openEdit(u)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all">✏️</button>
                <button onClick={() => setDeleting(u)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all">🗑️</button>
              </div>
            )}
          </div>
        );
      })}

      {(showAdd || editing) && (
        <Modal title={editing ? "Edytuj użytkownika" : "Nowy użytkownik"} onClose={() => { setShowAdd(false); setEditing(null); }}>
          <div className="flex flex-col gap-3">
            <input disabled={!!editing} placeholder="E-mail" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 disabled:bg-gray-50" />
            <input placeholder="Imię / nazwa" value={form.displayName} onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none focus:border-blue-400" />
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none focus:border-blue-400">
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            <select value={form.familyId} onChange={(e) => setForm((p) => ({ ...p, familyId: e.target.value }))}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none focus:border-blue-400">
              <option value="">— brak rodziny —</option>
              {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <button onClick={handleSave} className="bg-blue-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-600">
              {editing ? "Zapisz zmiany" : "Dodaj użytkownika"}
            </button>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmModal
          message={`Czy na pewno chcesz usunąć użytkownika ${deleting.displayName}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

// ── Families Tab ──────────────────────────────────────────────────────────────

function FamiliesTab({ families, setFamilies }: { families: FamilyDoc[]; setFamilies: (f: FamilyDoc[]) => void }) {
  const { userDoc } = useUser();
  const [allUsers, setAllUsers] = useState<UserDoc[]>([]);
  const [editing, setEditing] = useState<FamilyDoc | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<FamilyDoc | null>(null);
  const [form, setForm] = useState({ name: "", familyAdminEmail: "" });

  useEffect(() => { getAllUsers().then(setAllUsers); }, []);

  function openAdd() {
    setForm({ name: "", familyAdminEmail: "" });
    setShowAdd(true);
  }

  function openEdit(f: FamilyDoc) {
    setForm({ name: f.name, familyAdminEmail: f.familyAdminEmail ?? "" });
    setEditing(f);
  }

  async function handleSave() {
    if (!form.name) return;
    if (editing) {
      await updateFamily(editing.id, { name: form.name, familyAdminEmail: form.familyAdminEmail || null });
      // If admin changed, update their role in users collection
      if (form.familyAdminEmail && form.familyAdminEmail !== editing.familyAdminEmail) {
        const prev = allUsers.find((u) => u.email === editing.familyAdminEmail);
        if (prev) await updateUser(prev.email, { role: "parent" });
        await updateUser(form.familyAdminEmail, { role: "familyAdmin", familyId: editing.id });
      }
      setFamilies(families.map((f) => f.id === editing.id
        ? { ...f, name: form.name, familyAdminEmail: form.familyAdminEmail || null } : f));
      setEditing(null);
    } else {
      if (!userDoc?.email) return;
      const id = await createFamily({ name: form.name, familyAdminEmail: form.familyAdminEmail || null, createdBy: userDoc.email });
      if (form.familyAdminEmail) {
        await updateUser(form.familyAdminEmail, { role: "familyAdmin", familyId: id });
      }
      setFamilies([...families, { id, name: form.name, familyAdminEmail: form.familyAdminEmail || null, createdAt: new Date(), createdBy: userDoc.email }].sort((a, b) => a.name.localeCompare(b.name)));
      setShowAdd(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    await deleteFamily(deleting.id);
    setFamilies(families.filter((f) => f.id !== deleting.id));
    setDeleting(null);
  }

  const eligibleAdmins = allUsers.filter((u) => u.role !== "superAdmin" && u.role !== "familyAdmin");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{families.length} rodzin</p>
        <button onClick={openAdd} className="bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-600 transition-all">
          + Dodaj rodzinę
        </button>
      </div>

      {families.map((f) => {
        const members = allUsers.filter((u) => u.familyId === f.id);
        return (
          <div key={f.id} className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-800">{f.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {f.familyAdminEmail ? `Admin: ${f.familyAdminEmail}` : "Brak admina rodziny"}
                </p>
                <p className="text-xs text-gray-400">{members.length} członków</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {members.map((m) => (
                    <span key={m.email} className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-0.5">
                      {m.displayName} <span className="text-gray-400">({ROLE_LABELS[m.role]})</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => openEdit(f)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all">✏️</button>
                <button onClick={() => setDeleting(f)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all">🗑️</button>
              </div>
            </div>
          </div>
        );
      })}

      {(showAdd || editing) && (
        <Modal title={editing ? "Edytuj rodzinę" : "Nowa rodzina"} onClose={() => { setShowAdd(false); setEditing(null); }}>
          <div className="flex flex-col gap-3">
            <input placeholder="Nazwa rodziny" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none focus:border-blue-400" />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Admin rodziny (opcjonalnie)</label>
              <select value={form.familyAdminEmail} onChange={(e) => setForm((p) => ({ ...p, familyAdminEmail: e.target.value }))}
                className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none focus:border-blue-400">
                <option value="">— brak —</option>
                {eligibleAdmins.filter((u) => !editing || u.familyId === editing.id || !u.familyId).map((u) => (
                  <option key={u.email} value={u.email}>{u.displayName} ({u.email})</option>
                ))}
              </select>
            </div>
            <button onClick={handleSave} className="bg-blue-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-600">
              {editing ? "Zapisz zmiany" : "Utwórz rodzinę"}
            </button>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmModal
          message={`Czy na pewno chcesz usunąć rodzinę "${deleting.name}"? Użytkownicy zostaną bez przypisanej rodziny.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

// ── Requests Tab ──────────────────────────────────────────────────────────────

function RequestsTab({ families, setFamilies }: { families: FamilyDoc[]; setFamilies: (f: FamilyDoc[]) => void }) {
  const { userDoc } = useUser();
  const [requests, setRequests] = useState<RequestDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  useEffect(() => { getAllRequests().then(setRequests).finally(() => setLoading(false)); }, []);

  async function handleApproveNewFamily(req: RequestDoc) {
    if (!userDoc?.email) return;
    const id = await createFamily({ name: req.familyName, familyAdminEmail: null, createdBy: userDoc.email });
    setFamilies([...families, { id, name: req.familyName, familyAdminEmail: null, createdAt: new Date(), createdBy: userDoc.email }]);
    await resolveRequest(req.id, "approved", userDoc.email);
    setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status: "approved" } : r));
  }

  async function handleApproveDeleteFamily(req: RequestDoc) {
    if (!userDoc?.email || !req.familyId) return;
    await deleteFamily(req.familyId);
    setFamilies(families.filter((f) => f.id !== req.familyId));
    await resolveRequest(req.id, "approved", userDoc.email);
    setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status: "approved" } : r));
  }

  async function handleReject(req: RequestDoc) {
    if (!userDoc?.email) return;
    await resolveRequest(req.id, "rejected", userDoc.email);
    setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status: "rejected" } : r));
  }

  const visible = filter === "pending" ? requests.filter((r) => r.status === "pending") : requests;
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  if (loading) return <p className="text-gray-400 text-sm">Ładowanie...</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {(["pending", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${filter === f ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
            {f === "pending" ? `Oczekujące (${pendingCount})` : "Wszystkie"}
          </button>
        ))}
      </div>

      {visible.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">Brak zgłoszeń</p>}

      {visible.map((req) => (
        <div key={req.id} className={`rounded-xl p-4 border ${req.status === "pending" ? "bg-yellow-50 border-yellow-200" : req.status === "approved" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-600">
                  {req.type === "newFamily" ? "🏠 Nowa rodzina" : "🗑️ Likwidacja rodziny"}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${req.status === "pending" ? "bg-yellow-200 text-yellow-800" : req.status === "approved" ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                  {req.status === "pending" ? "Oczekuje" : req.status === "approved" ? "Zatwierdzone" : "Odrzucone"}
                </span>
              </div>
              <p className="font-semibold text-gray-800 text-sm">
                {req.type === "newFamily" ? req.familyName : families.find((f) => f.id === req.familyId)?.name ?? "Nieznana rodzina"}
              </p>
              <p className="text-xs text-gray-500">{req.requesterName} · {req.requesterEmail}</p>
              {req.message && <p className="text-xs text-gray-400 mt-1 italic">"{req.message}"</p>}
              <p className="text-xs text-gray-300 mt-1">{req.createdAt.toLocaleDateString("pl-PL")}</p>
            </div>
            {req.status === "pending" && (
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => req.type === "newFamily" ? handleApproveNewFamily(req) : handleApproveDeleteFamily(req)}
                  className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-xl hover:bg-green-600 transition-all font-medium"
                >
                  Zatwierdź
                </button>
                <button onClick={() => handleReject(req)} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all font-medium">
                  Odrzuć
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── My Family Tab (familyAdmin) ───────────────────────────────────────────────

function MyFamilyTab({ family }: { family: FamilyDoc | null }) {
  const { userDoc, familyMembers } = useUser();
  const [members, setMembers] = useState<UserDoc[]>(familyMembers);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<UserDoc | null>(null);
  const [form, setForm] = useState({ email: "", displayName: "", role: "child" as UserRole });

  function openAdd() {
    setForm({ email: "", displayName: "", role: "child" });
    setShowAdd(true);
  }

  async function handleSave() {
    if (!form.email || !form.displayName || !userDoc?.familyId) return;
    if (editing) {
      await updateUser(editing.email, { displayName: form.displayName, role: form.role });
      setMembers((prev) => prev.map((m) => m.email === editing.email ? { ...m, displayName: form.displayName, role: form.role } : m));
      setEditing(null);
    } else {
      await createUser({ email: form.email, displayName: form.displayName, role: form.role, familyId: userDoc.familyId });
      setMembers((prev) => [...prev, { email: form.email, displayName: form.displayName, role: form.role, familyId: userDoc.familyId!, createdAt: new Date() }]);
      setShowAdd(false);
    }
  }

  const memberRoleOptions: UserRole[] = ["parent", "child"];

  return (
    <div className="flex flex-col gap-3">
      {family && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <p className="font-semibold text-blue-800">{family.name}</p>
          <p className="text-xs text-blue-500">{members.length} członków</p>
        </div>
      )}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Członkowie rodziny</p>
        <button onClick={openAdd} className="bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-600 transition-all">
          + Dodaj członka
        </button>
      </div>

      {members.map((m) => (
        <div key={m.email} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-800 text-sm">{m.displayName}</p>
            <p className="text-xs text-gray-400">{m.email}</p>
            <p className="text-xs text-gray-500 mt-0.5">{ROLE_LABELS[m.role]}</p>
          </div>
          {m.email !== userDoc?.email && (
            <button onClick={() => { setForm({ email: m.email, displayName: m.displayName, role: m.role }); setEditing(m); }}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all">✏️</button>
          )}
        </div>
      ))}

      {(showAdd || editing) && (
        <Modal title={editing ? "Edytuj członka" : "Dodaj członka rodziny"} onClose={() => { setShowAdd(false); setEditing(null); }}>
          <div className="flex flex-col gap-3">
            <input disabled={!!editing} placeholder="E-mail" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 disabled:bg-gray-50" />
            <input placeholder="Imię / nazwa" value={form.displayName} onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none focus:border-blue-400" />
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none focus:border-blue-400">
              {memberRoleOptions.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            <button onClick={handleSave} className="bg-blue-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-600">
              {editing ? "Zapisz zmiany" : "Dodaj członka"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Settings Tab (familyAdmin) ────────────────────────────────────────────────

function SettingsTab({ family }: { family: FamilyDoc | null }) {
  const { userDoc } = useUser();
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function handleRequest() {
    if (!userDoc || !family) return;
    await createRequest({
      type: "deleteFamily",
      requesterEmail: userDoc.email,
      requesterName: userDoc.displayName,
      familyName: family.name,
      familyId: family.id,
      message,
    });
    setSent(true);
    setShowConfirm(false);
  }

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <p className="text-2xl mb-2">✅</p>
        <p className="font-semibold text-green-800">Zgłoszenie wysłane</p>
        <p className="text-sm text-green-600 mt-1">Super administrator rozpatrzy Twój wniosek.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {family && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="font-semibold text-gray-800">{family.name}</p>
          <p className="text-xs text-gray-400">ID: {family.id}</p>
        </div>
      )}
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <p className="font-semibold text-red-800 mb-1">⚠️ Likwidacja rodziny</p>
        <p className="text-sm text-red-600 mb-4">Zgłoszenie trafi do super administratora, który zdecyduje o likwidacji.</p>
        <button onClick={() => setShowConfirm(true)} className="bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-600 transition-all">
          Zgłoś wniosek o likwidację
        </button>
      </div>

      {showConfirm && (
        <Modal title="Zgłoszenie likwidacji rodziny" onClose={() => setShowConfirm(false)}>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">Czy na pewno chcesz zgłosić wniosek o likwidację rodziny <strong>{family?.name}</strong>?</p>
            <textarea
              placeholder="Wiadomość do administratora (opcjonalnie)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none focus:border-red-400 resize-none h-24"
            />
            <button onClick={handleRequest} className="bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600">
              Wyślij zgłoszenie
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Main AdminPanel ───────────────────────────────────────────────────────────

export default function AdminPanel() {
  const router = useRouter();
  const { isAdmin, isSuperAdmin, userDoc, loading } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>(isSuperAdmin ? "users" : "myFamily");
  const [families, setFamilies] = useState<FamilyDoc[]>([]);
  const [familiesLoaded, setFamiliesLoaded] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!familiesLoaded && isAdmin) {
      getAllFamilies().then((f) => { setFamilies(f); setFamiliesLoaded(true); });
    }
  }, [isAdmin, familiesLoaded]);

  useEffect(() => {
    if (isSuperAdmin) {
      import("@/lib/families").then(({ getPendingRequestCount }) =>
        getPendingRequestCount().then(setPendingCount)
      );
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!loading && !isAdmin) router.push("/calendar");
  }, [loading, isAdmin, router]);

  if (loading) return <p className="text-gray-400 text-sm">Ładowanie...</p>;
  if (!isAdmin) return null;

  const currentFamily = families.find((f) => f.id === userDoc?.familyId) ?? null;

  const superAdminTabs: { key: Tab; label: string }[] = [
    { key: "users", label: "👥 Użytkownicy" },
    { key: "families", label: "🏠 Rodziny" },
    { key: "requests", label: `📬 Zgłoszenia${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
  ];

  const familyAdminTabs: { key: Tab; label: string }[] = [
    { key: "myFamily", label: "👥 Moja rodzina" },
    { key: "settings", label: "⚙️ Ustawienia" },
  ];

  const tabs = isSuperAdmin ? superAdminTabs : familyAdminTabs;

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white shadow-lg shadow-violet-100/30 p-1.5 flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all relative ${
              activeTab === t.key ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md shadow-violet-200/50" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {t.label}
            {t.key === "requests" && pendingCount > 0 && activeTab !== "requests" && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white shadow-lg shadow-violet-100/30 p-5">
        {activeTab === "users" && <UsersTab families={families} />}
        {activeTab === "families" && <FamiliesTab families={families} setFamilies={setFamilies} />}
        {activeTab === "requests" && <RequestsTab families={families} setFamilies={setFamilies} />}
        {activeTab === "myFamily" && <MyFamilyTab family={currentFamily} />}
        {activeTab === "settings" && <SettingsTab family={currentFamily} />}
      </div>
    </div>
  );
}
