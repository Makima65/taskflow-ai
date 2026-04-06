"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FloatingInput } from "@/components/ui/FloatingInput";

export function AddColumnModal({ 
  newColumnTitle, 
  setNewColumnTitle, 
  onAddColumn 
}: any) {
  return (
    <div className="min-w-[320px] flex items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl p-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" className="h-full w-full text-zinc-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 dark:hover:text-purple-400 text-lg">
            + Add Column
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new column</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <FloatingInput 
              label="Column Title" 
              value={newColumnTitle} 
              onChange={(e: any) => setNewColumnTitle(e.target.value)} 
            />
            <Button onClick={onAddColumn} className="bg-purple-600 text-white hover:bg-purple-700">
              Add Column
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}