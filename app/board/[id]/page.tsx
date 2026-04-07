"use client";

import { Session } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  DndContext, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  TouchSensor 
} from "@dnd-kit/core";
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
import { useBoardData } from "../../useBoardData";

export default function BoardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [activeView, setActiveView] = useState<"board" | "calendar">("board");

  // 👇 Share Modal State 👇
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;

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
  } = useBoardData(session, boardId);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Successfully signed out!");
  };

  // 👇 Handle Inviting User 👇
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);

    // Call the secure Postgres function we created earlier
    const { error } = await supabase.rpc("add_board_member_by_email", {
      p_board_id: boardId,
      p_email: inviteEmail.toLowerCase().trim(),
    });

    if (error) {
      if (error.message.includes("No account found")) {
        toast.error("No user found with that email. Make sure they have signed up!");
      } else {
        toast.error("Failed to invite user.");
        console.error(error);
      }
    } else {
      toast.success("User invited successfully!");
      setInviteEmail("");
      setIsShareModalOpen(false);
    }
    
    setIsInviting(false);
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
    <main className="min-h-screen bg-zinc-50 p-8 md:p-12 dark:bg-zinc-950 flex flex-col items-center relative">
      <Toaster richColors position="bottom-right" /> 
      
      <CustomConfirmModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        description={modalConfig.description}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
      />

      {/* 👇 Share Modal Overlay 👇 */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Share Workspace</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Enter your friend's email address to invite them to this board. They must have an existing account.
            </p>

            <form onSubmit={handleInviteUser} className="flex flex-col gap-4">
              <input
                autoFocus
                type="email"
                placeholder="friend@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-500"
                required
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  disabled={isInviting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isInviting ? "Inviting..." : "Invite User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 👇 Top Navigation Bar 👇 */}
      <div className="w-full flex justify-between items-center mb-6 max-w-[1600px]">
        <button 
          onClick={() => router.push("/")}
          className="text-sm font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm transition-all flex items-center gap-2"
        >
          🔙 Back to Workspaces
        </button>

        <button 
          onClick={() => setIsShareModalOpen(true)}
          className="text-sm font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 px-4 py-2 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors flex items-center gap-2 shadow-sm"
        >
          🤝 Share Workspace
        </button>
      </div>

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