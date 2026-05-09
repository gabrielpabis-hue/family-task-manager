"use client";

import { useState } from "react";

// ── Data ──────────────────────────────────────────────────────────────────────

const CHANGELOG: { date: string; type: "feat" | "fix" | "chore"; label: string }[] = [
  { date: "2026-05-09", type: "chore", label: "Rebrand: FamilyTask → FamilyTiTask, aktualizacja podtytułu" },
  { date: "2026-05-09", type: "fix",   label: "GoalForm: lista dzieci dla superAdmin bez przypisanej rodziny" },
  { date: "2026-05-09", type: "feat",  label: "Przycisk 'Zrobiłem!', zdjęcie jako dowód, badge tytułu zakładki, tabela wyników" },
  { date: "2026-05-09", type: "feat",  label: "Przycisk 'Dodaj cel' w widoku dziennym kalendarza z wstępnie wypełnioną datą" },
  { date: "2026-05-09", type: "feat",  label: "Panel przeterminowanych celów – przywróć na dziś/jutro, wyczyść, kolumny per dziecko" },
  { date: "2026-05-09", type: "feat",  label: "Dark mode – przełącznik Jasny / Ciemny / Systemowy z detekcją preferencji OS" },
  { date: "2026-05-09", type: "feat",  label: "Redesign UI – glassmorphism, gradient violet-blue, animacje floating, scrollbar" },
  { date: "2026-05-09", type: "feat",  label: "System wielorodzinny – panel admina, role (superAdmin/familyAdmin/parent/child), izolacja danych" },
  { date: "2026-05-04", type: "feat",  label: "Strona Nagrody – salda, wykresy tygodniowe/miesięczne/roczne, rozliczenia" },
  { date: "2026-05-04", type: "feat",  label: "Tryb edycji celu – pre-fill formularza, baner edycji, przekierowanie z kalendarza" },
  { date: "2026-05-04", type: "feat",  label: "Widoki kalendarza (dzień/tydzień/miesiąc), motywy dzieci (🔥 Igi / ✨ Gabi), cele cykliczne, szablony" },
  { date: "2026-05-04", type: "fix",   label: "Poprawki typowania Firestore (undefined → null)" },
  { date: "2026-05-04", type: "fix",   label: "GoalForm – kontrast tekstu, priorytety punktowe, obsługa błędów" },
  { date: "2026-05-04", type: "feat",  label: "Pełna aplikacja – nawigacja, zadania, cele, system punktów" },
  { date: "2026-05-03", type: "feat",  label: "Strony: Kalendarz, Cele, Finanse" },
  { date: "2026-05-03", type: "fix",   label: "Sesja, middleware, routing – poprawki konfiguracji" },
  { date: "2026-05-03", type: "feat",  label: "Logowanie Google, role, middleware, Firebase Auth" },
  { date: "2026-05-03", type: "feat",  label: "Inicjalizacja projektu Next.js – punkt startowy" },
];

const TYPE_STYLE: Record<string, string> = {
  feat:  "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300",
  fix:   "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
  chore: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
};

const TYPE_LABEL: Record<string, string> = {
  feat: "nowa funkcja",
  fix: "poprawka",
  chore: "zmiana",
};

