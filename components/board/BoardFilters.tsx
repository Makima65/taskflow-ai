"use client";

interface BoardFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterPriority: "all" | "high" | "medium" | "low";
  setFilterPriority: (val: "all" | "high" | "medium" | "low") => void;
  sortBy: "none" | "priority" | "due_date";
  setSortBy: (val: "none" | "priority" | "due_date") => void;
}

export function BoardFilters({
  searchQuery,
  setSearchQuery,
  filterPriority,
  setFilterPriority,
  sortBy,
  setSortBy,
}: BoardFiltersProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-3 w-full max-w-3xl">
      {/* Search Bar */}
      <div className="relative w-full sm:w-64">
        <svg 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text" 
          placeholder="Search tasks..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-transparent py-2 pl-9 pr-4 text-sm outline-none focus:border-purple-500 dark:border-zinc-800 dark:text-zinc-300 placeholder:text-zinc-400"
        />
      </div>

      {/* Filters & Sorting */}
      <div className="flex gap-3 w-full sm:w-auto">
        <select 
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as any)}
          className="w-full sm:w-auto rounded-md border border-zinc-300 bg-transparent p-2 text-sm outline-none focus:border-purple-500 dark:border-zinc-800 dark:text-zinc-300"
        >
          <option value="all" className="dark:bg-zinc-900">All Priorities</option>
          <option value="high" className="dark:bg-zinc-900">High</option>
          <option value="medium" className="dark:bg-zinc-900">Medium</option>
          <option value="low" className="dark:bg-zinc-900">Low</option>
        </select>

        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="w-full sm:w-auto rounded-md border border-zinc-300 bg-transparent p-2 text-sm outline-none focus:border-purple-500 dark:border-zinc-800 dark:text-zinc-300"
        >
          <option value="none" className="dark:bg-zinc-900">No Sorting</option>
          <option value="priority" className="dark:bg-zinc-900">Sort by Priority</option>
          <option value="due_date" className="dark:bg-zinc-900">Sort by Due Date</option>
        </select>
      </div>
    </div>
  );
}