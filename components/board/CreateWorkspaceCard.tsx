import { FormEvent } from "react";

interface CreateWorkspaceCardProps {
  isCreating: boolean;
  setIsCreating: (value: boolean) => void;
  newBoardTitle: string;
  setNewBoardTitle: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export function CreateWorkspaceCard({
  isCreating,
  setIsCreating,
  newBoardTitle,
  setNewBoardTitle,
  onSubmit,
}: CreateWorkspaceCardProps) {
  if (isCreating) {
    return (
      <form 
        onSubmit={onSubmit}
        className="bg-white dark:bg-zinc-900 border-2 border-purple-500 p-6 rounded-xl shadow-md flex flex-col gap-3 h-full min-h-[160px]"
      >
        <input
          autoFocus
          type="text"
          placeholder="Workspace name..."
          value={newBoardTitle}
          onChange={(e) => setNewBoardTitle(e.target.value)}
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-500"
        />
        <div className="flex justify-end gap-2 mt-auto">
          <button 
            type="button" 
            onClick={() => setIsCreating(false)}
            className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-3 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors"
          >
            Create
          </button>
        </div>
      </form>
    );
  }

  return (
    <button 
      onClick={() => setIsCreating(true)}
      className="flex flex-col items-center justify-center h-full min-h-[160px] bg-transparent border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-6 rounded-xl hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all text-zinc-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 group"
    >
      <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">+</span>
      <span className="font-medium">New Workspace</span>
    </button>
  );
}