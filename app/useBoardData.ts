import { useState, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { Task, Column } from "./types";
import { generateTaskWithAI } from "./actions";
import { supabase } from "@/lib/supabase";

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
  searchQuery: string;
  setSearchQuery: (query: string) => void;
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

export function useBoardData(session: Session | null, boardId: string): BoardDataReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
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
    if (session?.user && boardId) {
      fetchColumns();
      fetchTasks();
    } else {
      setTasks([]);
      setColumns([]);
      hasFetchedCols.current = false;
    }
  }, [session, boardId]);

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!session?.user || !boardId) return;

    const channel = supabase
      .channel(`realtime-board-${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `board_id=eq.${boardId}` },
        () => {
          // A task was added, moved, or deleted by someone! Refetching...
          fetchTasks();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "columns", filter: `board_id=eq.${boardId}` },
        () => {
          // A column was added, moved, or deleted by someone! Refetching...
          fetchColumns(true); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, boardId]);

  const fetchColumns = async (forceFetch = false) => {
    if (!session?.user || !boardId) return;
    
    if (!forceFetch && hasFetchedCols.current) return;
    hasFetchedCols.current = true;

    // 👇 Removed the .eq("user_id", session.user.id) filter so you fetch everyone's columns
    let { data, error } = await supabase
      .from("columns")
      .select("*")
      .eq("board_id", boardId) 
      .order('position');

    if (data?.length === 0) {
      const defaultCols = [
        { user_id: session.user.id, board_id: boardId, title: "To Do", position: 1 },
        { user_id: session.user.id, board_id: boardId, title: "In Progress", position: 2 },
        { user_id: session.user.id, board_id: boardId, title: "Done", position: 3 }
      ];
      const res = await supabase.from("columns").insert(defaultCols).select();
      data = res.data;
    }
    if (!error && data) setColumns(data);
  };

  const fetchTasks = async () => {
    if (!session?.user || !boardId) return;

    //  Removed the .eq("user_id", session.user.id) filter so you fetch everyone's tasks
    const { data, error } = await supabase
      .from("tasks")
      .select('*, subtasks(*)')
      .eq("board_id", boardId);

    if (!error) setTasks(data || []);
  };

  const logActivity = async (taskId: string, action: string, details: string) => {
    if (!session?.user) return;
    await supabase.from("task_history").insert([{ task_id: taskId, user_id: session.user.id, action, details }]);
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim() || !session?.user || !boardId) return;

    const newCol = { user_id: session.user.id, board_id: boardId, title: newColumnTitle, position: columns.length + 1 };
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
      fetchColumns(true);
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
    if (newTaskTitle.trim() === "" || columns.length === 0 || !session?.user || !boardId) return;

    const newTask = { title: newTaskTitle, status: columns[0].id, user_id: session.user.id, board_id: boardId };
    const { data, error } = await supabase.from("tasks").insert([newTask]).select();
    if (!error && data) {
      setTasks([...tasks, { ...data[0], subtasks: [] }]);
      setNewTaskTitle("");
      toast.success("Task added successfully!"); 
      await logActivity(data[0].id, "Created", "Task was created manually");
    }
  };

  const handleAITask = async () => {
    if (newTaskTitle.trim() === "" || columns.length === 0 || !session?.user || !boardId) return;
    setIsAILoading(true); 
    
    try {
      const aiResult = await generateTaskWithAI(newTaskTitle, new Date().toLocaleString());
      
      if (aiResult && aiResult.title) {
        const finalTask = { 
          title: aiResult.title,
          description: aiResult.description,
          priority: aiResult.priority,
          due_date: aiResult.due_date,
          status: columns[0].id, 
          user_id: session.user.id,
          board_id: boardId
        };
        
        const { data: taskData, error: taskError } = await supabase.from("tasks").insert([finalTask]).select();
        
        if (!taskError && taskData) {
          const newTask = taskData[0];
          let insertedSubtasks: any[] = [];

          if (aiResult.subtasks && aiResult.subtasks.length > 0) {
            const subtasksToInsert = aiResult.subtasks.map((subTitle: string) => ({
              task_id: newTask.id,
              user_id: session.user.id!,
              title: subTitle,
              is_completed: false
            }));

            const { data: subData, error: subError } = await supabase.from("subtasks").insert(subtasksToInsert).select();
            
            if (subError) console.error("Error inserting subtasks:", subError);
            if (subData) insertedSubtasks = subData;
          }

          setTasks([...tasks, { ...newTask, subtasks: insertedSubtasks }]);
          setNewTaskTitle(""); 
          toast.success("AI generated your task & subtasks!"); 
          await logActivity(newTask.id, "Generated", "Task and details were created by AI");
        } else {
            toast.error("Failed to save task.");
        }
      } else {
        toast.error("Failed to generate task with AI.");
      }
    } catch (error) {
        toast.error("An error occurred during AI generation.");
    } finally {
        setIsAILoading(false); 
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    
    if (activeType === "Column") {
      if (active.id === over.id) return;

      setColumns((prev) => {
        const activeIndex = prev.findIndex((col) => col.id === active.id);
        const overIndex = prev.findIndex((col) => col.id === over.id);
        
        const newColumns = arrayMove(prev, activeIndex, overIndex);
        
        const updateDatabasePositions = async () => {
          for (let i = 0; i < newColumns.length; i++) {
            await supabase
              .from("columns")
              .update({ position: i + 1 })
              .eq("id", newColumns[i].id);
          }
        };
        updateDatabasePositions();

        return newColumns;
      });
      return;
    }

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
    .filter((t) => {
      const matchesSearch = 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesPriority = filterPriority === "all" || t.priority === filterPriority;

      return matchesSearch && matchesPriority;
    })
    .sort((a, b) => {
      if (sortBy === "priority") {
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
    searchQuery,
    setSearchQuery,
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