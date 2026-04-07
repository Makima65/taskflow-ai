import { useState } from "react";
// 👇 1. Import useSortable and CSS tools 👇
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DraggableTaskCard } from "./DraggableTaskCard";
import { Task } from "@/app/types"; 

export function DroppableColumn({ column, tasks, session, onRequestTaskDelete, onEditTask, onUpdateSubtasks, onRequestColumnDelete, onEditColumnTitle }: any) {
  // 👇 2. Swap useDroppable for useSortable 👇
  const { 
    setNodeRef, 
    attributes, 
    listeners, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({ 
    id: column.id,
    data: {
      type: "Column", // This helps us identify it in handleDragEnd later!
      column,
    }
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);

  const saveTitle = () => {
    onEditColumnTitle(column.id, editTitle);
    setIsEditingTitle(false);
  };

  // 👇 3. Set up the animation styles for smooth dragging 👇
  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  // 👇 4. Return a "placeholder" while the column is actively being dragged 👇
  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="flex flex-col gap-4 min-w-[320px] h-[300px] rounded-xl p-4 bg-purple-100/50 dark:bg-purple-900/20 border-2 border-purple-500 opacity-50"
      />
    );
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex flex-col gap-4 min-w-[320px] rounded-xl p-4 transition-colors bg-zinc-100 dark:bg-zinc-800/50"
    >
      <div className="flex justify-between items-center group/colheader relative">
        {isEditingTitle ? (
          <input 
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
            className="font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent outline-none border-b border-purple-500 w-full mr-2"
          />
        ) : (
          // 👇 5. Attach drag listeners ONLY to the title area (Drag Handle) 👇
          <div 
            {...attributes} 
            {...listeners} 
            className="flex items-center gap-2 flex-1 cursor-grab active:cursor-grabbing py-1"
          >
            <h2 className="font-semibold text-zinc-700 dark:text-zinc-300">{column.title}</h2>
            <span className="text-xs font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded-full">{tasks.length}</span>
          </div>
        )}
        
        <div className="relative">
          {/* Note: I added onPointerDown to stop accidental dragging when clicking the menu */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            onPointerDown={(e) => e.stopPropagation()} 
            className="opacity-100 lg:opacity-0 lg:group-hover/colheader:opacity-100 transition-opacity p-1 text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 rounded"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>

          {menuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setMenuOpen(false)} 
                onPointerDown={(e) => e.stopPropagation()} 
              />
              
              <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-zinc-800 rounded-md shadow-lg border border-zinc-200 dark:border-zinc-700 z-50 overflow-hidden text-sm">
                <button 
                  onClick={() => { setIsEditingTitle(true); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  Edit Title
                </button>
                <button 
                  onClick={() => {
                    onRequestColumnDelete(column);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 min-h-[50px]">
        {tasks.map((task: Task) => (
          <DraggableTaskCard 
            key={task.id} 
            task={task} 
            session={session} 
            onRequestDelete={onRequestTaskDelete} 
            onEdit={onEditTask} 
            onUpdateSubtasks={onUpdateSubtasks} 
            columnTitle={column.title}
          />
        ))}
      </div>
    </div>
  );
}