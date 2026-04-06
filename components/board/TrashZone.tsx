// components/board/TrashZone.tsx
import { useDroppable } from "@dnd-kit/core";

export function TrashZone() {
  const { setNodeRef, isOver } = useDroppable({ id: "trash" });
  
  return (
    <div 
      ref={setNodeRef} 
      className={`mt-8 flex h-20 w-full select-none items-center justify-center rounded-xl border-2 border-dashed transition-all ${
        isOver 
          ? "border-red-500 bg-red-100 text-red-600 dark:border-red-500 dark:bg-red-900/30 dark:text-red-400" 
          : "border-zinc-300 text-zinc-400 dark:border-zinc-800"
      }`}
    >
      <span className="text-lg font-bold tracking-wide pointer-events-none">🗑️ Drop here to delete</span>
    </div>
  );
}