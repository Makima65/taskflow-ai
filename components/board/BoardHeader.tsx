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

// 👇 Added Lucide React Icons 👇
import { Leaf, RefreshCcw, Trash2, Sparkles, Trash } from "lucide-react";

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
            <Button variant="ghost" className="rounded-[20px] text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-2">
               <Trash className="w-4 h-4" />
               <span>Trash {trashedTasks.length > 0 && `(${trashedTasks.length})`}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Trash Bin</DialogTitle>
              <DialogDescription>
                Recover accidentally deleted tasks or permanently erase them.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              {trashedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                  {/* 👇 Replaced Emoji with Icon 👇 */}
                  <Leaf className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Your trash bin is empty.</p>
                </div>
              ) : (
                trashedTasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                    
                    <span className="font-medium text-sm text-zinc-700 dark:text-zinc-300 truncate pr-2 min-w-0">
                      {task.title}
                    </span>
                    
                    <div className="flex gap-2 shrink-0">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs px-2 sm:px-3 bg-white dark:bg-zinc-800 hover:text-green-600 dark:hover:text-green-400 border-zinc-200 dark:border-zinc-700" 
                        onClick={() => onRestoreTask(task.id)}
                        title="Restore Task"
                      >
                        {/* 👇 Replaced Emoji with Icon 👇 */}
                        <RefreshCcw className="w-3.5 h-3.5 sm:mr-1.5" /> 
                        <span className="hidden sm:inline">Restore</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        // 👇 Fixed light mode contrast (bg-red-600 + text-white) 👇
                        className="h-8 text-xs px-2 sm:px-3 bg-red-600 hover:bg-red-700 text-white dark:bg-red-500/90 dark:hover:bg-red-500" 
                        onClick={() => onHardDeleteTask(task.id)}
                        title="Permanently Delete"
                      >
                        {/* 👇 Replaced Emoji with Icon 👇 */}
                        <Trash2 className="w-3.5 h-3.5 sm:mr-1.5" />
                        <span className="hidden sm:inline">Delete</span>
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
                <Button className="w-1/2 bg-purple-600 hover:bg-purple-700 rounded-[20px] text-white flex items-center justify-center gap-1.5" onClick={onAITask} disabled={isAILoading}>
                  {/* 👇 Replaced Emoji with Icon 👇 */}
                  {isAILoading ? "Thinking..." : <><Sparkles className="w-4 h-4" /> AI Magic</>}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
      </div>
    </div>
  );
}