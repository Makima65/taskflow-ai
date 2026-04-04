"use client";

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

type Task = {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
};

// ========================================================================
// 1. YOUR CUSTOM FLOATING INPUT COMPONENT
// Translated to Tailwind CSS so it perfectly matches your theme!
// ========================================================================
function FloatingInput({ label, type = "text", value, onChange }: { label: string, type?: string, value: string, onChange: (e: any) => void }) {
  return (
    <div className="relative my-2 w-full font-sans">
      <input
        type={type}
        required
        value={value}
        onChange={onChange}
        // 'peer' is Tailwind's magic word to link the input state to the label
        className="peer w-full rounded-[20px] border-2 border-zinc-200 bg-transparent p-3 text-base outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:focus:border-zinc-400"
      />
      <label
        className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-white px-1 text-zinc-500 transition-all duration-300 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-90 peer-focus:text-zinc-700 dark:bg-zinc-950 dark:peer-focus:text-zinc-300 ${
          value ? "top-0 -translate-y-1/2 scale-90 text-zinc-700 dark:text-zinc-300" : ""
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
function DraggableTaskCard({ task, onDelete }: { task: Task; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing z-10 relative group">
      <Card className="relative">
        <CardHeader className="p-4 pr-10">
          <CardTitle className="text-md">{task.title}</CardTitle>
        </CardHeader>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={() => onDelete(task.id)}
        >
          ✕
        </Button>
      </Card>
    </div>
  );
}

function DroppableColumn({ id, title, tasks, onDelete }: { id: string; title: string; tasks: Task[]; onDelete: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: id });
  return (
    <div ref={setNodeRef} className={`flex flex-col gap-4 rounded-xl p-4 transition-colors ${isOver ? "bg-zinc-200 dark:bg-zinc-800" : "bg-zinc-100 dark:bg-zinc-900"}`}>
      <h2 className="font-semibold text-zinc-700 dark:text-zinc-300">{title}</h2>
      {tasks.map((task) => (
        <DraggableTaskCard key={task.id} task={task} onDelete={onDelete} />
      ))}
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

  // Custom Auth States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");

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

  // Custom Auth Handler
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
      else alert("Check your email to confirm your account!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
    }
  };

  const handleAddTask = async () => {
    if (newTaskTitle.trim() === "") return;
    const newTask = { title: newTaskTitle, status: "todo", user_id: session.user.id };
    const { data, error } = await supabase.from("tasks").insert([newTask]).select();
    if (!error && data) {
      setTasks([...tasks, data[0]]);
      setNewTaskTitle("");
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
      }
    } else {
      alert("Whoops! The AI got confused. Try again.");
    }
    setIsAILoading(false); 
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as "todo" | "in-progress" | "done";

    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove || taskToMove.status === newStatus) return;

    setTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, status: newStatus } : task));
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) console.error("Error deleting task:", error);
  };

  // ========================================================================
  // 4. THE CUSTOM LOGIN SCREEN
  // ========================================================================
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
        <Card className="w-full max-w-sm p-8 shadow-lg">
          <h1 className="mb-6 text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            TaskFlow AI
          </h1>
          
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <FloatingInput 
              label="Email Address" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <FloatingInput 
              label="Password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            
            {authError && <p className="text-sm text-red-500">{authError}</p>}
            
            <Button type="submit" className="mt-2 w-full rounded-[20px]">
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)} 
              className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 underline"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // ========================================================================
  // 5. THE MAIN APP BOARD
  // ========================================================================
  return (
    <main className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-950">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">TaskFlow AI</h1>

        <div className="flex items-center gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>+ Add Task</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Brain-dump your task</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-6 py-4">
                {/* WE INJECTED YOUR CUSTOM INPUT HERE TOO! */}
                <FloatingInput 
                  label="What do you need to do?" 
                  value={newTaskTitle} 
                  onChange={(e) => setNewTaskTitle(e.target.value)} 
                />
                
                <div className="flex gap-2">
                  <Button variant="outline" className="w-1/2" onClick={handleAddTask}>
                    Normal Save
                  </Button>
                  <Button className="w-1/2" onClick={handleAITask} disabled={isAILoading}>
                    {isAILoading ? "Thinking..." : "✨ AI Magic"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
            Sign Out
          </Button>
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <DroppableColumn id="todo" title="To Do" tasks={tasks.filter((t) => t.status === "todo")} onDelete={handleDeleteTask} />
          <DroppableColumn id="in-progress" title="In Progress" tasks={tasks.filter((t) => t.status === "in-progress")} onDelete={handleDeleteTask} />
          <DroppableColumn id="done" title="Done" tasks={tasks.filter((t) => t.status === "done")} onDelete={handleDeleteTask} />
        </div>
      </DndContext>
    </main>
  );
}