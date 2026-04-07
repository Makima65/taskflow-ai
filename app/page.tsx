"use client";

import { Session } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  DndContext, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  TouchSensor 
} from "@dnd-kit/core";
// 👇 Added imports for Sortable Columns 👇
import { 
  SortableContext, 
  horizontalListSortingStrategy 
} from "@dnd-kit/sortable";
import { Toaster, toast } from "sonner";

// Components
import { BoardHeader } from "@/components/board/BoardHeader";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { DroppableColumn } from "@/components/board/DroppableColumn";
import { TrashZone } from "@/components/board/TrashZone";
import { AddColumnModal } from "@/components/board/AddColumnModal";
import { CustomConfirmModal } from "@/components/ui/CustomConfirmModal";
import { BoardFilters } from "@/components/board/BoardFilters";
import { CalendarView } from "@/components/board/CalendarView";

// Custom Hook
import { useBoardData } from "./useBoardData";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [activeView, setActiveView] = useState<"board" | "calendar">("board");

  // Handle Authentication State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsSessionLoading(false); 
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsSessionLoading(false); 
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Load all of our board logic from the custom hook
  const {
    columns,
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
    searchQuery,
    setSearchQuery,
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
  } = useBoardData(session);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Successfully signed out!");
  };

  // Configure dnd-kit sensors for mobile dragging vs scrolling
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  if (isSessionLoading) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </main>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-8 md:p-12 dark:bg-zinc-950 flex flex-col items-center">
      <Toaster richColors position="bottom-right" /> 
      
      <CustomConfirmModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        description={modalConfig.description}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
      />

      <BoardHeader 
        trashedTasks={trashedTasks}
        onRestoreTask={executeRestoreTask}
        onHardDeleteTask={executeHardDeleteTask}
        newTaskTitle={newTaskTitle}
        setNewTaskTitle={setNewTaskTitle}
        onAddTask={handleAddTask}
        onAITask={handleAITask}
        isAILoading={isAILoading}
        onSignOut={handleSignOut}
      />

      <div className="flex flex-col md:flex-row justify-center items-center w-full mb-8 gap-4">
        <div className="flex bg-zinc-200 dark:bg-zinc-800 p-1 rounded-lg">
          <button 
            onClick={() => setActiveView("board")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeView === "board" ? "bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
          >
            Board
          </button>
          <button 
            onClick={() => setActiveView("calendar")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeView === "calendar" ? "bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
          >
            Calendar
          </button>
        </div>

        <BoardFilters 
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
          sortBy={sortBy}
          setSortBy={setSortBy}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>

      {activeView === "board" ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 pb-8 md:pb-12 snap-mandatory w-full justify-center md:items-start overflow-y-auto md:overflow-x-auto p-4 md:p-8 md:snap-x">
            
            {/* 👇 Wrap columns in SortableContext 👇 */}
            <SortableContext 
              items={columns.map(col => col.id)} 
              strategy={horizontalListSortingStrategy}
            >
              {columns.map((col) => (
                <div 
                  key={col.id} 
                  className="snap-start md:snap-center shrink-0 w-full md:w-80"
                >
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
            </SortableContext>
            
            <div className="shrink-0 snap-start md:snap-center w-full md:w-80">
              <AddColumnModal 
                newColumnTitle={newColumnTitle}
                setNewColumnTitle={setNewColumnTitle}
                onAddColumn={handleAddColumn}
              />
            </div>

          </div>
          
          <TrashZone />
        </DndContext>
      ) : (
        <div className="w-full pb-12">
          {/* 👇 Filter out orphaned tasks to fix the ghost bug 👇 */}
          <CalendarView 
            tasks={processedTasks.filter(task => 
              columns.some(col => col.id === task.status)
            )} 
          />
        </div>
      )}
    </main>
  );
}