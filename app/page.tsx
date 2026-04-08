"use client";


import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { CustomConfirmModal } from "@/components/ui/CustomConfirmModal";
import { UserMenu } from "@/components/board/UserMenu";
import { AddFriendModal } from "@/components/modals/AddFriendModal"; // 👈 Imported your new component here!
import { NotificationsModal } from "@/components/modals/NotificationsModal";
import { WorkspaceCard } from "@/components/board/WorkspaceCard";
import { CreateWorkspaceCard } from "@/components/board/CreateWorkspaceCard";
import { ResetPasswordModal } from "@/components/modals/ResetPasswordModal";

interface Board {
  id: string;
  title: string;
  created_at: string;
}

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create Board State
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const router = useRouter();

  // Edit / Delete State
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Modal States
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Password Reset States
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("recovery")) {
      setIsResetPasswordOpen(true);
      setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname);
      }, 1000);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchBoards(session.user.id);
        fetchNotifications(session.user.id);
      } else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        fetchBoards(session.user.id);
        fetchNotifications(session.user.id);
      }
      
      if (event === "PASSWORD_RECOVERY") {
        setIsResetPasswordOpen(true);
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error("Failed to update password: " + error.message);
    } else {
      toast.success("Password updated successfully!");
      setIsResetPasswordOpen(false);
      setNewPassword("");
      router.replace("/");
    }
  };

  const fetchNotifications = async (userId: string) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      // ❌ I DELETED THE .EQ("TYPE") LINE HERE!
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setNotifications(data);
    }
  };

  const fetchBoards = async (userId: string) => {
    const { data: ownedBoards, error: ownedError } = await supabase
      .from("boards")
      .select("*")
      .eq("user_id", userId);

    const { data: sharedMemberships, error: sharedError } = await supabase
      .from("board_members")
      .select("board_id, boards(*)")
      .eq("user_id", userId)
      .eq("status", "accepted"); 

    if (ownedError || sharedError) {
      console.error("Error fetching boards", ownedError || sharedError);
      setIsLoading(false);
      return;
    }

    const sharedBoards = (sharedMemberships || [])
      .map((membership: any) => membership.boards)
      .filter((board) => board !== null) as Board[];

    const allBoards = [...(ownedBoards || []), ...sharedBoards];
    const uniqueBoards = Array.from(new Map(allBoards.map(b => [b.id, b])).values());
    uniqueBoards.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setBoards(uniqueBoards);
    setIsLoading(false);
  };

  const handleAcceptInvite = async (notifId: string, boardId: string) => {
    if (!session) return;
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    
    const { data, error: updateError } = await supabase
      .from("board_members")
      .update({ status: "accepted" })
      .eq("board_id", boardId)
      .eq("user_id", session.user.id)
      .select(); 
      
    if (updateError) {
      toast.error("Database Error: " + updateError.message);
      return; 
    }

    if (!data || data.length === 0) {
      toast.error("Update blocked! Check Supabase RLS policies or missing row.");
      return;
    }
    
    await supabase.from("notifications").delete().eq("id", notifId);
    
    toast.success("Workspace invite accepted!");
    fetchBoards(session.user.id);
  };

  const handleDeclineInvite = async (notifId: string, boardId: string) => {
    if (!session) return;
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));

    const { error } = await supabase
      .from("board_members")
      .delete()
      .eq("board_id", boardId)
      .eq("user_id", session.user.id);
      
    if (error) {
      toast.error("Failed to decline: " + error.message);
      return;
    }
    
    await supabase.from("notifications").delete().eq("id", notifId);
    toast.info("Workspace invite declined.");
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim() || !session) return;

    const { data, error } = await supabase
      .from("boards")
      .insert([{ user_id: session.user.id, title: newBoardTitle }])
      .select();

    if (!error && data) {
      setBoards([data[0], ...boards]);
      setNewBoardTitle("");
      setIsCreating(false);
      toast.success("Workspace created!");
    } else {
      toast.error("Failed to create workspace.");
    }
  };

  const handleRenameBoard = async (e: React.FormEvent, boardId: string) => {
    e.preventDefault();
    if (!editingTitle.trim() || !session) return;

    setBoards(boards.map(b => b.id === boardId ? { ...b, title: editingTitle } : b));
    setEditingBoardId(null);

    const { error } = await supabase
      .from("boards")
      .update({ title: editingTitle })
      .eq("id", boardId);

    if (error) {
      toast.error("Failed to rename workspace.");
      fetchBoards(session.user.id); 
    } else {
      toast.success("Workspace renamed!");
    }
  };

  const confirmDeleteBoard = (e: React.MouseEvent, board: Board) => {
    e.stopPropagation(); 
    setActiveMenuId(null); 
    setModalConfig({
      isOpen: true,
      title: "Delete Workspace?",
      description: `Are you sure you want to delete "${board.title}"? All columns and tasks inside it will be permanently lost.`,
      onConfirm: () => executeDeleteBoard(board.id),
    });
  };

  const executeDeleteBoard = async (boardId: string) => {
    setBoards(boards.filter(b => b.id !== boardId));
    setModalConfig(prev => ({ ...prev, isOpen: false }));

    const { error } = await supabase.from("boards").delete().eq("id", boardId);

    if (error) {
      toast.error("Failed to delete workspace.");
      if (session) fetchBoards(session.user.id); 
    } else {
      toast.success("Workspace deleted!");
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </main>
    );
  }

 if (!session) {
    return (
      <>
        <Toaster richColors position="bottom-right" />
        
        <ResetPasswordModal 
          isOpen={isResetPasswordOpen}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          onSubmit={handleUpdatePassword}
          onCancel={() => {
            setIsResetPasswordOpen(false);
            router.replace("/");
          }}
        />
        
        <AuthScreen />
      </>
    );
  }

