import NavBar from "@/components/NavBar";
import TabBadge from "@/components/TabBadge";
import { UserProvider } from "@/lib/userContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <TabBadge />
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
