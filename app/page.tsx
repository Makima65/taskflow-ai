"use client";

import ThemeToggle from "./ThemeToggle";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { generateTaskWithAI } from "./actions";
import { Toaster, toast } from "sonner";

type Task = {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  priority?: "high" | "medium" | "low";
  due_date?: string | null;
};

// ========================================================================
// 1. FLOATING INPUT 
// ========================================================================
function FloatingInput({ label, type = "text", value, onChange }: { label: string, type?: string, value: string, onChange: (e: any) => void }) {
  const hasText = value.length > 0;

  return (
    <div className="relative my-2 w-full font-sans">
      <input
        type={type}
        required
        value={value}
        onChange={onChange}
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

// ========================================================================
// 2. TASK CARDS & COLUMNS
// ========================================================================

function FancyEditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()} // Prevents dragging when clicking the button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="group relative flex h-8 w-[85px] items-center justify-start rounded-lg border-none bg-[rgb(168,38,255)] px-4 text-xs font-medium text-white shadow-[4px_4px_0px_rgb(140,32,212)] transition-all duration-300 hover:text-transparent active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0px_rgb(140,32,212)]"
    >
      Edit
      <svg
        className="absolute right-4 w-[11px] fill-white transition-all duration-300 group-hover:right-[40%]"
        viewBox="0 0 512 512"
      >
        <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
      </svg>
    </button>
  );
}

