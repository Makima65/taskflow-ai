import { FormEvent } from "react";
import styled from "styled-components";

interface Board {
  id: string;
  title: string;
  created_at: string;
  user_id: string; // 👇 Added user_id to fix the TypeScript mismatch
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
  onShareClick: (board: Board) => void;
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
  onNavigate,
  onShareClick
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
                
                <StyledWrapper className="absolute right-0 top-8 z-50">
                  <div className="card shadow-2xl">
                    <ul className="list">
                      {/* RENAME */}
                      <li 
                        className="element" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartEdit();
                          setActiveMenuId(null);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width={25} height={25} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                          <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                          <path d="m15 5 4 4" />
                        </svg>
                        <p className="label">Rename</p>
                      </li>
                      
                      {/* ADD MEMBER */}
                      <li 
                        className="element" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onShareClick(board); 
                          setActiveMenuId(null); 
                        }}
                      >
                        <svg className="lucide lucide-user-round-plus" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="currentColor" fill="none" viewBox="0 0 24 24" height={24} width={24} xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 21a8 8 0 0 1 13.292-6" />
                          <circle r={5} cy={8} cx={10} />
                          <path d="M19 16v6" />
                          <path d="M22 19h-6" />
                        </svg>
                        <p className="label">Add Member</p>
                      </li>
                    </ul>
                    
                    <div className="separator" />
                    
                    <ul className="list">
                      {/* SETTINGS */}
                      <li className="element" onClick={(e) => e.stopPropagation()}>
                        <svg className="lucide lucide-settings" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="currentColor" fill="none" viewBox="0 0 24 24" height={24} width={24} xmlns="http://www.w3.org/2000/svg">
                          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                          <circle r={3} cy={12} cx={12} />
                        </svg>
                        <p className="label">Settings</p>
                      </li>
                      
                      {/* DELETE */}
                      <li 
                        className="element delete" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClick(e, board);
                          setActiveMenuId(null); 
                        }}
                      >
                        <svg className="lucide lucide-trash-2" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="currentColor" fill="none" viewBox="0 0 24 24" height={24} width={24} xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line y2={17} y1={11} x2={10} x1={10} />
                          <line y2={17} y1={11} x2={14} x1={14} />
                        </svg>
                        <p className="label">Delete</p>
                      </li>
                    </ul>
                    
                    <div className="separator" />
                    
                    <ul className="list">
                      {/* TEAM ACCESS */}
                      <li 
                        className="element" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onShareClick(board); 
                          setActiveMenuId(null);
                        }}
                      >
                        <svg className="lucide lucide-users-round" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="currentColor" fill="none" viewBox="0 0 24 24" height={24} width={24} xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 21a8 8 0 0 0-16 0" />
                          <circle r={5} cy={8} cx={10} />
                          <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
                        </svg>
                        <p className="label">Team Access</p>
                      </li>
                    </ul>
                  </div>
                </StyledWrapper>
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

// Custom Styled Component for the dropdown menu supporting Light & Dark modes
const StyledWrapper = styled.div`
  /* ------------------------------- */
  /* ☀️ LIGHT MODE (Default Styles)  */
  /* ------------------------------- */
  .card {
    width: 200px;
    background-color: #ffffff;
    border: 1px solid #e4e4e7; /* zinc-200 */
    border-radius: 10px;
    padding: 15px 0px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  }

  .card .separator {
    border-top: 1px solid #e4e4e7; /* zinc-200 */
  }

  .card .list {
    list-style-type: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0px 10px;
    margin: 0;
  }

  .card .list .element {
    display: flex;
    align-items: center;
    color: #52525b; /* zinc-600 */
    gap: 10px;
    transition: all 0.2s ease-out;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
  }

  .card .list .element svg {
    width: 19px;
    height: 19px;
    transition: all 0.2s ease-out;
    flex-shrink: 0;
    stroke: #52525b; /* zinc-600 */
  }

  .card .list .element .label {
    font-weight: 600;
    font-size: 14px;
    margin: 0;
  }

  /* Light Mode Hovers */
  .card .list .element:hover {
    background-color: #f4f4f5; /* zinc-100 */
    color: #18181b; /* zinc-900 */
  }
  .card .list .element:hover svg {
    stroke: #18181b;
  }
  
  .card .list .delete:hover {
    background-color: #fef2f2; /* red-50 */
    color: #dc2626; /* red-600 */
  }
  .card .list .delete:hover svg {
    stroke: #dc2626;
  }

  /* Team Access special color (Light) */
  .card .list:last-child .element { color: #9333ea; }
  .card .list:last-child svg { stroke: #9333ea; }
  .card .list:last-child .element:hover { background-color: #faf5ff; }

  .card .list .element:active {
    transform: scale(0.99);
  }

  /* ------------------------------- */
  /* 🌙 DARK MODE STYLES             */
  /* ------------------------------- */
  html.dark & .card {
    background-color: rgba(36, 40, 50, 1);
    background-image: linear-gradient(
      139deg,
      rgba(36, 40, 50, 1) 0%,
      rgba(36, 40, 50, 1) 0%,
      rgba(37, 28, 40, 1) 100%
    );
    border: 1px solid #27272a; /* zinc-800 */
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  }

  html.dark & .card .separator {
    border-top: 1.5px solid #42434a;
  }

  html.dark & .card .list .element {
    color: #7e8590;
  }
  
  html.dark & .card .list .element svg {
    stroke: #7e8590;
  }

  /* Dark Mode Hovers */
  html.dark & .card .list .element:hover {
    background-color: #5353ff;
    color: #ffffff;
    transform: translate(1px, -1px);
  }
  html.dark & .card .list:not(:last-child) .element:hover svg {
    stroke: #ffffff;
  }
  
  html.dark & .card .list .delete:hover {
    background-color: #8e2a2a;
    color: #ffffff;
  }

  /* Team Access special color (Dark) */
  html.dark & .card .list:last-child .element { color: #bd89ff; }
  html.dark & .card .list:last-child svg { stroke: #bd89ff; }
  html.dark & .card .list:last-child .element:hover { background-color: rgba(56, 45, 71, 0.836); }
`;