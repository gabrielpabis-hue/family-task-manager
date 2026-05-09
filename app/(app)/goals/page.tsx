import GoalForm from "@/components/GoalForm";
import PendingTasks from "@/components/PendingTasks";
import OverdueTasks from "@/components/OverdueTasks";

export default function GoalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200">🎯 Centrum Celów</h1>
      <GoalForm />
      <PendingTasks />
      <OverdueTasks />
    </div>
  );
}
