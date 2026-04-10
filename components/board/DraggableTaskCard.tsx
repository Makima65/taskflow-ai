import { useState, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FancyEditButton, FancyDeleteButton } from "@/components/ui/FancyButtons";
import { AnimatedCheckbox } from "@/components/ui/AnimatedCheckbox";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { getRelativeTime } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Subtask } from "@/app/types";

export function DraggableTaskCard({ task, session, onRequestDelete, onEdit, onUpdateSubtasks, columnTitle }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "history">("edit");
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [newSubtask, setNewSubtask] = useState("");
  
  // 👇 Added state for editing existing subtasks 👇
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority || "medium",
    due_date: task.due_date || "",
  });

  const completedSubtasks = task.subtasks?.filter((s:any) => s.is_completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const isOverdue = 
    task.due_date && 
    new Date(task.due_date).getTime() < new Date().getTime() && 
    columnTitle?.toLowerCase() !== "done";

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

  // 👇 Added function to handle saving an edited subtask 👇
  const saveSubtaskEdit = async (id: string) => {
    if (!editingSubtaskTitle.trim()) return;
    await supabase.from("subtasks").update({ title: editingSubtaskTitle }).eq("id", id);
    setEditingSubtaskId(null);
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

  const renderDueDate = (dateString: string) => {
    if (!dateString) return "";
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) {
      return dateString; 
    }
    return parsedDate.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`touch-none z-10 relative group/card ${!isEditing ? "cursor-grab active:cursor-grabbing" : ""}`}>
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
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-md border flex items-center gap-1 ${
                  isOverdue 
                    ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800" 
                    : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                }`}>
                  {isOverdue ? "⚠️" : "🗓"} {renderDueDate(task.due_date)}
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

          {/* Card-level Edit/Delete buttons visible on mobile, hover on desktop */}
          <div className="absolute top-3 right-3 flex gap-2 opacity-100 lg:opacity-0 transition-opacity lg:group-hover/card:opacity-100 z-20">
            <FancyEditButton onClick={() => setIsEditing(true)} />
            <FancyDeleteButton onClick={() => onRequestDelete(task.id)} />
          </div>
        </Card>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
         <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
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
                    {isPreviewMode ? "Edit Markdown" : "Preview"}
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
                    <div key={subtask.id} className="flex items-center justify-between group/sub w-full min-h-[32px]">
                      
                      {/* 👇 Inline Editing UI 👇 */}
                      {editingSubtaskId === subtask.id ? (
                        <div className="flex w-full gap-2 items-center">
                          <input 
                            autoFocus
                            value={editingSubtaskTitle}
                            onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveSubtaskEdit(subtask.id);
                              if (e.key === 'Escape') setEditingSubtaskId(null);
                            }}
                            className="flex-1 rounded-md border border-zinc-300 bg-transparent p-1 px-2 outline-none focus:border-purple-500 dark:border-zinc-700 dark:text-white text-sm"
                          />
                          <button onClick={() => saveSubtaskEdit(subtask.id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-md dark:hover:bg-green-900/20 text-xs">✓</button>
                          <button onClick={() => setEditingSubtaskId(null)} className="text-zinc-500 hover:bg-zinc-100 p-1.5 rounded-md dark:hover:bg-zinc-800 text-xs">✕</button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 truncate pr-2">
                            <AnimatedCheckbox 
                              id={subtask.id}
                              checked={subtask.is_completed}
                              onChange={() => toggleSubtask(subtask)}
                              label={subtask.title}
                            />
                          </div>
                          
                          {/* 👇 Opacity classes updated for mobile visibility 👇 */}
                          <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover/sub:opacity-100 transition-opacity shrink-0">
                            <button 
                              onClick={() => {
                                setEditingSubtaskId(subtask.id);
                                setEditingSubtaskTitle(subtask.title);
                              }} 
                              className="text-blue-500 text-xs p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
                              aria-label="Edit subtask"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => deleteSubtask(subtask.id)} 
                              className="text-red-500 text-xs p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                              aria-label="Delete subtask"
                            >
                              ✕
                            </button>
                          </div>
                        </>
                      )}
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
                  <input type="datetime-local" value={editForm.due_date} onChange={(e) => setEditForm({...editForm, due_date: e.target.value})} className="w-full rounded-md border border-zinc-300 bg-transparent p-2 outline-none focus:border-purple-500 dark:border-zinc-700 dark:text-white dark:[color-scheme:dark]" />
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