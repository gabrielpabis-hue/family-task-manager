"use client";

import { useState } from "react";
import Link from "next/link";
import { createRequest } from "@/lib/families";

export default function RequestFamilyPage() {
  const [form, setForm] = useState({ familyName: "", email: "", name: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createRequest({
        type: "newFamily",
        requesterEmail: form.email,
        requesterName: form.name,
        familyName: form.familyName,
        familyId: null,
        message: form.message,
      });
      setSent(true);
    } catch {
      setError("Błąd wysyłania zgłoszenia. Spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-green-50 to-pink-100 px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 flex flex-col items-center gap-5 max-w-sm w-full text-center">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-bold text-gray-700">Zgłoszenie wysłane!</h2>
          <p className="text-gray-400 text-sm">Administrator systemu rozpatrzy Twoje zgłoszenie i skontaktuje się z Tobą.</p>
          <Link href="/login" className="text-blue-500 text-sm font-medium hover:underline">← Wróć do logowania</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-green-50 to-pink-100 px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-5 max-w-sm w-full">
        <div className="text-center">
          <div className="text-4xl mb-3">🏠</div>
          <h1 className="text-xl font-bold text-gray-700">Nowa rodzina</h1>
          <p className="text-gray-400 text-sm mt-1">Zgłoś chęć założenia nowej rodziny w systemie</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-medium">Nazwa rodziny <span className="text-red-400">*</span></label>
            <input
              required
              placeholder="np. Rodzina Kowalskich"
              value={form.familyName}
              onChange={(e) => setForm((p) => ({ ...p, familyName: e.target.value }))}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-medium">Twoje imię <span className="text-red-400">*</span></label>
            <input
              required
              placeholder="Imię i nazwisko"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-medium">E-mail kontaktowy <span className="text-red-400">*</span></label>
            <input
              required
              type="email"
              placeholder="twoj@email.com"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-medium">Wiadomość (opcjonalnie)</label>
            <textarea
              placeholder="Dodatkowe informacje..."
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400 resize-none h-20"
            />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-600 transition-all disabled:opacity-60"
          >
            {saving ? "Wysyłanie..." : "Wyślij zgłoszenie"}
          </button>
        </form>

        <Link href="/login" className="text-center text-gray-400 text-sm hover:text-gray-600">
          ← Wróć do logowania
        </Link>
      </div>
    </main>
  );
}
