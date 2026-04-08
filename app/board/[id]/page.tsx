"use client";

import { Session } from "@supabase/supabase-js";
import { useState, useEffect, useMemo, useRef } from "react";
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
import { UserMenu } from "@/components/board/UserMenu"; // <-- Added Import

// Custom Hook
import { useBoardData } from "../../useBoardData";

export default function BoardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [activeView, setActiveView] = useState<"board" | "calendar">("board");

  // Share Modal & Workspace Members
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [isInviting, setIsInviting] = useState(false);
  const [boardMembers, setBoardMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Friend System & Notifications State
  const [friends, setFriends] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [friendAddEmail, setFriendAddEmail] = useState("");
  const [isSendingFriendReq, setIsSendingFriendReq] = useState(false);

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

  // 👇 Unified fetch for Members, Friends, and Notifications 👇
  const fetchAllData = async () => {
    if (!session?.user?.id) return;
    setIsLoadingMembers(true);
    
    // 1. Fetch Board Members
    const { data: members } = await supabase
      .from("board_members")
      .select("user_id, role, status")
      .eq("board_id", boardId);

    // 2. Fetch Friend Records (both sent and received)
    const { data: friendRecords } = await supabase
      .from("friends")
      .select("*")
      .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);

    const userIdsToFetch = new Set<string>();
    const acceptedFriends: any[] = [];
    const pendingNotifications: any[] = [];

    if (friendRecords) {
      friendRecords.forEach((record) => {
        if (record.status === 'accepted') {
          const otherId = record.user_id === session.user.id ? record.friend_id : record.user_id;
          acceptedFriends.push({ id: otherId });
          userIdsToFetch.add(otherId);
        } else if (record.status === 'pending' && record.friend_id === session.user.id) {
          // Requests sent TO me
          pendingNotifications.push({ recordId: record.id, requesterId: record.user_id });
          userIdsToFetch.add(record.user_id);
        }
      });
    }

    if (members) members.forEach(m => userIdsToFetch.add(m.user_id));

    // 3. Fetch all needed Profiles in one go
    if (userIdsToFetch.size > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", Array.from(userIdsToFetch));

      // Map emails to members
      if (members) {
        setBoardMembers(members.map(m => ({
          ...m,
          email: profiles?.find(p => p.id === m.user_id)?.email || "Unknown"
        })));
      }

      // Map emails to friends
      setFriends(acceptedFriends.map(af => ({
        id: af.id,
        email: profiles?.find(p => p.id === af.id)?.email || "Unknown"
      })));

      // Map emails to notifications
      setNotifications(pendingNotifications.map(pn => ({
        recordId: pn.recordId,
        email: profiles?.find(p => p.id === pn.requesterId)?.email || "Unknown"
      })));
    } else {
      setBoardMembers([]);
      setFriends([]);
      setNotifications([]);
    }
    
    setIsLoadingMembers(false);
  };

  useEffect(() => {
    if (session?.user?.id) fetchAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isShareModalOpen]);


  // ============================
  // FRIEND SYSTEM LOGIC
  // ============================

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendAddEmail.trim()) return;

    if (friendAddEmail.toLowerCase() === session?.user?.email?.toLowerCase()) {
      toast.error("You can't add yourself!");
      return;
    }

    setIsSendingFriendReq(true);
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", friendAddEmail.toLowerCase().trim())
        .single();

      if (!profileData) {
        toast.error("User not found!");
        return;
      }

      const { error } = await supabase
        .from("friends")
        .insert({
          user_id: session?.user.id,
          friend_id: profileData.id,
          status: 'pending'
        });

      if (error) throw error;
      toast.success("Friend request sent!");
      setFriendAddEmail("");
      setIsAddFriendModalOpen(false);
    } catch (err: any) {
      toast.error(err.code === "23505" ? "Request already sent or you're already friends!" : "Error sending request.");
    } finally {
      setIsSendingFriendReq(false);
    }
  };

  const handleAcceptFriend = async (recordId: string) => {
    const { error } = await supabase
      .from("friends")
      .update({ status: 'accepted' })
      .eq("id", recordId);

    if (error) {
      toast.error("Failed to accept friend request");
    } else {
      toast.success("Friend added!");
      fetchAllData();
    }
  };

  const handleDeclineFriend = async (recordId: string) => {
    const { error } = await supabase
      .from("friends")
      .delete()
      .eq("id", recordId);

    if (error) {
      toast.error("Failed to decline friend request");
    } else {
      toast.info("Friend request declined");
      fetchAllData();
    }
  };


  // ============================
  // SHARE / WORKSPACE LOGIC
  // ============================

  const suggestedFriends = useMemo(() => {
    if (!inviteEmail || inviteEmail.includes("@")) return [];
    return friends.filter(f => f.email.toLowerCase().includes(inviteEmail.toLowerCase()));
  }, [inviteEmail, friends]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    if (inviteEmail.toLowerCase() === session?.user?.email?.toLowerCase()) {
      toast.error("You are already a member!");
      return;
    }

    setIsInviting(true);
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", inviteEmail.toLowerCase().trim())
        .single();

      if (!profileData) {
        toast.error("User not found!");
        return;
      }

      const { error } = await supabase.from("board_members").insert({
          board_id: boardId,
          user_id: profileData.id,
          role: inviteRole,
          status: "pending"
      });

      if (error) throw error;

      toast.success(`Invite sent to ${inviteEmail}!`);
      setInviteEmail("");
      fetchAllData(); 
    } catch (error) {
      toast.error("User already in workspace or error occurred.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateMemberRole = async (userId: string, newRole: "editor" | "viewer") => {
    setBoardMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role: newRole } : m));
    const { error } = await supabase.from("board_members").update({ role: newRole }).eq("board_id", boardId).eq("user_id", userId);
    if (error) {
      toast.error("Failed to update user role");
      fetchAllData(); 
    } else toast.success("Role updated!");
  };

  const handleRemoveMemberClick = (userId: string, email: string) => {
    setModalConfig({
      isOpen: true,
      title: "Remove Member?",
      description: `Are you sure you want to remove ${email} from this workspace?`,
      onConfirm: async () => {
        const { error } = await supabase.from("board_members").delete().eq("board_id", boardId).eq("user_id", userId);
        if (error) toast.error("Failed to remove user");
        else {
          toast.success("User removed");
          fetchAllData();
        }
        setModalConfig({ ...modalConfig, isOpen: false }); 
      }
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  if (isSessionLoading) return <main className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></main>;
  if (!session) return <AuthScreen />;

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

      {/* NOTIFICATIONS MODAL (Replaces inline dropdown) */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Notifications</h2>
              <button onClick={() => setIsNotificationsOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">✕</button>
            </div>
            
            <div className="max-h-72 overflow-y-auto pr-2">
              {notifications.length === 0 ? (
                <div className="py-8 text-sm text-center text-zinc-500">No new notifications</div>
              ) : (
                notifications.map(notif => (
                  <div key={notif.recordId} className="p-4 mb-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800 flex flex-col gap-3">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      <strong className="text-zinc-900 dark:text-white">{notif.email}</strong> wants to be your friend.
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => handleAcceptFriend(notif.recordId)} className="flex-1 bg-purple-600 text-white text-sm py-2 rounded-md hover:bg-purple-700 transition-colors">Accept</button>
                      <button onClick={() => handleDeclineFriend(notif.recordId)} className="flex-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm py-2 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">Decline</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD FRIEND MODAL */}
      {isAddFriendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Add a Friend</h2>
            <p className="text-sm text-zinc-500 mb-6">Send a request to easily add them to future workspaces.</p>
            <form onSubmit={handleSendFriendRequest} className="flex flex-col gap-4">
              <input
                autoFocus
                type="email"
                placeholder="Friend's exact email address..."
                value={friendAddEmail}
                onChange={(e) => setFriendAddEmail(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm outline-none focus:border-purple-500"
                required
              />
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setIsAddFriendModalOpen(false)} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">Cancel</button>
                <button type="submit" disabled={isSendingFriendReq || !friendAddEmail} className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md">
                  {isSendingFriendReq ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-2">Share Workspace</h2>
            
            <form onSubmit={handleInviteUser} className="flex flex-col gap-4 mb-6">
              <div className="flex gap-2 relative">
                <div className="flex-1 relative">
                  <input
                    autoFocus
                    type="email"
                    placeholder="Search friends or type exact email..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm outline-none focus:border-purple-500"
                    required
                  />
                  {suggestedFriends.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg z-10 mt-1 overflow-hidden">
                      {suggestedFriends.map(friend => (
                        <button key={friend.id} type="button" onClick={() => setInviteEmail(friend.email)} className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 text-zinc-700 dark:text-zinc-300 transition-colors">
                          {friend.email}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm outline-none focus:border-purple-500">
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsShareModalOpen(false)} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">Done</button>
                <button type="submit" disabled={isInviting || !inviteEmail} className="px-4 py-2 text-sm text-white bg-purple-600 rounded-md">
                  {isInviting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <h3 className="text-sm font-semibold mb-3">People with access</h3>
              <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-2">
                {boardMembers.map((member, idx) => (
                  <div key={idx} className="flex justify-between items-center group">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{member.email}</span>
                      <span className={`text-xs ${member.status === 'pending' ? 'text-amber-500' : 'text-zinc-500'}`}>
                        {member.status === 'pending' ? 'Invite Pending' : 'Joined'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {member.user_id === session?.user?.id ? (
                        <span className="text-sm text-zinc-500 italic mr-2">You</span>
                      ) : (
                        <>
                          <select value={member.role} onChange={(e) => handleUpdateMemberRole(member.user_id, e.target.value as "editor" | "viewer")} className="bg-transparent text-sm text-zinc-600 dark:text-zinc-400 outline-none">
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button onClick={() => handleRemoveMemberClick(member.user_id, member.email)} className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1">✕</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLEAN TOP NAVIGATION BAR */}
      <div className="w-full flex justify-between items-center mb-6 max-w-[1600px]">
        <button onClick={() => router.push("/")} className="text-sm font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-lg text-zinc-600 hover:text-purple-600 shadow-sm transition-all flex items-center gap-2">
          🔙 Back to Workspaces
        </button>

        <div className="flex items-center gap-3">
          <UserMenu 
            session={session}
            notifications={notifications}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenAddFriend={() => setIsAddFriendModalOpen(true)}
            onOpenShare={() => setIsShareModalOpen(true)}
            onSignOut={handleSignOut}
          />
        </div>
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
          <button onClick={() => setActiveView("board")} className={`px-4 py-1.5 rounded-md text-sm font-semibold ${activeView === "board" ? "bg-white shadow text-zinc-900" : "text-zinc-600"}`}>Board</button>
          <button onClick={() => setActiveView("calendar")} className={`px-4 py-1.5 rounded-md text-sm font-semibold ${activeView === "calendar" ? "bg-white shadow text-zinc-900" : "text-zinc-600"}`}>Calendar</button>
        </div>
        <BoardFilters filterPriority={filterPriority} setFilterPriority={setFilterPriority} sortBy={sortBy} setSortBy={setSortBy} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>

      {activeView === "board" ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 pb-8 w-full justify-center overflow-x-auto p-4 md:p-8">
            <SortableContext items={columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
              {columns.map((col) => (
                <div key={col.id} className="w-full md:w-80 shrink-0">
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
            <div className="w-full md:w-80 shrink-0">
              <AddColumnModal newColumnTitle={newColumnTitle} setNewColumnTitle={setNewColumnTitle} onAddColumn={handleAddColumn} />
            </div>
          </div>
          <TrashZone />
        </DndContext>
      ) : (
        <div className="w-full pb-12"><CalendarView tasks={processedTasks.filter(task => columns.some(col => col.id === task.status))} /></div>
      )}
    </main>
  );
}