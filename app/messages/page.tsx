"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { CustomConfirmModal } from "@/components/ui/CustomConfirmModal";

interface FriendProfile {
  id: string;
  email: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export default function MessagesPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // States for Menu and Modal
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unfriendModal, setUnfriendModal] = useState({ isOpen: false, friendId: "" });
  
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Click-Outside logic using the Ref
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/");
        return;
      }
      setSession(session);
      fetchFriends(session.user.id);
    });
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!session || !selectedFriend) return;

    const fetchChatHistory = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},receiver_id.eq.${session.user.id})`)
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("Failed to load messages");
      } else if (data) {
        setMessages(data);
      }
    };

    fetchChatHistory();

    // REALTIME WEBSOCKET FIX
    const channel = supabase
      .channel(`chat_room_${session.user.id}_${selectedFriend.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          console.log("🔥 REALTIME PAYLOAD RECEIVED:", payload);
          const newMsg = payload.new as Message;
          
          if (
            (newMsg.sender_id === session.user.id && newMsg.receiver_id === selectedFriend.id) ||
            (newMsg.sender_id === selectedFriend.id && newMsg.receiver_id === session.user.id)
          ) {
            setMessages((prev) => {
              // Prevent duplicates if Optimistic UI already added it
              if (prev.some(msg => msg.id === newMsg.id)) {
                return prev;
              }
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Realtime Status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, selectedFriend]);

  const fetchFriends = async (userId: string) => {
    const { data: friendsData, error: friendsError } = await supabase
      .from("friends")
      .select("friend_id")
      .eq("user_id", userId);

    if (friendsError) {
      toast.error("Failed to load friends list.");
      setIsLoading(false);
      return;
    }

    if (friendsData && friendsData.length > 0) {
      const friendIds = friendsData.map(f => f.friend_id);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", friendIds);

      if (!profilesError && profilesData) {
        setFriends(profilesData);
      }
    } else {
      setFriends([]);
    }
    setIsLoading(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !session || !selectedFriend) return;

    const messageText = newMessage.trim();
    setNewMessage(""); 

    // OPTIMISTIC UI: Add to screen instantly using a fake UUID
    const tempId = crypto.randomUUID();
    const tempMessage: Message = {
      id: tempId,
      sender_id: session.user.id,
      receiver_id: selectedFriend.id,
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    // Save to DB in the background
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.user.id,
        receiver_id: selectedFriend.id,
        content: messageText,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to send message");
      // Remove fake message if it fails
      setMessages((prev) => prev.filter(msg => msg.id !== tempId));
      setNewMessage(messageText); 
    } else if (data) {
      // Replace temp message with the official database row (real ID)
      setMessages((prev) => prev.map(msg => msg.id === tempId ? data : msg));
    }
  };

  const executeUnfriend = async () => {
    const friendId = unfriendModal.friendId;
    if (!session || !friendId) return;

    const { error } = await supabase.rpc("remove_friendship", {
      user_a: session.user.id,
      user_b: friendId
    });

    if (error) {
      toast.error("Failed to remove friend: " + error.message);
      return;
    }

    toast.success("Friend completely removed.");
    
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    if (selectedFriend?.id === friendId) {
      setSelectedFriend(null);
    }
    
    setUnfriendModal({ isOpen: false, friendId: "" });
  };

  if (isLoading) {
    return (
      <main className="h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </main>
    );
  }

  return (
    <main className="h-screen flex bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <Toaster richColors position="bottom-right" />
      
      <CustomConfirmModal 
        isOpen={unfriendModal.isOpen}
        title="Remove Friend"
        description="Are you sure you want to remove this person from your friends list? You will no longer be able to message each other."
        onClose={() => setUnfriendModal({ isOpen: false, friendId: "" })}
        onConfirm={executeUnfriend}
      />
      
      {/* LEFT PANEL: Friends List */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${selectedFriend ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <button 
            onClick={() => router.push("/")}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Messages</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {friends.length === 0 ? (
            <div className="text-center text-zinc-500 dark:text-zinc-400 mt-10 px-4 text-sm">
              No friends yet. Go back to the dashboard to send some invites!
            </div>
          ) : (
            friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left mb-1 ${
                  selectedFriend?.id === friend.id 
                    ? 'bg-purple-50 dark:bg-purple-900/20' 
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 dark:text-purple-400 font-bold text-sm uppercase">
                    {friend.email.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {friend.email}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Active Chat */}
      <div className={`flex-1 flex flex-col ${!selectedFriend ? 'hidden md:flex' : 'flex'}`}>
        {!selectedFriend ? (
          <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Select a friend to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-3 shadow-sm z-10 relative">
              <button 
                onClick={() => setSelectedFriend(null)}
                className="md:hidden p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 dark:text-purple-400 font-bold uppercase">
                  {selectedFriend.email.charAt(0)}
                </span>
              </div>
              
              <h2 className="font-bold text-zinc-900 dark:text-zinc-100 truncate flex-1">
                {selectedFriend.email}
              </h2>

              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg py-1 z-50">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setUnfriendModal({ isOpen: true, friendId: selectedFriend.id });
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium"
                    >
                      Unfriend
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-zinc-50/50 dark:bg-zinc-950/50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400 text-sm">
                  Say hi to {selectedFriend.email}!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === session?.user.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div 
                        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                          isMine 
                            ? "bg-purple-600 text-white rounded-br-sm" 
                            : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-bl-sm"
                        }`}
                      >
                        <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Message..." 
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-full px-4 py-2.5 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="translate-x-[-1px] translate-y-[1px]"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}