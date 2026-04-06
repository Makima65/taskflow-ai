import { useState, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { DragEndEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import { Task, Column } from "./types";
import { generateTaskWithAI } from "./actions";
import { supabase } from "@/lib/supabase";

// 1. We tell TypeScript EXACTLY what this hook will return
export interface BoardDataReturn {
  columns: Column[];
  tasks: Task[];
  processedTasks: Task[];
  trashedTasks: Task[];
  newTaskTitle: string;
  setNewTaskTitle: (title: string) => void;
  newColumnTitle: string;
  setNewColumnTitle: (title: string) => void;
  isAILoading: boolean;
  filterPriority: "all" | "high" | "medium" | "low";
  setFilterPriority: (val: "all" | "high" | "medium" | "low") => void;
  sortBy: "none" | "priority" | "due_date";
  setSortBy: (val: "none" | "priority" | "due_date") => void;
  modalConfig: { isOpen: boolean; title: string; description: string; onConfirm: () => void };
  setModalConfig: (config: { isOpen: boolean; title: string; description: string; onConfirm: () => void }) => void;
  handleAddTask: () => Promise<void>;
  handleAddColumn: () => Promise<void>;
  handleAITask: () => Promise<void>;
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
  handleEditTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  handleEditColumnTitle: (columnId: string, newTitle: string) => Promise<void>;
  requestTaskDelete: (taskId: string) => void;
  requestColumnDelete: (column: Column) => void;
  executeRestoreTask: (taskId: string) => Promise<void>;
  executeHardDeleteTask: (taskId: string) => Promise<void>;
  fetchTasks: () => Promise<void>;
}

// 2. We apply that interface to the function
export function useBoardData(session: Session | null): BoardDataReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);

  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all");
  const [sortBy, setSortBy] = useState<"none" | "priority" | "due_date">("none");

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {}
  });

  const hasFetchedCols = useRef(false);

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
    // 1. Add this guard clause right here:
    if (!session?.user) return;
    
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
    // 2. And add the same guard clause here:
    if (!session?.user) return;

    const { data, error } = await supabase.from("tasks").select('*, subtasks(*)').eq("user_id", session.user.id);
    if (!error) setTasks(data || []);
  };

  const logActivity = async (taskId: string, action: string, details: string) => {
    if (!session?.user) return;
    await supabase.from("task_history").insert([{ task_id: taskId, user_id: session.user.id, action, details }]);
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim() || !session?.user) return;
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
      onConfirm: () => { executeDeleteColumn(column.id); }
    });
  };

  const handleAddTask = async () => {
    if (newTaskTitle.trim() === "" || columns.length === 0 || !session?.user) return;
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
    if (newTaskTitle.trim() === "" || columns.length === 0 || !session?.user) return;
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
      executeSoftDeleteTask(taskId);
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

  const executeSoftDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, is_trashed: true } : task));
    const { error } = await supabase.from("tasks").update({ is_trashed: true }).eq("id", taskId);
    if (!error) toast.info("Task moved to trash 🗑️"); 
  };

  const executeHardDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (!error) toast.success("Task permanently deleted"); 
  };

  const executeRestoreTask = async (taskId: string) => {
    setTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, is_trashed: false } : task));
    const { error } = await supabase.from("tasks").update({ is_trashed: false }).eq("id", taskId);
    if (!error) toast.success("Task restored! ♻️"); 
  };

  const requestTaskDelete = (taskId: string) => {
    setModalConfig({
      isOpen: true,
      title: "Move to Trash?",
      description: "Are you sure you want to remove this task? You can restore it later from the Trash Bin.",
      onConfirm: () => { executeSoftDeleteTask(taskId); }
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

  const trashedTasks = tasks.filter(t => t.is_trashed);
  const activeTasks = tasks.filter(t => !t.is_trashed);

  const processedTasks = activeTasks
    .filter(t => filterPriority === "all" || t.priority === filterPriority)
    .sort((a, b) => {
      if (sortBy === "priority") {
        // Replaced 'any' with a strict Record type here
        const pWeight: Record<string, number> = { high: 3, medium: 2, low: 1, undefined: 0 };
        return (pWeight[b.priority || "medium"] || 0) - (pWeight[a.priority || "medium"] || 0);
      }
      if (sortBy === "due_date") {
        if (!a.due_date) return 1; 
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return 0; 
    });

  return {
    columns,
    tasks,
    processedTasks,
    trashedTasks,
    newTaskTitle,
    setNewTaskTitle,
    newColumnTitle,
    setNewColumnTitle,
    isAILoading,
    filterPriority,
    setFilterPriority,
    sortBy,
    setSortBy,
    modalConfig,
    setModalConfig,
    handleAddTask,
    handleAddColumn,
    handleAITask,
    handleDragEnd,
    handleEditTask,
    handleEditColumnTitle,
    requestTaskDelete,
    requestColumnDelete,
    executeRestoreTask,
    executeHardDeleteTask,
    fetchTasks,
  };
}