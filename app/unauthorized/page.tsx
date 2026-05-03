export default function Unauthorized() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-xl font-semibold text-gray-700">Brak dostępu</h1>
        <p className="text-gray-400 mt-2">Nie masz uprawnień do tej strony.</p>
      </div>
    </main>
  );
}
