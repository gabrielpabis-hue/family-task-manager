#!/bin/bash

# Katalogi
mkdir -p "app/(app)/calendar" "app/(app)/goals" "app/(app)/finances" app/login app/api/auth/logout

# app/page.tsx
cat > app/page.tsx << 'EOF'
import { redirect } from "next/navigation";
export default function Home() {
  redirect("/calendar");
}
EOF

# app/login/page.tsx
cat > app/login/page.tsx << 'EOF'
import LoginButton from "@/components/LoginButton";
export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-green-50 to-pink-100">
      <div className="bg-white rounded-3xl shadow-xl p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
        <div className="text-6xl">🏠</div>
        <h1 className="text-2xl font-semibold text-gray-700 text-center">Family Task Manager</h1>
        <p className="text-gray-400 text-sm text-center">Zaloguj się kontem Google aby kontynuować</p>
        <LoginButton />
      </div>
    </main>
  );
}
EOF

echo "✅ Pliki podstawowe utworzone"
echo "✅ Gotowe! Teraz otwórz VS Code i wklej pozostałe komponenty."
