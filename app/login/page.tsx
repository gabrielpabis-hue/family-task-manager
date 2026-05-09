import Link from "next/link";
import LoginButton from "@/components/LoginButton";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-green-50 to-pink-100">
      <div className="bg-white rounded-3xl shadow-xl p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
        <div className="text-6xl">🏠</div>
        <h1 className="text-2xl font-semibold text-gray-700 text-center">Family Task Manager</h1>
        <p className="text-gray-400 text-sm text-center">Zaloguj się kontem Google aby kontynuować</p>
        <LoginButton />
        <div className="w-full border-t border-gray-100 pt-4 text-center">
          <p className="text-xs text-gray-400 mb-2">Nie masz jeszcze rodziny w systemie?</p>
          <Link
            href="/request-family"
            className="text-sm text-blue-500 font-medium hover:text-blue-600 hover:underline transition-all"
          >
            🏠 Zgłoś nową rodzinę
          </Link>
        </div>
      </div>
    </main>
  );
}
