import { FormEvent } from "react";

interface Board {
  id: string;
  title: string;
  created_at: string;
}

interface WorkspaceCardProps {
  board: Board;
  isEditing: boolean;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  onRename: (e: FormEvent, boardId: string) => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onDeleteClick: (e: React.MouseEvent, board: Board) => void;
  onNavigate: () => void;
}

export function WorkspaceCard({
  board,
  isEditing,
  editingTitle,
  setEditingTitle,
  activeMenuId,
  setActiveMenuId,
  onRename,
  onCancelEdit,
  onStartEdit,
  onDeleteClick,
  onNavigate
}: WorkspaceCardProps) {
  return (
    <div 
      onClick={onNavigate}
      className={`relative flex flex-col h-full min-h-[160px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl transition-all group ${
        isEditing ? "" : "cursor-pointer hover:border-purple-500 hover:shadow-md"
      }`}
    >
      {isEditing ? (
        <form 
          onSubmit={(e) => onRename(e, board.id)}
          className="flex flex-col h-full gap-3"
          onClick={(e) => e.stopPropagation()} 
        >
          <input
            autoFocus
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-500"
          />
          <div className="flex justify-end gap-2 mt-auto">
            <button 
              type="button" 
              onClick={onCancelEdit}
              className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-3 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex justify-between items-start mb-2 relative">
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors pr-8 line-clamp-2">
              {board.title}
            </h2>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setActiveMenuId(activeMenuId === board.id ? null : board.id);
              }}
              className="absolute -right-2 -top-2 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-10"
              title="Options"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
              </svg>
            </button>

            {activeMenuId === board.id && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(null);
                  }}
                />
                
                <div className="absolute right-0 top-8 w-32 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartEdit();
                      setActiveMenuId(null);
                    }}
                    className="px-4 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                  >
                    ✏️ Edit
                  </button>
                  <div className="h-[1px] bg-zinc-200 dark:bg-zinc-700 w-full" />
                  <button
                    onClick={(e) => onDeleteClick(e, board)}
                    className="px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </>
            )}
          </div>
          
          <p className="mt-auto text-sm text-zinc-500 dark:text-zinc-400 pt-4">
            Created {new Date(board.created_at).toLocaleDateString()}
          </p>
        </>
      )}
    </div>
  );
}