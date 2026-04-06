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
import { Toaster, toast } from "sonner";

// Components
import { BoardHeader } from "@/components/board/BoardHeader";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { DroppableColumn } from "@/components/board/DroppableColumn";
import { TrashZone } from "@/components/board/TrashZone";
import { AddColumnModal } from "@/components/board/AddColumnModal";
import { CustomConfirmModal } from "@/components/ui/CustomConfirmModal";
import { BoardFilters } from "@/components/board/BoardFilters";

// Custom Hook
import { useBoardData } from "./useBoardData";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);

  // Handle Authentication State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Load all of our board logic from the custom hook!
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
        distance: 5, // 5px movement required before dragging starts on mouse
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Require finger to hold for 250ms before picking up the task
        tolerance: 5,
      },
    })
  );

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-950">
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

      <BoardFilters 
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory">
          {columns.map((col) => (
            <div key={col.id} className="snap-center shrink-0 w-[85vw] md:w-80">
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
          
          <div className="shrink-0 w-[85vw] md:w-80 snap-center">
            <AddColumnModal 
              newColumnTitle={newColumnTitle}
              setNewColumnTitle={setNewColumnTitle}
              onAddColumn={handleAddColumn}
            />
          </div>
        </div>
        
        <TrashZone />
      </DndContext>
    </main>
  );
}