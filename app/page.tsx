"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

// 1. We added the 'onDelete' prop here
function DraggableTaskCard({ task, onDelete }: { task: Task; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing z-10 relative group">
      <Card className="relative">
        <CardHeader className="p-4 pr-10"> {/* Added right padding so text doesn't hit the button */}
          <CardTitle className="text-md">{task.title}</CardTitle>
        </CardHeader>
        
        {/* 2. The Delete Button */}
        <Button
          variant="ghost"
          size="sm"
          // It stays invisible (opacity-0) until you hover over the card (group-hover:opacity-100)
          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
          // We MUST stop propagation, otherwise clicking the button picks up the card to drag it!
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={() => onDelete(task.id)}
        >
          ✕
        </Button>
      </Card>
    </div>
  );
}

// 3. We added 'onDelete' here so the column can pass it to the cards
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

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAILoading, setIsAILoading] = useState(false); 

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase.from("tasks").select("*");
    if (!error) setTasks(data || []);
  };

  const handleAddTask = async () => {
    if (newTaskTitle.trim() === "") return;
    const newTask = { title: newTaskTitle, status: "todo" };
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
      const { data, error } = await supabase.from("tasks").insert([aiResult]).select();
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

  // 4. The actual Delete Function
  const handleDeleteTask = async (taskId: string) => {
    // Instantly remove it from the screen (Optimistic UI)
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    
    // Silently delete it from Supabase in the background
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-950">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">TaskFlow AI</h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button>+ Add Task</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Brain-dump your task</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <Input
                placeholder="e.g., I need to finish that giant report for Sarah tomorrow..."
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