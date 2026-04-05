"use client";

import ThemeToggle from "./ThemeToggle";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { generateTaskWithAI } from "./actions";
import { Toaster, toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ========================================================================
// TYPES & HELPERS
// ========================================================================
type Subtask = { id: string; title: string; is_completed: boolean; task_id: string };
type Column = { id: string; title: string; position: number };
type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string; 
  priority?: "high" | "medium" | "low";
  due_date?: string | null;
  created_at?: string;
  subtasks?: Subtask[]; 
};

function getRelativeTime(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

// ========================================================================
// 1. COMPONENTS: INPUTS, BUTTONS, AND MODALS
// ========================================================================
function FloatingInput({ label, type = "text", value, onChange, onKeyDown }: any) {
  const hasText = value.length > 0;

  return (
    <div className="relative my-2 w-full font-sans">
      <input
        type={type}
        required
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className="peer w-full rounded-[20px] border border-zinc-300 bg-transparent p-3 text-base outline-none transition-colors focus:border-purple-600 dark:border-zinc-700 dark:focus:border-purple-500"
      />
      <label
        className={`pointer-events-none absolute left-3 transition-all duration-300 px-1 bg-white dark:bg-zinc-900 ${
          hasText 
            ? "top-0 -translate-y-1/2 scale-90 text-purple-600 dark:text-purple-400" 
            : "top-1/2 -translate-y-1/2 text-zinc-500 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-90 peer-focus:text-purple-600 dark:peer-focus:text-purple-400"
        }`}
      >
        {label}
      </label>
    </div>
  );
}

function AnimatedCheckbox({ id, checked, onChange, label }: { id: string; checked: boolean; onChange: () => void; label: string }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .animated-checkbox-wrapper {
          --text: #3f3f46; /* text-zinc-700 */
          --check: #9333ea; /* text-purple-600 */
          --disabled: #a1a1aa; /* text-zinc-400 */
          display: grid;
          grid-template-columns: 30px auto;
          align-items: center;
        }
        
        .dark .animated-checkbox-wrapper {
          --text: #d4d4d8; /* text-zinc-300 */
          --check: #c084fc; /* text-purple-400 */
          --disabled: #52525b; /* text-zinc-600 */
        }

        .animated-checkbox-wrapper label {
          color: var(--text);
          position: relative;
          cursor: pointer;
          display: grid;
          align-items: center;
          width: fit-content;
          transition: color 0.3s ease;
          font-size: 0.875rem; /* text-sm */
        }

        .animated-checkbox-wrapper label::before, 
        .animated-checkbox-wrapper label::after {
          content: "";
          position: absolute;
        }

        .animated-checkbox-wrapper label::before {
          height: 2px;
          width: 8px;
          left: -27px;
          background: var(--check);
          border-radius: 2px;
          transition: background 0.3s ease;
        }

        .animated-checkbox-wrapper label:after {
          height: 4px;
          width: 4px;
          top: 8px;
          left: -25px;
          border-radius: 50%;
        }

        .animated-checkbox-wrapper input[type="checkbox"] {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          position: relative;
          height: 15px;
          width: 15px;
          outline: none;
          border: 0;
          margin: 0 15px 0 0;
          cursor: pointer;
          background: transparent;
          display: grid;
          align-items: center;
        }

        .animated-checkbox-wrapper input[type="checkbox"]::before, 
        .animated-checkbox-wrapper input[type="checkbox"]::after {
          content: "";
          position: absolute;
          height: 2px;
          top: auto;
          background: var(--check);
          border-radius: 2px;
        }

        .animated-checkbox-wrapper input[type="checkbox"]::before {
          width: 0px;
          right: 60%;
          transform-origin: right bottom;
        }

        .animated-checkbox-wrapper input[type="checkbox"]::after {
          width: 0px;
          left: 40%;
          transform-origin: left bottom;
        }

        .animated-checkbox-wrapper input[type="checkbox"]:checked::before {
          animation: check-01 0.4s ease forwards;
        }

        .animated-checkbox-wrapper input[type="checkbox"]:checked::after {
          animation: check-02 0.4s ease forwards;
        }

        .animated-checkbox-wrapper input[type="checkbox"]:checked + label {
          color: var(--disabled);
          animation: move 0.3s ease 0.1s forwards;
        }

        .animated-checkbox-wrapper input[type="checkbox"]:checked + label::before {
          background: var(--disabled);
          animation: slice 0.4s ease forwards;
        }

        .animated-checkbox-wrapper input[type="checkbox"]:checked + label::after {
          animation: firework 0.5s ease forwards 0.1s;
        }

        @keyframes move {
          50% { padding-left: 8px; padding-right: 0px; }
          100% { padding-right: 4px; }
        }

        @keyframes slice {
          60% { width: 100%; left: 4px; }
          100% { width: 100%; left: -2px; padding-left: 0; }
        }

        @keyframes check-01 {
          0% { width: 4px; top: auto; transform: rotate(0); }
          50% { width: 0px; top: auto; transform: rotate(0); }
          51% { width: 0px; top: 8px; transform: rotate(45deg); }
          100% { width: 5px; top: 8px; transform: rotate(45deg); }
        }

        @keyframes check-02 {
          0% { width: 4px; top: auto; transform: rotate(0); }
          50% { width: 0px; top: auto; transform: rotate(0); }
          51% { width: 0px; top: 8px; transform: rotate(-45deg); }
          100% { width: 10px; top: 8px; transform: rotate(-45deg); }
        }

        @keyframes firework {
          0% { opacity: 1; box-shadow: 0 0 0 -2px var(--check), 0 0 0 -2px var(--check), 0 0 0 -2px var(--check), 0 0 0 -2px var(--check), 0 0 0 -2px var(--check), 0 0 0 -2px var(--check); }
          30% { opacity: 1; }
          100% { opacity: 0; box-shadow: 0 -15px 0 0px var(--check), 14px -8px 0 0px var(--check), 14px 8px 0 0px var(--check), 0 15px 0 0px var(--check), -14px 8px 0 0px var(--check), -14px -8px 0 0px var(--check); }
        }
      `}} />
      <div className="animated-checkbox-wrapper">
        <input 
          type="checkbox" 
          id={`checkbox-${id}`} 
          checked={checked} 
          onChange={onChange} 
        />
        <label htmlFor={`checkbox-${id}`}>{label}</label>
      </div>
    </>
  );
}
function FancyEditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()} 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="group/btn relative flex h-7 w-[70px] overflow-hidden items-center justify-start rounded-md border-none bg-[rgb(168,38,255)] px-3 text-[10px] font-medium text-white shadow-[3px_3px_0px_rgb(140,32,212)] transition-all duration-300 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_rgb(140,32,212)]"
    >
      <span className="transition-all duration-300 group-hover/btn:-translate-y-8 group-hover/btn:opacity-0">Edit</span>
      <svg className="absolute right-3 w-[10px] fill-white transition-all duration-300 group-hover/btn:right-[calc(50%-5px)]" viewBox="0 0 512 512">
        <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
      </svg>
    </button>
  );
}

function FancyDeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()} 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="group/btn relative flex h-7 w-[70px] overflow-hidden items-center justify-start rounded-md border-none bg-red-500 px-2.5 text-[10px] font-medium text-white shadow-[3px_3px_0px_rgb(185,28,28)] transition-all duration-300 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_rgb(185,28,28)] dark:bg-red-600 dark:shadow-[3px_3px_0px_rgb(153,27,27)]"
    >
      <span className="transition-all duration-300 group-hover/btn:-translate-y-8 group-hover/btn:opacity-0">Delete</span>
      <svg className="absolute right-2.5 w-[10px] fill-white transition-all duration-300 group-hover/btn:right-[calc(50%-5px)]" viewBox="0 0 448 512">
        <path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"/>
      </svg>
    </button>
  );
}

// THE NEW CUSTOM CONFIRMATION MODAL
function CustomConfirmModal({ isOpen, onClose, onConfirm, title, description }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[300px] h-fit bg-white dark:bg-zinc-900 rounded-[20px] flex flex-col items-center justify-center gap-5 p-[30px] relative shadow-[20px_20px_30px_rgba(0,0,0,0.068)] dark:shadow-[20px_20px_30px_rgba(0,0,0,0.4)] animate-in fade-in zoom-in-95 duration-200">
        
        <button onClick={onClose} className="absolute top-[20px] right-[20px] flex items-center justify-center border-none bg-transparent cursor-pointer group">
          <svg height="20px" viewBox="0 0 384 512" className="fill-[#afafaf] group-hover:fill-black dark:group-hover:fill-white transition-colors">
            <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
          </svg>
        </button>

        <div className="w-full flex flex-col gap-[5px]">
          <p className="text-[20px] font-bold text-[#1b1b1b] dark:text-zinc-50 m-0 leading-tight">{title}</p>
          <p className="font-[100] text-[#666666] dark:text-zinc-400 m-0 text-sm leading-snug">{description}</p>
        </div>

        <div className="w-full flex items-center justify-center gap-[10px]">
          <button onClick={onClose} className="w-1/2 h-[35px] rounded-[10px] border-none cursor-pointer font-semibold bg-[#ddd] hover:bg-[#c5c5c5] dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 transition-colors text-zinc-900">
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className="w-1/2 h-[35px] rounded-[10px] border-none cursor-pointer font-semibold bg-[#ff726d] hover:bg-[#ff4942] text-white transition-colors"
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  );
}

// ========================================================================
// 2. TASK CARDS & COLUMNS
// ========================================================================
function DraggableTaskCard({ task, session, onRequestDelete, onEdit, onUpdateSubtasks }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "history">("edit");
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [newSubtask, setNewSubtask] = useState("");
  
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority || "medium",
    due_date: task.due_date || "",
  });

  const completedSubtasks = task.subtasks?.filter((s:any) => s.is_completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  useEffect(() => {
    if (isEditing && activeTab === "history") {
      supabase.from("task_history").select("*").eq("task_id", task.id).order("created_at", { ascending: false })
        .then(({ data }) => setHistoryLogs(data || []));
    }
  }, [isEditing, activeTab, task.id]);

  const handleAddSubtask = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSubtask.trim() !== '') {
      e.preventDefault();
      await supabase.from("subtasks").insert([{ task_id: task.id, user_id: session.user.id, title: newSubtask }]);
      setNewSubtask("");
      onUpdateSubtasks();
    }
  };

  const toggleSubtask = async (subtask: Subtask) => {
    await supabase.from("subtasks").update({ is_completed: !subtask.is_completed }).eq("id", subtask.id);
    onUpdateSubtasks();
  };

  const deleteSubtask = async (id: string) => {
    await supabase.from("subtasks").delete().eq("id", id);
    onUpdateSubtasks();
  };

  const { attributes, listeners, setNodeRef, transform } = useDraggable({ 
    id: task.id,
    disabled: isEditing 
  });
  
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  const priorityColor: any = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
  };

  const handleSave = () => {
    onEdit(task.id, editForm);
    setIsEditing(false);
  };

  return (
    <>
      <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`z-10 relative group/card ${!isEditing ? "cursor-grab active:cursor-grabbing" : ""}`}>
        <Card className="relative border-l-4 border-l-purple-600 dark:border-l-purple-500 overflow-hidden flex flex-col justify-between min-h-[100px] w-full bg-white dark:bg-zinc-900">
          
          <CardHeader className="p-4 pb-2 w-full">
            <div className="w-full pr-[155px]">
              <CardTitle className="text-md font-medium leading-snug break-words">
                {task.title}
              </CardTitle>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {task.priority && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${priorityColor[task.priority]}`}>
                  {task.priority.toUpperCase()}
                </span>
              )}
              {task.due_date && (
                <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 flex items-center gap-1">
                  🗓 {task.due_date}
                </span>
              )}
              {totalSubtasks > 0 && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">
                  ☑ {completedSubtasks}/{totalSubtasks}
                </span>
              )}
            </div>
          </CardHeader>

          <div className="px-4 pb-3 mt-auto">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
              Added {getRelativeTime(task.created_at)}
            </p>
          </div>

          <div className="absolute top-3 right-3 flex gap-2 opacity-0 transition-opacity group-hover/card:opacity-100 z-20">
            <FancyEditButton onClick={() => setIsEditing(true)} />
            <FancyDeleteButton onClick={() => onRequestDelete(task.id)} />
          </div>
        </Card>
      </div>

      {/* Edit Task Dialog (Omitted internal details for brevity since they didn't change) */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
         <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          {/* Internal dialog content same as before */}
          <DialogHeader>
            <DialogTitle className="sr-only">Edit Task</DialogTitle>
            <DialogDescription className="sr-only">Edit task details.</DialogDescription>
            <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <button onClick={() => setActiveTab("edit")} className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${activeTab === "edit" ? "border-purple-600 text-purple-600 dark:text-purple-400" : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"}`}>Details</button>
              <button onClick={() => setActiveTab("history")} className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${activeTab === "history" ? "border-purple-600 text-purple-600 dark:text-purple-400" : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"}`}>Activity Log</button>
            </div>
          </DialogHeader>
          {activeTab === "edit" ? (
            <div className="flex flex-col gap-5 py-2">
              <input value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="text-xl font-bold bg-transparent outline-none dark:text-white border-b border-transparent focus:border-purple-500 transition-colors pb-1" />
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Description</label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIsPreviewMode(!isPreviewMode)}>
                    {isPreviewMode ? "📝 Edit Markdown" : "👁️ Preview"}
                  </Button>
                </div>
                {isPreviewMode ? (
                  <div className="min-h-[100px] rounded-md border border-zinc-200 bg-zinc-50 p-4 prose prose-sm dark:prose-invert dark:bg-zinc-900 dark:border-zinc-800 max-w-none">
                    {editForm.description ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{editForm.description}</ReactMarkdown> : <span className="text-zinc-400 italic">No description.</span>}
                  </div>
                ) : (
                  <textarea rows={5} value={editForm.description} placeholder="Use Markdown..." onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="w-full resize-y rounded-md border border-zinc-300 bg-transparent p-3 outline-none focus:border-purple-500 dark:border-zinc-700 dark:text-white font-mono text-sm" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Subtasks</label>
                <div className="flex flex-col gap-2 mb-2 w-full">
  {task.subtasks?.map((subtask: any) => (
    <div key={subtask.id} className="flex items-center justify-between group/sub w-full">
      {/* 🟢 Replaced the native checkbox with the new animated one */}
      <AnimatedCheckbox 
        id={subtask.id}
        checked={subtask.is_completed}
        onChange={() => toggleSubtask(subtask)}
        label={subtask.title}
      />
      
      <button 
        onClick={() => deleteSubtask(subtask.id)} 
        className="text-red-500 opacity-0 group-hover/sub:opacity-100 transition-opacity text-xs p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
      >
        ✕
      </button>
    </div>
  ))}
</div>
                <FloatingInput label="+ Add a subtask (Press Enter)" value={newSubtask} onChange={(e: any) => setNewSubtask(e.target.value)} onKeyDown={handleAddSubtask} />
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col gap-1 w-1/2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Priority</label>
                  <select value={editForm.priority} onChange={(e) => setEditForm({...editForm, priority: e.target.value as any})} className="w-full rounded-md border border-zinc-300 bg-transparent p-2 outline-none focus:border-purple-500 dark:border-zinc-700 dark:text-white">
                    <option value="low" className="dark:bg-zinc-800">Low</option>
                    <option value="medium" className="dark:bg-zinc-800">Medium</option>
                    <option value="high" className="dark:bg-zinc-800">High</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 w-1/2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Due Date</label>
                  <input type="date" value={editForm.due_date} onChange={(e) => setEditForm({...editForm, due_date: e.target.value})} className="w-full rounded-md border border-zinc-300 bg-transparent p-2 outline-none focus:border-purple-500 dark:border-zinc-700 dark:text-white dark:[color-scheme:dark]" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button className="bg-purple-600 text-white hover:bg-purple-700" onClick={handleSave}>Save Changes</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 py-2 max-h-[300px] overflow-y-auto">
              {historyLogs.length === 0 ? <p className="text-sm text-zinc-500 text-center py-4">No activity yet.</p> : historyLogs.map((log) => (
                <div key={log.id} className="flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-700 pl-3 py-1">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{getRelativeTime(log.created_at)}</p>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200"><span className="text-purple-600 dark:text-purple-400">{log.action}: </span>{log.details}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function DroppableColumn({ column, tasks, session, onRequestTaskDelete, onEditTask, onUpdateSubtasks, onRequestColumnDelete, onEditColumnTitle }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);

  const saveTitle = () => {
    onEditColumnTitle(column.id, editTitle);
    setIsEditingTitle(false);
  };

  return (
    <div ref={setNodeRef} className={`flex flex-col gap-4 min-w-[320px] rounded-xl p-4 transition-colors ${isOver ? "bg-purple-100/50 dark:bg-purple-900/20" : "bg-zinc-100 dark:bg-zinc-800/50"}`}>
      
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
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-zinc-700 dark:text-zinc-300">{column.title}</h2>
            <span className="text-xs font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded-full">{tasks.length}</span>
          </div>
        )}
        
        {/* TRIPLE DOT MENU FOR COLUMN */}
        <div className="relative">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="opacity-0 group-hover/colheader:opacity-100 transition-opacity p-1 text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 rounded"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>

          {menuOpen && (
            <>
              {/* Invisible overlay to close dropdown when clicking outside */}
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              
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

      {tasks.map((task: Task) => (
        <DraggableTaskCard 
          key={task.id} 
          task={task} 
          session={session} 
          onRequestDelete={onRequestTaskDelete} 
          onEdit={onEditTask} 
          onUpdateSubtasks={onUpdateSubtasks} 
        />
      ))}
    </div>
  );
}

function TrashZone() {
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

// ========================================================================
// 3. MAIN APP
// ========================================================================
export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAILoading, setIsAILoading] = useState(false); 

  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all");
  const [sortBy, setSortBy] = useState<"none" | "priority" | "due_date">("none");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Global State for Custom Delete Modal
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {}
  });

  const hasFetchedCols = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchColumns();
      fetchTasks();
    } else {
      setTasks([]);
      setColumns([]);
      hasFetchedCols.current = false;
    }
  }, [session]);

  const fetchColumns = async () => {
    if (hasFetchedCols.current) return;
    hasFetchedCols.current = true;

    let { data, error } = await supabase.from("columns").select("*").eq("user_id", session.user.id).order('position');
    if (data?.length === 0) {
      const defaultCols = [
        { user_id: session.user.id, title: "To Do", position: 1 },
        { user_id: session.user.id, title: "In Progress", position: 2 },
        { user_id: session.user.id, title: "Done", position: 3 }
      ];
      const res = await supabase.from("columns").insert(defaultCols).select();
      data = res.data;
    }
    if (!error && data) setColumns(data);
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase.from("tasks").select('*, subtasks(*)').eq("user_id", session.user.id);
    if (!error) setTasks(data || []);
  };

  const logActivity = async (taskId: string, action: string, details: string) => {
    if (!session?.user) return;
    await supabase.from("task_history").insert([{ task_id: taskId, user_id: session.user.id, action, details }]);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const authPromise = isSignUp 
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });

    toast.promise(authPromise, {
      loading: isSignUp ? 'Creating account...' : 'Signing in...',
      success: (result) => {
        if (result.error) throw result.error;
        return isSignUp ? "Check your email to confirm your account!" : "Welcome back!";
      },
      error: (err) => err.message,
    });
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;
    const newCol = { user_id: session.user.id, title: newColumnTitle, position: columns.length + 1 };
    const { data, error } = await supabase.from("columns").insert([newCol]).select();
    if (!error && data) {
      setColumns([...columns, data[0]]);
      setNewColumnTitle("");
      toast.success("Column added!");
    }
  };

  const handleEditColumnTitle = async (columnId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setColumns((prev) => prev.map((col) => col.id === columnId ? { ...col, title: newTitle } : col));
    const { error } = await supabase.from("columns").update({ title: newTitle }).eq("id", columnId);
    if (error) toast.error("Failed to update column name");
  };

  const executeDeleteColumn = async (columnId: string) => {
    setColumns((prev) => prev.filter((col) => col.id !== columnId));
    setTasks((prev) => prev.filter((task) => task.status !== columnId));

    const { error } = await supabase.from("columns").delete().eq("id", columnId);
    if (error) {
      toast.error("Failed to delete column");
      hasFetchedCols.current = false;
      fetchColumns();
      fetchTasks();
    } else {
      toast.success("Column deleted!");
    }
  };

  const requestColumnDelete = (column: Column) => {
    setModalConfig({
      isOpen: true,
      title: "Delete column?",
      description: `Are you sure you want to delete the "${column.title}" column? All tasks inside it will be lost forever.`,
      onConfirm: () => executeDeleteColumn(column.id)
    });
  };

  const handleAddTask = async () => {
    if (newTaskTitle.trim() === "" || columns.length === 0) return;
    const newTask = { title: newTaskTitle, status: columns[0].id, user_id: session.user.id };
    const { data, error } = await supabase.from("tasks").insert([newTask]).select();
    if (!error && data) {
      setTasks([...tasks, { ...data[0], subtasks: [] }]);
      setNewTaskTitle("");
      toast.success("Task added successfully!"); 
      await logActivity(data[0].id, "Created", "Task was created manually");
    }
  };

  const handleAITask = async () => {
    if (newTaskTitle.trim() === "" || columns.length === 0) return;
    setIsAILoading(true); 
    const aiResult = await generateTaskWithAI(newTaskTitle);
    
    if (aiResult && aiResult.title) {
      const finalTask = { ...aiResult, status: columns[0].id, user_id: session.user.id };
      const { data, error } = await supabase.from("tasks").insert([finalTask]).select();
      if (!error && data) {
        setTasks([...tasks, { ...data[0], subtasks: [] }]);
        setNewTaskTitle(""); 
        toast.success("AI generated your task!"); 
        await logActivity(data[0].id, "Generated", "Task was created by AI");
      }
    }
    setIsAILoading(false); 
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;

    if (over.id === "trash") {
      // Direct drag-to-trash avoids modal since dragging implies strong intent, 
      // but you can wrap this in a modal too if you prefer!
      executeDeleteTask(taskId);
      return;
    }

    const newStatusId = over.id as string;
    const taskToMove = tasks.find((t) => t.id === taskId);
    
    if (!taskToMove || taskToMove.status === newStatusId) return;

    setTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, status: newStatusId } : task));
    await supabase.from("tasks").update({ status: newStatusId }).eq("id", taskId);
    
    const destColumn = columns.find(c => c.id === newStatusId)?.title || "another column";
    await logActivity(taskId, "Moved", `Moved to ${destColumn}`);
  };

  const executeDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (!error) toast.info("Task deleted"); 
  };

  const requestTaskDelete = (taskId: string) => {
    setModalConfig({
      isOpen: true,
      title: "Delete task?",
      description: "Are you sure you want to delete this task? This action cannot be undone.",
      onConfirm: () => executeDeleteTask(taskId)
    });
  };

  const handleEditTask = async (taskId: string, updates: Partial<Task>) => {
    if (updates.title?.trim() === "") return;
    
    setTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, ...updates } : task));
    const { error } = await supabase.from("tasks").update(updates).eq("id", taskId);
    if (!error) {
      toast.success("Task updated successfully!");
      await logActivity(taskId, "Updated", "Task details were modified");
    }
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Successfully signed out!");
  };

  const processedTasks = tasks
    .filter(t => filterPriority === "all" || t.priority === filterPriority)
    .sort((a, b) => {
      if (sortBy === "priority") {
        const pWeight: any = { high: 3, medium: 2, low: 1, undefined: 0 };
        return (pWeight[b.priority || "medium"] || 0) - (pWeight[a.priority || "medium"] || 0);
      }
      if (sortBy === "due_date") {
        if (!a.due_date) return 1; 
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return 0; 
    });

  // ========================================================================
  // 4. THE LOGIN SCREEN 
  // ========================================================================
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950 relative">
        <Toaster richColors position="bottom-center" /> 
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <div className="w-[350px] bg-white dark:bg-zinc-900 shadow-[0px_5px_15px_rgba(0,0,0,0.35)] dark:shadow-[0px_5px_15px_rgba(0,0,0,0.8)] rounded-[10px] box-border p-[20px_30px]">
          <h1 className="text-center font-sans mt-[10px] mb-[30px] text-[28px] font-extrabold text-zinc-900 dark:text-zinc-50">
            {isSignUp ? "Create Account" : "Welcome back"}
          </h1>
          <form onSubmit={handleAuth} className="w-full flex flex-col gap-[18px] mb-[15px]">
            <FloatingInput label="Email Address" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
            <div>
              <FloatingInput label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
              {!isSignUp && (
                <p className="underline m-0 text-right text-[#747474] decoration-[#747474]">
                  <span onClick={() => toast.info("Password reset coming soon!")} className="cursor-pointer font-sans text-[11px] font-bold hover:text-black dark:hover:text-white transition-colors">
                    Forgot Password?
                  </span>
                </p>
              )}
            </div>
            <button type="submit" className="px-[15px] py-[10px] font-sans rounded-[20px] border-0 outline-none bg-purple-600 hover:bg-purple-700 transition-colors text-white cursor-pointer shadow-[0px_3px_8px_rgba(0,0,0,0.24)] active:shadow-none">
              {isSignUp ? "Sign Up" : "Log in"}
            </button>
          </form>
          <p className="m-0 text-[11px] text-[#747474] font-sans text-center">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <span onClick={() => setIsSignUp(!isSignUp)} className="ml-[2px] text-[12px] underline decoration-purple-600 text-purple-600 cursor-pointer font-extrabold transition-colors hover:text-purple-700">
              {isSignUp ? "Log in" : "Sign up"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // 5. THE MAIN APP BOARD
  // ========================================================================
  return (
    <main className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-950">
      <Toaster richColors position="bottom-right" /> 
      
      {/* GLOBAL DELETE CONFIRMATION MODAL */}
      <CustomConfirmModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        description={modalConfig.description}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
      />

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          <span className="text-purple-600 dark:text-purple-500">TaskFlow</span> AI
        </h1>

        <div className="flex items-center gap-4">
          <ThemeToggle />

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
                  <Button variant="outline" className="w-1/2 rounded-[20px] border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-purple-400" onClick={handleAddTask}>
                    Normal Save
                  </Button>
                  <Button className="w-1/2 bg-purple-600 hover:bg-purple-700 rounded-[20px] text-white" onClick={handleAITask} disabled={isAILoading}>
                    {isAILoading ? "Thinking..." : "✨ AI Magic"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="ghost" className="rounded-[20px] hover:text-purple-600 dark:hover:text-purple-400" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        <select 
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as "all" | "high" | "medium" | "low")}
          className="rounded-md border border-zinc-300 bg-transparent p-2 text-sm outline-none focus:border-purple-500 dark:border-zinc-800 dark:text-zinc-300"
        >
          <option value="all" className="dark:bg-zinc-900">All Priorities</option>
          <option value="high" className="dark:bg-zinc-900">High</option>
          <option value="medium" className="dark:bg-zinc-900">Medium</option>
          <option value="low" className="dark:bg-zinc-900">Low</option>
        </select>

        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "none" | "priority" | "due_date")}
          className="rounded-md border border-zinc-300 bg-transparent p-2 text-sm outline-none focus:border-purple-500 dark:border-zinc-800 dark:text-zinc-300"
        >
          <option value="none" className="dark:bg-zinc-900">No Sorting</option>
          <option value="priority" className="dark:bg-zinc-900">Sort by Priority</option>
          <option value="due_date" className="dark:bg-zinc-900">Sort by Due Date</option>
        </select>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
          {columns.map((col) => (
            <div key={col.id} className="snap-center">
              <DroppableColumn 
                column={col} 
                tasks={processedTasks.filter((t) => t.status === col.id)} 
                session={session}
                onRequestTaskDelete={requestTaskDelete}
                onEditTask={handleEditTask}
                onUpdateSubtasks={fetchTasks}
                onRequestColumnDelete={requestColumnDelete}
                onEditColumnTitle={handleEditColumnTitle}
              />
            </div>
          ))}
          
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
                  <FloatingInput label="Column Title" value={newColumnTitle} onChange={(e: any) => setNewColumnTitle(e.target.value)} />
                  <Button onClick={handleAddColumn} className="bg-purple-600 text-white hover:bg-purple-700">Add Column</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <TrashZone />
      </DndContext>
    </main>
  );
}