"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { CustomConfirmModal } from "@/components/ui/CustomConfirmModal";
import { UserMenu } from "@/components/board/UserMenu";

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
      .eq("type", "workspace_invite")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setNotifications(data);
    }
  };

  const fetchBoards = async (userId: string) => {
    // 1. Fetch boards you created
    const { data: ownedBoards, error: ownedError } = await supabase
      .from("boards")
      .select("*")
      .eq("user_id", userId);

    // 2. Fetch boards shared with you (ONLY ACCEPTED ONES)
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

  // 👇 UPDATED: Added .select() and 0-rows check to catch silent failures
  const handleAcceptInvite = async (notifId: string, boardId: string) => {
    if (!session) return;
    
    const { data, error: updateError } = await supabase
      .from("board_members")
      .update({ status: "accepted" })
      .eq("board_id", boardId)
      .eq("user_id", session.user.id)
      .select(); 
      
    if (updateError) {
      toast.error("Database Error: " + updateError.message);
      console.error("Update failed:", updateError);
      return; 
    }

    // This catches RLS issues or missing rows!
    if (!data || data.length === 0) {
      toast.error("Update blocked! Check Supabase RLS policies or missing row.");
      console.error("0 rows updated. The row either doesn't exist or RLS blocked it.");
      return;
    }
    
    // 2. Clear the notification
    const { error: deleteError } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notifId);

    if (deleteError) {
      console.error("Failed to delete notification:", deleteError);
    }
    
    toast.success("Workspace invite accepted!");
    fetchBoards(session.user.id);
    fetchNotifications(session.user.id);
  };

  const handleDeclineInvite = async (notifId: string, boardId: string) => {
    if (!session) return;

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
    fetchNotifications(session.user.id);
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
        
        {isResetPasswordOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Reset Password</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Please enter your new password below to secure your account.</p>
              <form onSubmit={handleUpdatePassword}>
                <input 
                  autoFocus
                  type="password" 
                  placeholder="New Password (min 6 chars)" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-500 mb-6"
                  required
                />
                <div className="flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsResetPasswordOpen(false);
                      router.replace("/");
                    }}
                    className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        <AuthScreen />
      </>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 md:p-12 flex flex-col items-center">
      <Toaster richColors position="bottom-right" />
      
      <CustomConfirmModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        description={modalConfig.description}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
      />

      {isResetPasswordOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Reset Password</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Please enter your new password below to secure your account.</p>
            <form onSubmit={handleUpdatePassword}>
              <input 
                autoFocus
                type="password" 
                placeholder="New Password (min 6 chars)" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-500 mb-6"
                required
              />
              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsResetPasswordOpen(false);
                    router.replace("/");
                  }}
                  className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Notifications</h2>
            
            <div className="max-h-72 overflow-y-auto pr-2">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  <p>No new notifications.</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className="p-4 mb-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800 flex flex-col gap-3">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      {notif.message}
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => handleAcceptInvite(notif.id, notif.board_id)} className="flex-1 bg-purple-600 text-white text-sm py-2 rounded-md hover:bg-purple-700 transition-colors">Accept</button>
                      <button onClick={() => handleDeclineInvite(notif.id, notif.board_id)} className="flex-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm py-2 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">Decline</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button 
                onClick={() => setIsNotificationsOpen(false)}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg transition-colors font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddFriendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Add Friend</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Enter your friend's email address to send them a request.</p>
            <input 
              type="email" 
              placeholder="friend@example.com" 
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-500 mb-6"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsAddFriendOpen(false)}
                className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  toast.success("Friend request sent!");
                  setIsAddFriendOpen(false);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
      
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
          
          {isCreating ? (
            <form 
              onSubmit={handleCreateBoard}
              className="bg-white dark:bg-zinc-900 border-2 border-purple-500 p-6 rounded-xl shadow-md flex flex-col gap-3"
            >
              <input
                autoFocus
                type="text"
                placeholder="Workspace name..."
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-500"
              />
              <div className="flex justify-end gap-2 mt-auto">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-3 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIsCreating(true)}
              className="flex flex-col items-center justify-center min-h-[160px] bg-transparent border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-6 rounded-xl hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all text-zinc-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 group"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">+</span>
              <span className="font-medium">New Workspace</span>
            </button>
          )}

          {boards.map((board) => (
            <div 
              key={board.id}
              onClick={() => {
                if (editingBoardId !== board.id) router.push(`/board/${board.id}`);
              }}
              className={`relative flex flex-col h-full min-h-[160px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl transition-all group ${
                editingBoardId === board.id ? "" : "cursor-pointer hover:border-purple-500 hover:shadow-md"
              }`}
            >
              {editingBoardId === board.id ? (
                <form 
                  onSubmit={(e) => handleRenameBoard(e, board.id)}
                  className="flex flex-col h-full gap-3"
                  onClick={(e) => e.stopPropagation()} 
                >
                  <input
                    autoFocus
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-500"
                  />
                  <div className="flex justify-end gap-2 mt-auto">
                    <button 
                      type="button" 
                      onClick={() => setEditingBoardId(null)}
                      className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-3 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2 relative">
                    <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors pr-8 line-clamp-2">
                      {board.title}
                    </h2>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setActiveMenuId(activeMenuId === board.id ? null : board.id);
                      }}
                      className="absolute -right-2 -top-2 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-10"
                      title="Options"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                      </svg>
                    </button>

                    {activeMenuId === board.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(null);
                          }}
                        />
                        
                        <div className="absolute right-0 top-8 w-32 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTitle(board.title);
                              setEditingBoardId(board.id);
                              setActiveMenuId(null);
                            }}
                            className="px-4 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                          >
                            ✏️ Edit
                          </button>
                          <div className="h-[1px] bg-zinc-200 dark:bg-zinc-700 w-full" />
                          <button
                            onClick={(e) => confirmDeleteBoard(e, board)}
                            className="px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <p className="mt-auto text-sm text-zinc-500 dark:text-zinc-400 pt-4">
                    Created {new Date(board.created_at).toLocaleDateString()}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}