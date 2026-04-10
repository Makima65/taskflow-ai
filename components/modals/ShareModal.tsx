"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: { id: string; title: string };
}

export function ShareModal({ isOpen, onClose, board }: ShareModalProps) {
  // UI State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [isInviting, setIsInviting] = useState(false);
  
  // Data State
  const [friends, setFriends] = useState<any[]>([]);
  const [boardMembers, setBoardMembers] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"invite" | "manage">("invite");

  const fetchModalData = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);
    if (!currentSession?.user?.id) return;

    // 1. Fetch the actual Board Owner from the boards table
    const { data: boardData } = await supabase
      .from("boards")
      .select("user_id")
      .eq("id", board.id)
      .single();

    // 2. Fetch Board Members
    const { data: members } = await supabase
      .from("board_members")
      .select("user_id, role, status")
      .eq("board_id", board.id);

    // Combine members and the owner into one array
    const allMembers = [...(members || [])];
    
    // If the owner exists but isn't in the board_members table, add them manually as 'owner'
    if (boardData && !allMembers.some(m => m.user_id === boardData.user_id)) {
      allMembers.unshift({ 
        user_id: boardData.user_id, 
        role: "owner", 
        status: "accepted" 
      });
    }

    // 3. Fetch Friends to populate suggestions
    const { data: friendRecords } = await supabase
      .from("friends")
      .select("*")
      .or(`user_id.eq.${currentSession.user.id},friend_id.eq.${currentSession.user.id}`);

    const userIdsToFetch = new Set<string>();
    const acceptedFriends: any[] = [];

    if (friendRecords) {
      friendRecords.forEach((record) => {
        if (record.status === 'accepted') {
          const otherId = record.user_id === currentSession.user.id ? record.friend_id : record.user_id;
          acceptedFriends.push({ id: otherId });
          userIdsToFetch.add(otherId);
        }
      });
    }

    // Add ALL combined members (including owner) to the fetch list
    allMembers.forEach(m => userIdsToFetch.add(m.user_id));

    // 4. Fetch all needed Profiles to get emails
    if (userIdsToFetch.size > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", Array.from(userIdsToFetch));

      if (allMembers) {
        setBoardMembers(allMembers.map(m => ({
          ...m,
          email: profiles?.find(p => p.id === m.user_id)?.email || "Unknown"
        })));
      }

      setFriends(acceptedFriends.map(af => ({
        id: af.id,
        email: profiles?.find(p => p.id === af.id)?.email || "Unknown"
      })));
    } else {
      setBoardMembers([]);
      setFriends([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchModalData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, board.id]);

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
          board_id: board.id,
          user_id: profileData.id,
          role: inviteRole,
          status: "pending"
      });

      if (error) throw error;

      await supabase.from("notifications").insert([{
        user_id: profileData.id,
        sender_id: session?.user.id,
        type: 'workspace_invite',
        message: `${session?.user.email} invited you to join "${board.title}"`,
        board_id: board.id
      }]);

      toast.success(`Invite sent to ${inviteEmail}!`);
      setInviteEmail("");
      fetchModalData(); 
    } catch (error) {
      toast.error("User already in workspace or error occurred.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateMemberRole = async (userId: string, newRole: "editor" | "viewer") => {
    setBoardMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role: newRole } : m));
    const { error } = await supabase.from("board_members").update({ role: newRole }).eq("board_id", board.id).eq("user_id", userId);
    if (error) {
      toast.error("Failed to update user role");
      fetchModalData(); 
    } else {
      toast.success("Role updated!");
    }
  };

  const handleRemoveMemberClick = async (userId: string, email: string) => {
    if (window.confirm(`Are you sure you want to remove ${email} from this workspace?`)) {
        const { error } = await supabase.from("board_members").delete().eq("board_id", board.id).eq("user_id", userId);
        if (error) {
            toast.error("Failed to remove user");
        } else {
            toast.success("User removed");
            fetchModalData();
        }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div 
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg p-6 border border-zinc-200 dark:border-zinc-800 flex flex-col min-h-[400px]"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Workspace Settings</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            ✕
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
          <button 
            onClick={() => setActiveTab("invite")}
            className={`pb-2 text-sm font-medium transition-colors ${activeTab === "invite" ? "border-b-2 border-purple-600 text-purple-600" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          >
            Add Member
          </button>
          <button 
            onClick={() => setActiveTab("manage")}
            className={`pb-2 text-sm font-medium transition-colors ${activeTab === "manage" ? "border-b-2 border-purple-600 text-purple-600" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          >
            Team Access
          </button>
        </div>
        
        {/* TAB 1: ADD MEMBER */}
        {activeTab === "invite" && (
          <div className="flex-1">
            <p className="text-sm text-zinc-500 mb-4">Invite friends to collaborate on "{board.title}".</p>
            <form onSubmit={handleInviteUser} className="flex flex-col gap-4">
              <div className="flex gap-2 relative">
                <div className="flex-1 relative">
                  <input
                    autoFocus
                    type="email"
                    placeholder="Search friends or type exact email..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm outline-none focus:border-purple-500 text-zinc-900 dark:text-zinc-100"
                    required
                  />
                  {suggestedFriends.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg z-10 mt-1 overflow-hidden">
                      {suggestedFriends.map(friend => (
                        <button 
                          key={friend.id} 
                          type="button" 
                          onClick={() => { setInviteEmail(friend.email); }} 
                          className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 text-zinc-700 dark:text-zinc-300 transition-colors"
                        >
                          {friend.email}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <select 
                  value={inviteRole} 
                  onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")} 
                  className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm outline-none focus:border-purple-500 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              
              <div className="flex justify-end mt-4">
                <button type="submit" disabled={isInviting || !inviteEmail} className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50">
                  {isInviting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: MANAGE TEAM ACCESS */}
        {activeTab === "manage" && (
          <div className="flex-1 flex flex-col">
            <h3 className="text-sm font-semibold mb-3 text-zinc-900 dark:text-zinc-100">People with access</h3>
            <div className="flex flex-col gap-3 overflow-y-auto pr-2">
              {boardMembers.length === 0 ? (
                <p className="text-sm text-zinc-500 italic">Loading members...</p>
              ) : (
                boardMembers.map((member, idx) => (
                  <div key={idx} className="flex justify-between items-center group bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{member.email}</span>
                      <span className={`text-xs ${member.status === 'pending' ? 'text-amber-500' : 'text-zinc-500'}`}>
                        {member.status === 'pending' ? 'Invite Pending' : 'Joined'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {member.role === 'owner' ? (
                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400 px-2">Owner</span>
                      ) : member.user_id === session?.user?.id ? (
                        <span className="text-sm text-zinc-500 italic px-2">You</span>
                      ) : (
                        <>
                          <select 
                            value={member.role} 
                            onChange={(e) => handleUpdateMemberRole(member.user_id, e.target.value as "editor" | "viewer")} 
                            className="bg-transparent text-sm text-zinc-600 dark:text-zinc-400 outline-none cursor-pointer"
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button onClick={() => handleRemoveMemberClick(member.user_id, member.email)} className="text-zinc-400 hover:text-red-500 p-1" title="Remove User">
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}