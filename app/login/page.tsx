import Link from "next/link";
import LoginButton from "@/components/LoginButton";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">

      {/* Floating background shapes */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="animate-float absolute top-16 left-12 w-72 h-72 bg-violet-300/25 rounded-full blur-3xl" />
        <div className="animate-float-slow absolute bottom-24 right-8 w-64 h-64 bg-pink-300/25 rounded-full blur-3xl" />
        <div className="animate-float absolute top-1/2 right-1/4 w-48 h-48 bg-blue-300/20 rounded-full blur-2xl" />
        <div className="animate-float-slow absolute bottom-40 left-1/4 w-32 h-32 bg-fuchsia-300/20 rounded-full blur-2xl" />

        {/* Decorative emoji floating */}
        <span className="animate-float absolute top-24 right-20 text-4xl opacity-20 select-none">🌟</span>
        <span className="animate-float-slow absolute bottom-32 left-16 text-3xl opacity-20 select-none">🎯</span>
        <span className="animate-float absolute top-1/3 left-8 text-2xl opacity-15 select-none">✨</span>
        <span className="animate-float-slow absolute top-20 left-1/3 text-3xl opacity-15 select-none">🏆</span>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-violet-200/50 border border-white/80 p-8 flex flex-col items-center gap-6">

          {/* Header */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 via-blue-500 to-pink-500 flex items-center justify-center text-4xl shadow-lg shadow-violet-300/50">
              🏠
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">
                FamilyTask
              </h1>
              <p className="text-gray-400 text-sm mt-1">Organizuj życie rodziny razem</p>
            </div>
          </div>

          {/* Features */}
          <div className="w-full grid grid-cols-3 gap-2 text-center">
            {[
              { icon: "📅", label: "Kalendarz" },
              { icon: "🎯", label: "Cele" },
              { icon: "🏆", label: "Nagrody" },
            ].map((f) => (
              <div key={f.label} className="bg-gradient-to-b from-violet-50 to-blue-50 rounded-2xl p-3 border border-violet-100/50">
                <div className="text-2xl mb-1">{f.icon}</div>
                <p className="text-xs text-gray-500 font-medium">{f.label}</p>
              </div>
            ))}
          </div>

          <LoginButton />

          {/* Divider + request family */}
          <div className="w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-300 font-medium">lub</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <p className="text-center text-xs text-gray-400 mb-2">Nie masz jeszcze rodziny w systemie?</p>
            <Link
              href="/request-family"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl border-2 border-dashed border-violet-200 text-violet-500 text-sm font-semibold hover:bg-violet-50 hover:border-violet-300 transition-all"
            >
              🏠 Zgłoś nową rodzinę
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 mt-4">
          Family Task Manager © {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
