"use client";

import { useState, useRef, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface UserMenuProps {
  session: Session | null;
  notifications: any[];
  onOpenNotifications: () => void;
  onOpenAddFriend: () => void;
  onOpenShare?: () => void;
  onSignOut: () => void;
}

// Reusable menu item - Now supports Light and Dark mode!
const MenuItem = ({
  onClick,
  icon,
  label,
  badge = null,
  variant = "default",
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
  variant?: "default" | "danger" | "special";
}) => {
  // Base styles
  const baseClasses =
    "flex items-center gap-[10px] py-[4px] px-[7px] rounded-[6px] cursor-pointer transition-all duration-300 ease-out text-sm font-semibold group outline-none active:scale-[0.99] w-full text-left";

  // Color & Hover logic based on variant (Responsive to light/dark themes)
  let variantClasses = "";
  let iconHoverClass = "group-hover:text-white"; 
  
  if (variant === "danger") {
    variantClasses =
      "text-zinc-600 dark:text-[#7e8590] hover:bg-red-500 dark:hover:bg-[#8e2a2a] hover:text-white hover:translate-x-[1px] hover:-translate-y-[1px]";
  } else if (variant === "special") {
    // Special gets a light purple hover in light mode, and dark transparent in dark mode
    variantClasses =
      "text-purple-600 dark:text-[#bd89ff] hover:bg-purple-100 dark:hover:bg-[rgba(56,45,71,0.836)] hover:text-purple-700 dark:hover:text-[#bd89ff]";
    iconHoverClass = "group-hover:text-purple-700 dark:group-hover:text-[#bd89ff]"; // Keep icon visible on light background
  } else {
    variantClasses =
      "text-zinc-600 dark:text-[#7e8590] hover:bg-[#5353ff] hover:text-white hover:translate-x-[1px] hover:-translate-y-[1px]";
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses}`}>
      <div className={`w-[19px] h-[19px] flex items-center justify-center shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:transition-all [&>svg]:duration-300 ${iconHoverClass}`}>
        {icon}
      </div>

      <span className="flex-1">{label}</span>
      {badge}
    </button>
  );
};

export function UserMenu({
  session,
  notifications,
  onOpenNotifications,
  onOpenAddFriend,
  onOpenShare,
  onSignOut,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close the menu if the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global listener just for the unread message count
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", session.user.id)
        .eq("is_read", false);

      setUnreadMessages(count || 0);
    };

    fetchUnreadCount();

    const channel = supabase
      .channel(`menu-unread-counter-${session.user.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${session.user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const userEmail = session?.user?.email || "User";
  const initial = userEmail.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pr-4 bg-white dark:bg-[#242832] border border-zinc-200 dark:border-[#42434a] rounded-full hover:border-[#bd89ff] dark:hover:border-[#bd89ff] transition-all shadow-sm focus:outline-none"
      >
        <div className="w-8 h-8 flex items-center justify-center bg-[#bd89ff] text-white rounded-full font-bold text-sm shrink-0">
          {initial}
        </div>
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 truncate max-w-[150px]">
          {userEmail}
        </span>
        {(notifications.length > 0 || unreadMessages > 0) && (
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full ml-1 animate-pulse shrink-0"></div>
        )}
      </button>

      {/* Dropdown Menu - Added light mode backgrounds and borders */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[200px] bg-white border border-zinc-100 dark:border-none dark:bg-[#242832] dark:bg-gradient-to-br dark:from-[#242832] dark:via-[#242832] dark:to-[#251c28] rounded-[10px] py-[15px] flex flex-col gap-[10px] shadow-2xl z-50 overflow-hidden">
          
          {/* First Block */}
          <div className="flex flex-col gap-[8px] px-[10px]">
            <MenuItem
              onClick={() => { onOpenAddFriend(); setIsOpen(false); }}
              label="Add Friend"
              icon={
                <svg fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                  <path d="m1.5 13v1a.5.5 0 0 0 .3379.4731 18.9718 18.9718 0 0 0 6.1621 1.0269 18.9629 18.9629 0 0 0 6.1621-1.0269.5.5 0 0 0 .3379-.4731v-1a6.5083 6.5083 0 0 0 -4.461-6.1676 3.5 3.5 0 1 0 -4.078 0 6.5083 6.5083 0 0 0 -4.461 6.1676zm4-9a2.5 2.5 0 1 1 2.5 2.5 2.5026 2.5026 0 0 1 -2.5-2.5zm2.5 3.5a5.5066 5.5066 0 0 1 5.5 5.5v.6392a18.08 18.08 0 0 1 -11 0v-.6392a5.5066 5.5066 0 0 1 5.5-5.5z" />
                </svg>
              }
            />

            <MenuItem
              onClick={() => { router.push("/messages"); setIsOpen(false); }}
              label="Messages"
              badge={unreadMessages > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto shrink-0 border border-red-500/50">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
              icon={
                <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                </svg>
              }
            />
          </div>

          <div className="border-t-[1.5px] border-zinc-100 dark:border-[#42434a] w-full" />

          {/* Second Block */}
          <div className="flex flex-col gap-[8px] px-[10px]">
            <MenuItem
              onClick={() => { onOpenNotifications(); setIsOpen(false); }}
              label="Notifications"
              badge={notifications.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto shrink-0 border border-red-500/50">
                  {notifications.length}
                </span>
              )}
              icon={
                <svg fill="currentColor" viewBox="0 0 24 25" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="m11.9572 4.31201c-3.35401 0-6.00906 2.59741-6.00906 5.67742v3.29037c0 .1986-.05916.3927-.16992.5576l-1.62529 2.4193-.01077.0157c-.18701.2673-.16653.5113-.07001.6868.10031.1825.31959.3528.67282.3528h14.52603c.2546 0 .5013-.1515.6391-.3968.1315-.2343.1117-.4475-.0118-.6093-.0065-.0085-.0129-.0171-.0191-.0258l-1.7269-2.4194c-.121-.1695-.186-.3726-.186-.5809v-3.29037c0-1.54561-.6851-3.023-1.7072-4.00431-1.1617-1.01594-2.6545-1.67311-4.3019-1.67311zm-8.00906 5.67742c0-4.27483 3.64294-7.67742 8.00906-7.67742 2.2055 0 4.1606.88547 5.6378 2.18455.01.00877.0198.01774.0294.02691 1.408 1.34136 2.3419 3.34131 2.3419 5.46596v2.97007l1.5325 2.1471c.6775.8999.6054 1.9859.1552 2.7877-.4464.795-1.3171 1.4177-2.383 1.4177h-14.52603c-2.16218 0-3.55087-2.302-2.24739-4.1777l1.45056-2.1593zm4.05187 11.32257c0-.5523.44772-1 1-1h5.99999c.5523 0 1 .4477 1 1s-.4477 1-1 1h-5.99999c-.55228 0-1-.4477-1-1z" clipRule="evenodd" />
                </svg>
              }
            />

            <MenuItem
              onClick={() => { onSignOut(); setIsOpen(false); }}
              label="Sign Out"
              variant="danger"
              icon={
                <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 22H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h5v2H5v16h5v2zm6-12H9v4h7v3l5-5-5-5v3z" />
                </svg>
              }
            />
          </div>

          {/* Third Block (Only shows if Share Board prop exists) */}
          {onOpenShare && (
            <>
              <div className="border-t-[1.5px] border-zinc-100 dark:border-[#42434a] w-full" />
              <div className="flex flex-col gap-[8px] px-[10px]">
                <MenuItem
                  onClick={() => { onOpenShare(); setIsOpen(false); }}
                  label="Share Board"
                  variant="special"
                  icon={
                    <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z" />
                    </svg>
                  }
                />
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}