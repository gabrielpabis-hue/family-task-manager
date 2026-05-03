import TaskList from "@/components/TaskList";

export default function CalendarPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-700 mb-4">📅 Moje zadania</h1>
      <TaskList />
    </div>
  );
}
