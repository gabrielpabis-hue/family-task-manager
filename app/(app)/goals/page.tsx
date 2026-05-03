import GoalForm from "@/components/GoalForm";
import PendingTasks from "@/components/PendingTasks";

export default function GoalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-700">🎯 Centrum Celów</h1>
      <GoalForm />
      <PendingTasks />
    </div>
  );
}
