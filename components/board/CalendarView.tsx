import { useState } from "react";
import { Task } from "@/app/types"; // Adjust path if needed
import { Card } from "@/components/ui/card";
import { getRelativeTime } from "@/lib/utils";

// 👇 Added Lucide React Icons 👇
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

export function CalendarView({ tasks }: { tasks: Task[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Helper to check if a task falls on a specific calendar day
  const getTasksForDate = (day: number, month: number, year: number) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return (
        taskDate.getDate() === day &&
        taskDate.getMonth() === month &&
        taskDate.getFullYear() === year &&
        !task.is_trashed
      );
    });
  };

  // Generate the blank spaces before the 1st of the month
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`blank-${i}`} className="p-2 border border-transparent"></div>);

  // Generate the actual days
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const tasksToday = getTasksForDate(day, month, year);
    
    // Check if this day is the currently selected day
    const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
    // Check if this day is literally "today" in real life
    const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

    return (
      <div 
        key={`day-${day}`} 
        onClick={() => setSelectedDate(new Date(year, month, day))}
        className={`min-h-[80px] p-2 border border-zinc-200 dark:border-zinc-800 rounded-md cursor-pointer transition-colors relative flex flex-col gap-1
          ${isSelected ? "bg-purple-50 border-purple-400 dark:bg-purple-900/20 dark:border-purple-500" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}
        `}
      >
        <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-purple-600 text-white" : "text-zinc-700 dark:text-zinc-300"}`}>
          {day}
        </span>
        
        {/* Render indicators for tasks */}
        <div className="flex flex-wrap gap-1 mt-auto">
          {tasksToday.map(task => (
            <div 
              key={task.id} 
              title={task.title}
              className={`w-2 h-2 rounded-full ${
                task.priority === 'high' ? 'bg-red-500' : 
                task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`} 
            />
          ))}
        </div>
      </div>
    );
  });

  // Get tasks for the currently selected date to show in the side panel
  const selectedDayTasks = selectedDate ? getTasksForDate(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear()) : [];

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto">
      {/* Calendar Grid */}
      <Card className="flex-1 p-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            {monthNames[month]} {year}
          </h2>
          <div className="flex gap-2">
            {/* 👇 Replaced Text Arrows with Icons 👇 */}
            <button onClick={handlePrevMonth} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button onClick={handleNextMonth} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {blanks}
          {days}
        </div>
      </Card>

      {/* Selected Day Agenda */}
      <Card className="w-full lg:w-96 p-6 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold mb-4 text-zinc-800 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : "Select a day"}
        </h3>
        
        <div className="flex flex-col gap-3">
          {selectedDayTasks.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">No tasks due on this day.</p>
          ) : (
            selectedDayTasks.map(task => (
              <div key={task.id} className="p-3 bg-white dark:bg-zinc-800 border-l-4 border-purple-500 rounded-md shadow-sm">
                <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{task.title}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    task.priority === 'high' ? "bg-red-100 text-red-700 border-red-200" :
                    task.priority === 'medium' ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                    "bg-green-100 text-green-700 border-green-200"
                  }`}>
                    {task.priority?.toUpperCase() || "MEDIUM"}
                  </span>
                  {/* 👇 Replaced Emoji with Icon 👇 */}
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(task.due_date!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}