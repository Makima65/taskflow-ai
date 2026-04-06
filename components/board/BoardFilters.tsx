"use client";

interface BoardFiltersProps {
  filterPriority: "all" | "high" | "medium" | "low";
  setFilterPriority: (val: "all" | "high" | "medium" | "low") => void;
  sortBy: "none" | "priority" | "due_date";
  setSortBy: (val: "none" | "priority" | "due_date") => void;
}

export function BoardFilters({
  filterPriority,
  setFilterPriority,
  sortBy,
  setSortBy,
}: BoardFiltersProps) {
  return (
    <div className="mb-6 flex gap-3">
      <select 
        value={filterPriority}
        onChange={(e) => setFilterPriority(e.target.value as any)}
        className="rounded-md border border-zinc-300 bg-transparent p-2 text-sm outline-none focus:border-purple-500 dark:border-zinc-800 dark:text-zinc-300"
      >
        <option value="all" className="dark:bg-zinc-900">All Priorities</option>
        <option value="high" className="dark:bg-zinc-900">High</option>
        <option value="medium" className="dark:bg-zinc-900">Medium</option>
        <option value="low" className="dark:bg-zinc-900">Low</option>
      </select>

      <select 
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as any)}
        className="rounded-md border border-zinc-300 bg-transparent p-2 text-sm outline-none focus:border-purple-500 dark:border-zinc-800 dark:text-zinc-300"
      >
        <option value="none" className="dark:bg-zinc-900">No Sorting</option>
        <option value="priority" className="dark:bg-zinc-900">Sort by Priority</option>
        <option value="due_date" className="dark:bg-zinc-900">Sort by Due Date</option>
      </select>
    </div>
  );
}