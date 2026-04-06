"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FloatingInput } from "@/components/ui/FloatingInput";
import ThemeToggle from "@/app/ThemeToggle"; // Adjust this path if needed!

export function BoardHeader({
  trashedTasks,
  onRestoreTask,
  onHardDeleteTask,
  newTaskTitle,
  setNewTaskTitle,
  onAddTask,
  onAITask,
  isAILoading,
  onSignOut,
}: any) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        <span className="text-purple-600 dark:text-purple-500">TaskFlow</span> AI
      </h1>

      <div className="flex items-center gap-4">
        <ThemeToggle />

        {/* TRASH BIN MODAL */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="rounded-[20px] text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
              🗑️ Trash {trashedTasks.length > 0 && `(${trashedTasks.length})`}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Trash Bin 🗑️</DialogTitle>
              <DialogDescription>
                Recover accidentally deleted tasks or permanently erase them.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              {trashedTasks.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl">🍃</span>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Your trash bin is empty.</p>
                </div>
              ) : (
                trashedTasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 group/trashitem">
                    <span className="font-medium text-sm text-zinc-700 dark:text-zinc-300 truncate pr-4">{task.title}</span>
                    <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover/trashitem:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" className="h-7 text-xs bg-white dark:bg-zinc-800 hover:text-green-600 dark:hover:text-green-400" onClick={() => onRestoreTask(task.id)}>
                        ♻️ Restore
                      </Button>
                      <Button size="sm" variant="destructive" className="h-7 text-xs bg-red-500 hover:bg-red-600" onClick={() => onHardDeleteTask(task.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ADD TASK MODAL */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-[20px]">+ Add Task</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Brain-dump your task</DialogTitle>
              <DialogDescription>
                Enter your task manually or let AI organize it for you.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-6 py-4">
              <FloatingInput label="What do you need to do?" value={newTaskTitle} onChange={(e: any) => setNewTaskTitle(e.target.value)} />
              <div className="flex gap-2">
                <Button variant="outline" className="w-1/2 rounded-[20px] border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-purple-400" onClick={onAddTask}>
                  Normal Save
                </Button>
                <Button className="w-1/2 bg-purple-600 hover:bg-purple-700 rounded-[20px] text-white" onClick={onAITask} disabled={isAILoading}>
                  {isAILoading ? "Thinking..." : "✨ AI Magic"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* SIGN OUT */}
        <Button variant="ghost" className="rounded-[20px] hover:text-purple-600 dark:hover:text-purple-400" onClick={onSignOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}