return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 md:p-12 flex flex-col items-center">
      <Toaster richColors position="bottom-right" />

<NotificationsModal 
  isOpen={isNotificationsOpen}
  onClose={() => setIsNotificationsOpen(false)}
  notifications={notifications}
  onAccept={handleAcceptInvite}
  onDecline={handleDeclineInvite}
/>
      {/* 👇 Our newly imported Add Friend Modal component! */}
      <AddFriendModal 
        isOpen={isAddFriendOpen}
        onClose={() => setIsAddFriendOpen(false)}
        session={session}
      />
      
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">My Workspaces</h1>
          <UserMenu
            session={session}
            notifications={notifications}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenAddFriend={() => setIsAddFriendOpen(true)}
            onSignOut={() => supabase.auth.signOut()}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CreateWorkspaceCard 
  isCreating={isCreating}
  setIsCreating={setIsCreating}
  newBoardTitle={newBoardTitle}
  setNewBoardTitle={setNewBoardTitle}
  onSubmit={handleCreateBoard}
/>

      {/* ... your WorkspaceCard map ... */}
          {boards.map((board) => (
            <WorkspaceCard
              key={board.id}
              board={board}
              isEditing={editingBoardId === board.id}
              editingTitle={editingTitle}
              setEditingTitle={setEditingTitle}
              activeMenuId={activeMenuId}
              setActiveMenuId={setActiveMenuId}
              onRename={handleRenameBoard}
              onCancelEdit={() => setEditingBoardId(null)}
              onStartEdit={() => {
                setEditingTitle(board.title);
                setEditingBoardId(board.id);
              }}
              onDeleteClick={confirmDeleteBoard}
              onNavigate={() => {
                if (editingBoardId !== board.id) router.push(`/board/${board.id}`);
              }}
            />
          ))}
        </div> {/* Closes the grid */}
      </div> {/* Closes the max-w-5xl container */}
    </main> 
  );
}