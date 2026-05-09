import RewardsView from "@/components/RewardsView";
import Leaderboard from "@/components/Leaderboard";

export default function FinancesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200">🏆 Nagrody</h1>
      <Leaderboard />
      <RewardsView />
    </div>
  );
}
