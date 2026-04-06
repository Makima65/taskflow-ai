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

      <div className="flex justify-center w-full mb-8">
        <BoardFilters 
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 pb-8 md:pb-12 snap-mandatory w-full justify-center md:items-start overflow-y-auto md:overflow-x-auto p-4 md:p-8 md:snap-x">
          
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
    </main>
  );
}