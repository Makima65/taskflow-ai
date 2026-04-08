"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Because we fixed the Supabase dashboard settings, this will now work on Vercel!
      redirectTo: `${window.location.origin}/#type=recovery`, 
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for the reset link!");
      onClose(); 
      setEmail(""); 
    }
    
    setIsLoading(false);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="max-w-[400px] w-full bg-white dark:bg-zinc-900 p-8 text-[14px] text-zinc-900 dark:text-zinc-50 flex flex-col gap-5 rounded-[10px] shadow-[0px_5px_15px_rgba(0,0,0,0.35)] dark:shadow-[0px_5px_15px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center font-extrabold font-sans text-[22px]">
          Forgot Password
        </div>
        
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <label htmlFor="reset-email" className="block mb-1 font-medium text-sm">Email</label>
            <input 
              type="email" 
              id="reset-email" 
              name="email" 
              placeholder="Enter your email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-md font-sans border border-zinc-300 dark:border-zinc-700 bg-transparent focus:outline-none focus:border-purple-600 dark:focus:border-purple-500 placeholder:opacity-50 transition-colors"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="flex justify-center items-center font-sans font-medium text-white bg-purple-600 hover:bg-purple-700 border-none w-full p-3 gap-2 my-4 cursor-pointer rounded-md shadow-[0px_3px_8px_rgba(0,0,0,0.24)] active:scale-95 transition-all disabled:opacity-70"
          >
            {isLoading ? "Sending..." : "Send Email"}
          </button>
        </form>
        
        <p className="self-center font-medium text-zinc-600 dark:text-zinc-400">
          Remembered your password?{" "}
          <button 
            type="button"
            onClick={onClose} 
            className="text-purple-600 dark:text-purple-400 font-extrabold hover:underline transition-colors"
          >
            Back to login
          </button>
        </p>
      </div>
    </div>
  );
}