import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
}

export function AddFriendModal({ isOpen, onClose, session }: AddFriendModalProps) {
  const [friendEmail, setFriendEmail] = useState("");

  // If the modal isn't supposed to be open, render absolutely nothing.
  if (!isOpen) return null;

  const handleSendFriendRequest = async () => {
    if (!session || !friendEmail.trim()) return;

    const { data: targetUser, error: searchError } = await supabase
      .from("profiles") // Change to 'users' if your table is named differently
      .select("id")
      .eq("email", friendEmail.toLowerCase())
      .single();

    if (searchError || !targetUser) {
      toast.error("User not found. Check the email address.");
      return;
    }

    if (targetUser.id === session.user.id) {
      toast.error("You can't send a friend request to yourself!");
      return;
    }

    const { error: insertError } = await supabase
      .from("notifications")
      .insert([{
        user_id: targetUser.id,
        type: "friend_request",
        message: `${session.user.email} sent you a friend request!`
      }]);

    if (insertError) {
      toast.error("Failed to send request: " + insertError.message);
    } else {
      toast.success("Friend request sent!");
      setFriendEmail("");
      onClose(); // Tell the parent component to close the modal
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Add Friend</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Enter your friend's email address to send them a request.</p>
        <input 
          type="email" 
          value={friendEmail}
          onChange={(e) => setFriendEmail(e.target.value)}
          placeholder="friend@example.com" 
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-500 mb-6"
        />
        <div className="flex justify-end gap-3">
          <button 
            onClick={() => {
              setFriendEmail("");
              onClose();
            }}
            className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSendFriendRequest}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
}