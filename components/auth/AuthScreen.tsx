"use client";

import { useState } from "react";
import ThemeToggle from "@/app/ThemeToggle"; 
import { supabase } from "@/lib/supabase";
import { Toaster, toast } from "sonner";
import { ForgotPasswordModal } from "./ForgotPasswordModal"; 
import Image from "next/image";
import { Astronaut } from "@/components/Astronaut";

export function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

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
        
        if (isSignUp && errorMsg.includes("already registered")) {
          return "This email already has an account. Please log in!";
        }
        
        if (!isSignUp && errorMsg.includes("invalid login")) {
          return "No account found or incorrect password. Please sign up or try again!";
        }
        
        return err.message;
      },
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-white dark:bg-zinc-950">
      <Toaster richColors position="bottom-center" /> 
      
      {/* LEFT SIDE: AUTH FORM */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-16 md:px-24 lg:w-1/2 xl:px-32 relative">
        {/* Theme Toggle - Placed neatly at top left */}
        <div className="absolute top-8 left-8 sm:left-16 md:left-24 xl:left-32">
          <ThemeToggle />
        </div>

<div className="w-full max-w-[400px] mx-auto mt-12">
          {/* Custom Logo */}
          <div className="mb-8">
            <Image 
              src="/taskflow_logo.png" 
              alt="TaskFlow Logo" 
              width={163} 
              height={61} 
              priority 
              className="dark" /* Only add this if you need it to turn white in dark mode! */
            />
          </div>

          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            {isSignUp ? "Create an account" : "Sign in to your account"}
          </h1>
          
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8">
            {isSignUp ? "Already a member? " : "Not a member? "}
            <span 
              onClick={() => setIsSignUp(!isSignUp)} 
              className="font-semibold text-purple-600 hover:text-purple-500 cursor-pointer transition-colors"
            >
              {isSignUp ? "Log in instead" : "Start a 14 day free trial"}
            </span>
          </p>

          <form onSubmit={handleAuth} className="flex flex-col gap-5">
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Email address</label>
              <input 
                type="email" 
                required
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 transition-colors"
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Password</label>
              <input 
                type="password" 
                required
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 transition-colors"
              />
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between mt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-purple-600 focus:ring-purple-600 dark:bg-zinc-900" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">Remember me</span>
              </label>

              {!isSignUp && (
                <button 
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-sm font-semibold text-purple-600 hover:text-purple-500 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {/* Main CTA Button */}
            <button 
              type="submit" 
              className="w-full mt-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transition-colors"
            >
              {isSignUp ? "Sign Up" : "Sign in"}
            </button>
          </form>

          {/* Social Logins Divider */}
          <div className="relative mt-10 mb-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-sm font-medium leading-6">
              <span className="bg-white dark:bg-zinc-950 px-6 text-zinc-500 dark:text-zinc-400">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.25024 6.60998L5.32028 9.77C6.27525 6.79 9.00028 4.75 12.0003 4.75Z" fill="#EA4335" />
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.98539 19.245 6.26038 17.18 5.29538 14.26L1.27539 17.355C3.27539 21.285 7.32039 24.0001 12.0004 24.0001Z" fill="#34A853" />
              </svg>
              Google
            </button>
            <button className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: INTERACTIVE ASTRONAUT PANEL */}
      <div className="hidden lg:block lg:w-1/2 relative bg-[#0b0f19] border-l border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <Astronaut />
      </div>

      <ForgotPasswordModal 
        isOpen={isForgotModalOpen} 
        onClose={() => setIsForgotModalOpen(false)} 
      />
    

      <ForgotPasswordModal 
        isOpen={isForgotModalOpen} 
        onClose={() => setIsForgotModalOpen(false)} 
      />
    </div>
  );
}