function DraggableTaskCard({ task, onDelete, onEdit }: { task: Task; onDelete: (id: string) => void; onEdit: (id: string, newTitle: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  // We disable dragging while editing so you can highlight text properly!
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ 
    id: task.id,
    disabled: isEditing 
  });
  
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  const priorityColor = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
  }[task.priority || "medium"];

  const handleSave = () => {
    onEdit(task.id, editTitle);
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`z-10 relative group ${!isEditing ? "cursor-grab active:cursor-grabbing" : ""}`}>
      <Card className="relative border-l-4 border-l-purple-600 dark:border-l-purple-500">
        <CardHeader className="p-4 pr-16">
          
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <input 
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="w-full rounded-md border border-purple-500 bg-transparent p-1 text-md outline-none dark:text-zinc-50"
              />
              <div className="flex gap-2">
                <Button size="sm" className="h-6 text-xs bg-purple-600 text-white" onClick={handleSave}>Save</Button>
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <CardTitle className="text-md font-medium leading-snug">{task.title}</CardTitle>
          )}
          
          {!isEditing && (
            <div className="flex flex-wrap gap-2 mt-3">
              {task.priority && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${priorityColor}`}>
                  {task.priority.toUpperCase()}
                </span>
              )}
              {task.due_date && (
                <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 flex items-center gap-1">
                  🗓 {task.due_date}
                </span>
              )}
            </div>
          )}

        </CardHeader>

        {/* Edit and Delete Buttons (Hidden until hover) */}
        {!isEditing && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            
            {/* ✨ YOUR NEW BUTTON IS HERE */}
            <FancyEditButton onClick={() => setIsEditing(true)} />

            <Button
              variant="ghost" size="sm"
              className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
              onPointerDown={(e) => e.stopPropagation()} 
              onClick={() => onDelete(task.id)}
            >
              ✕
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function DroppableColumn({ id, title, tasks, onDelete, onEdit }: { id: string; title: string; tasks: Task[]; onDelete: (id: string) => void; onEdit: (id: string, newTitle: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: id });
  return (
    <div ref={setNodeRef} className={`flex flex-col gap-4 rounded-xl p-4 transition-colors ${isOver ? "bg-purple-100/50 dark:bg-purple-900/20" : "bg-zinc-100 dark:bg-zinc-800/50"}`}>
      <h2 className="font-semibold text-zinc-700 dark:text-zinc-300">{title}</h2>
      {tasks.map((task) => (
        <DraggableTaskCard key={task.id} task={task} onDelete={onDelete} onEdit={onEdit} />
      ))}
    </div>
  );
}

function TrashZone() {
  const { setNodeRef, isOver } = useDroppable({ id: "trash" });
  
  return (
    <div 
      ref={setNodeRef} 
      className={`mt-8 flex h-20 w-full items-center justify-center rounded-xl border-2 border-dashed transition-all ${
        isOver 
          ? "border-red-500 bg-red-100 text-red-600 dark:border-red-500 dark:bg-red-900/30 dark:text-red-400" 
          : "border-zinc-300 text-zinc-400 dark:border-zinc-800"
      }`}
    >
      <span className="text-lg font-bold tracking-wide">🗑️ Drop here to delete</span>
    </div>
  );
}
// ========================================================================
// 3. MAIN APP
// ========================================================================
export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAILoading, setIsAILoading] = useState(false); 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [session]);

  const fetchTasks = async () => {
    const { data, error } = await supabase.from("tasks").select("*").eq("user_id", session.user.id);
    if (!error) setTasks(data || []);
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

  const handleAddTask = async () => {
    if (newTaskTitle.trim() === "") return;
    const newTask = { title: newTaskTitle, status: "todo", user_id: session.user.id };
    const { data, error } = await supabase.from("tasks").insert([newTask]).select();
    if (!error && data) {
      setTasks([...tasks, data[0]]);
      setNewTaskTitle("");
      toast.success("Task added successfully!"); 
    } else {
      toast.error("Failed to add task.");
    }
  };

  const handleAITask = async () => {
    if (newTaskTitle.trim() === "") return;
    setIsAILoading(true); 
    const aiResult = await generateTaskWithAI(newTaskTitle);
    
    if (aiResult && aiResult.title) {
      const finalTask = { ...aiResult, user_id: session.user.id };
      const { data, error } = await supabase.from("tasks").insert([finalTask]).select();
      if (!error && data) {
        setTasks([...tasks, data[0]]);
        setNewTaskTitle(""); 
        toast.success("AI generated your task!"); 
      }
    } else {
      toast.error("Whoops! The AI got confused. Try again."); 
    }
    setIsAILoading(false); 
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;

    // ✨ NEW: If dropped in the trash, delete it and stop!
    if (over.id === "trash") {
      handleDeleteTask(taskId);
      return;
    }

    const newStatus = over.id as "todo" | "in-progress" | "done";

    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove || taskToMove.status === newStatus) return;

    setTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, status: newStatus } : task));
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) {
      toast.error("Failed to delete task");
    } else {
      toast.info("Task moved to trash"); 
    }
  };

  const handleEditTask = async (taskId: string, newTitle: string) => {
    if (newTitle.trim() === "") return;
    
    // Update the UI instantly
    setTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, title: newTitle } : task));
    
    // Save to database behind the scenes
    const { error } = await supabase.from("tasks").update({ title: newTitle }).eq("id", taskId);
    if (error) {
      toast.error("Failed to update task");
    }
  };
  
  const handleForgotPassword = () => {
    toast.info("Password reset coming soon!"); 
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Successfully signed out!");
  };

  // ========================================================================
  // 4. THE LOGIN SCREEN
  // ========================================================================
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950 relative">
        <Toaster richColors position="bottom-center" /> 
        
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="w-[350px] bg-white dark:bg-zinc-900 shadow-[0px_5px_15px_rgba(0,0,0,0.35)] dark:shadow-[0px_5px_15px_rgba(0,0,0,0.8)] rounded-[10px] box-border p-[20px_30px]">
          <h1 className="text-center font-sans mt-[10px] mb-[30px] text-[28px] font-extrabold text-zinc-900 dark:text-zinc-50">
            {isSignUp ? "Create Account" : "Welcome back"}
          </h1>
          
          <form onSubmit={handleAuth} className="w-full flex flex-col gap-[18px] mb-[15px]">
            <FloatingInput label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            
            <div>
              <FloatingInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              {!isSignUp && (
                <p className="underline m-0 text-right text-[#747474] decoration-[#747474]">
                  <span onClick={handleForgotPassword} className="cursor-pointer font-sans text-[11px] font-bold hover:text-black dark:hover:text-white transition-colors">
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

          <div className="w-full flex flex-col justify-start mt-[20px] gap-[15px]">
            <div className="rounded-[20px] box-border px-[15px] py-[10px] shadow-[0px_10px_36px_0px_rgba(0,0,0,0.16),0px_0px_0px_1px_rgba(0,0,0,0.06)] cursor-pointer flex justify-center items-center font-sans text-[12px] gap-[8px] bg-black text-white border-2 border-black hover:bg-zinc-800 transition-colors">
              <svg stroke="currentColor" fill="currentColor" strokeWidth={0} className="text-[18px] mb-[1px]" viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M747.4 535.7c-.4-68.2 30.5-119.6 92.9-157.5-34.9-50-87.7-77.5-157.3-82.8-65.9-5.2-138 38.4-164.4 38.4-27.9 0-91.7-36.6-141.9-36.6C273.1 298.8 163 379.8 163 544.6c0 48.7 8.9 99 26.7 150.8 23.8 68.2 109.6 235.3 199.1 232.6 46.8-1.1 79.9-33.2 140.8-33.2 59.1 0 89.7 33.2 141.9 33.2 90.3-1.3 167.9-153.2 190.5-221.6-121.1-57.1-114.6-167.2-114.6-170.7zm-105.1-305c50.7-60.2 46.1-115 44.6-134.7-44.8 2.6-96.6 30.5-126.1 64.8-32.5 36.8-51.6 82.3-47.5 133.6 48.4 3.7 92.6-21.2 129-63.7z" />
              </svg>
              <span className="font-semibold">Log in with Apple</span>
            </div>
            <div className="rounded-[20px] box-border px-[15px] py-[10px] shadow-[0px_10px_36px_0px_rgba(0,0,0,0.16)] cursor-pointer flex justify-center items-center font-sans text-[12px] gap-[8px] bg-white text-zinc-800 border-2 border-zinc-200 hover:bg-zinc-50 transition-colors">
              <svg stroke="currentColor" fill="currentColor" strokeWidth={0} version="1.1" x="0px" y="0px" className="text-[18px] mb-[1px]" viewBox="0 0 48 48" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              <span className="font-semibold">Log in with Google</span>
            </div>
          </div>
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

      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              </DialogHeader>
              <div className="flex flex-col gap-6 py-4">
                <FloatingInput label="What do you need to do?" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} />
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

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <DroppableColumn 
            id="todo" 
            title="To Do" 
            tasks={tasks.filter((t) => t.status === "todo")} 
            onDelete={handleDeleteTask} 
            onEdit={handleEditTask} // ✨ Added this!
          />
          <DroppableColumn 
            id="in-progress" 
            title="In Progress" 
            tasks={tasks.filter((t) => t.status === "in-progress")} 
            onDelete={handleDeleteTask} 
            onEdit={handleEditTask} // ✨ Added this!
          />
          <DroppableColumn 
            id="done" 
            title="Done" 
            tasks={tasks.filter((t) => t.status === "done")} 
            onDelete={handleDeleteTask} 
            onEdit={handleEditTask} // ✨ Added this!
          />
        </div>
        
        {/* ✨ NEW: Render the drop zone */}
        <TrashZone />
      </DndContext>
    </main>
  );
}