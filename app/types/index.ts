// types/index.ts

export type Subtask = { 
  id: string; 
  title: string; 
  is_completed: boolean; 
  task_id: string 
};

export type Column = { 
  id: string; 
  title: string; 
  position: number 
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string; 
  priority?: "high" | "medium" | "low";
  due_date?: string | null;
  created_at?: string;
  subtasks?: Subtask[]; 
  is_trashed?: boolean; 
};