"use client";

import { useState } from "react";
import { FloatingInput } from "@/components/ui/FloatingInput";
// Note: Double check this import path matches where your ThemeToggle is!
import ThemeToggle from "@/app/ThemeToggle"; 
import { supabase } from "@/lib/supabase";
import { Toaster, toast } from "sonner";

export function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const authPromise = isSignUp 
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });

    toast.promise(authPromise, {
      loading: isSignUp ? 'Creating account...' : 'Signing in...',
      success: (result) => {
        if (result.error) throw result.error;
        return isSignUp ? "Check your email to confirm your account!" : "Welcome back!";
      },
      error: (err) => {
        const errorMsg = err.message.toLowerCase();
        
        // Custom error for signing up with an existing account
        if (isSignUp && errorMsg.includes("already registered")) {
          return "This email already has an account. Please log in!";
        }
        
        // Custom error for signing in with no account / wrong password
        // (Note: Supabase groups "wrong password" and "no account" into "Invalid login credentials" for security)
        if (!isSignUp && errorMsg.includes("invalid login")) {
          return "No account found or incorrect password. Please sign up or try again!";
        }
        
        return err.message;
      },
    });
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address first so we know where to send the reset link.");
      return;
    }

    const resetPromise = supabase.auth.resetPasswordForEmail(email, {
      // This will redirect them back to your site after they click the email link
      redirectTo: `${window.location.origin}/`, 
    });

    toast.promise(resetPromise, {
      loading: 'Sending reset link...',
      success: (result) => {
        if (result.error) throw result.error;
        return "Password reset link sent! Check your email inbox.";
      },
      error: (err) => err.message,
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950 relative">
      <Toaster richColors position="bottom-center" /> 
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-[350px] bg-white dark:bg-zinc-900 shadow-[0px_5px_15px_rgba(0,0,0,0.35)] dark:shadow-[0px_5px_15px_rgba(0,0,0,0.8)] rounded-[10px] box-border p-[20px_30px]">
        <h1 className="text-center font-sans mt-[10px] mb-[30px] text-[28px] font-extrabold text-zinc-900 dark:text-zinc-50">
          {isSignUp ? "Create Account" : "Welcome back"}
        </h1>
        <form onSubmit={handleAuth} className="w-full flex flex-col gap-[18px] mb-[15px]">
          <FloatingInput label="Email Address" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
          <div>
            <FloatingInput label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
            {!isSignUp && (
              <p className="underline m-0 text-right text-[#747474] decoration-[#747474]">
                {/* Changed the onClick to trigger our new function */}
                <span 
                  onClick={handleForgotPassword} 
                  className="cursor-pointer font-sans text-[11px] font-bold hover:text-black dark:hover:text-white transition-colors"
                >
                  Forgot Password?
                </span>
              </p>
            )}
          </div>
          <button type="submit" className="px-[15px] py-[10px] font-sans rounded-[20px] border-0 outline-none bg-purple-600 hover:bg-purple-700 transition-colors text-white cursor-pointer shadow-[0px_3px_8px_rgba(0,0,0,0.24)] active:shadow-none">
            {isSignUp ? "Sign Up" : "Log in"}
          </button>
        </form>
        <p className="m-0 text-[11px] text-[#747474] font-sans text-center">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <span onClick={() => setIsSignUp(!isSignUp)} className="ml-[2px] text-[12px] underline decoration-purple-600 text-purple-600 cursor-pointer font-extrabold transition-colors hover:text-purple-700">
            {isSignUp ? "Log in" : "Sign up"}
          </span>
        </p>
      </div>
    </div>
  );
}