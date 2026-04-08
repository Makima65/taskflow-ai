"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface UpdatePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpdatePasswordModal({ isOpen, onClose }: UpdatePasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    // This is the magic Supabase function that actually changes their password!
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully! You can now log in.");
      onClose(); 
    }
    
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="max-w-[400px] w-full bg-white dark:bg-zinc-900 p-8 text-[14px] text-zinc-900 dark:text-zinc-50 flex flex-col gap-5 rounded-[10px] shadow-[0px_5px_15px_rgba(0,0,0,0.35)] dark:shadow-[0px_5px_15px_rgba(0,0,0,0.8)]">
        <div className="text-center font-extrabold font-sans text-[22px]">
          Create New Password
        </div>
        
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <label className="block font-medium text-sm">New Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full p-3 rounded-md font-sans border border-zinc-300 dark:border-zinc-700 bg-transparent focus:outline-none focus:border-purple-600 dark:focus:border-purple-500 placeholder:opacity-50 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="block font-medium text-sm">Confirm Password</label>
            <input 
              type="password" 
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full p-3 rounded-md font-sans border border-zinc-300 dark:border-zinc-700 bg-transparent focus:outline-none focus:border-purple-600 dark:focus:border-purple-500 placeholder:opacity-50 transition-colors"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="flex justify-center items-center font-sans font-medium text-white bg-purple-600 hover:bg-purple-700 border-none w-full p-3 gap-2 mt-2 cursor-pointer rounded-md shadow-[0px_3px_8px_rgba(0,0,0,0.24)] active:scale-95 transition-all disabled:opacity-70"
          >
            {isLoading ? "Saving..." : "Save New Password"}
          </button>
        </form>
      </div>
    </div>
  );
}