const TECHNOLOGIES = [
  { name: "Next.js 16.2.4", desc: "Framework React – App Router, SSR, API Routes", icon: "▲" },
  { name: "React 19", desc: "UI – hooks, konteksty, Server/Client Components", icon: "⚛️" },
  { name: "TypeScript 5", desc: "Statyczne typowanie całej aplikacji", icon: "🔷" },
  { name: "Tailwind CSS v4", desc: "Utility-first CSS – dark mode, glassmorphism, gradienty", icon: "🎨" },
  { name: "Firebase Firestore", desc: "Baza danych NoSQL – zadania, rodziny, punkty, requesty", icon: "🔥" },
  { name: "Firebase Auth", desc: "Logowanie przez Google OAuth", icon: "🔐" },
  { name: "Firebase Storage", desc: "Przechowywanie zdjęć – dowody wykonania zadań", icon: "📦" },
  { name: "Netlify", desc: "Hosting, CI/CD z automatycznym deploymentem z gita", icon: "🚀" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function DocsModal() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"about" | "tech" | "changelog">("about");

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Dokumentacja aplikacji"
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-700 transition-all text-base"
      >
        📖
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl border border-white dark:border-gray-700 shadow-2xl flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="bg-gradient-to-r from-violet-500 to-blue-500 px-5 py-4 flex items-center justify-between sm:rounded-t-2xl rounded-t-2xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg">📖</div>
                <div>
                  <p className="font-bold text-white text-base">Dokumentacja</p>
                  <p className="text-white/70 text-xs">FamilyTiTask – v{new Date().getFullYear()}.05</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white text-lg transition-all"
              >×</button>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 p-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700 shrink-0">
              {([
                { key: "about", label: "📋 O aplikacji" },
                { key: "tech",  label: "⚙️ Technologie" },
                { key: "changelog", label: "📜 Changelog" },
              ] as { key: typeof tab; label: string }[]).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                    tab === t.key
                      ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-5">

              {/* ── About ── */}
              {tab === "about" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-3xl shadow-md">🏠</div>
                    <div>
                      <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg">FamilyTiTask</h2>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Aplikacja webowa do zarządzania rodziną</p>
                    </div>
                  </div>

                  <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800 rounded-xl p-4">
                    <p className="text-sm font-semibold text-violet-800 dark:text-violet-200 mb-2">🎯 Cel biznesowy</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      FamilyTiTask wspiera rodziny w organizowaniu codziennych obowiązków i zadań. Rodzice wystawiają cele dla dzieci, śledzą ich realizację oraz nagradzają punktami za jakość wykonania. System motywuje dzieci do sumiennego wywiązywania się z obowiązków poprzez gamifikację – punkty, tabele wyników i historię osiągnięć.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Główne funkcje</p>
                    {[
                      { icon: "📅", title: "Kalendarz", desc: "Widok dzienny, tygodniowy i miesięczny z zadaniami per dziecko" },
                      { icon: "🎯", title: "Cele", desc: "Tworzenie, edycja, szablony, cele cykliczne, priorytety i punkty bazowe" },
                      { icon: "✅", title: "Realizacja", desc: "Dzieci oznaczają zadania jako wykonane, opcjonalnie z dowodem zdjęciowym" },
                      { icon: "⭐", title: "Ocenianie", desc: "Rodzic ocenia jakość (słabo / dobrze / wybitnie), co przekłada się na punkty" },
                      { icon: "🏆", title: "Nagrody", desc: "Salda punktów, historia zarobków, wykresy aktywności, tabela wyników" },
                      { icon: "👨‍👩‍👧", title: "Multirodziny", desc: "Izolacja danych per rodzina, role: superAdmin / familyAdmin / rodzic / dziecko" },
                    ].map((f) => (
                      <div key={f.title} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3">
                        <span className="text-xl shrink-0">{f.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{f.title}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tech ── */}
              {tab === "tech" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Stack technologiczny</p>
                  {TECHNOLOGIES.map((t) => (
                    <div key={t.name} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-lg shrink-0 shadow-sm">
                        {t.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{t.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{t.desc}</p>
                      </div>
                    </div>
                  ))}
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 rounded-xl p-3 mt-1">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      🔗 Repozytorium: github.com/gabrielpabis-hue/family-task-manager
                    </p>
                  </div>
                </div>
              )}

              {/* ── Changelog ── */}
              {tab === "changelog" && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Historia zmian</p>
                  {CHANGELOG.map((item, i) => {
                    const showDate = i === 0 || CHANGELOG[i - 1].date !== item.date;
                    return (
                      <div key={i}>
                        {showDate && (
                          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-3 mb-1.5 first:mt-0">
                            📅 {item.date}
                          </p>
                        )}
                        <div className="flex items-start gap-2 py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 mt-0.5 ${TYPE_STYLE[item.type]}`}>
                            {TYPE_LABEL[item.type]}
                          </span>
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{item.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 shrink-0">
              <p className="text-xs text-center text-gray-300 dark:text-gray-600">
                FamilyTiTask © {new Date().getFullYear()} · Stworzone z ❤️ i Claude AI
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
