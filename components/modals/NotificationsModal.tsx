interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: any[];
  // Workspace Handlers
  onAccept: (notifId: string, boardId: string) => void;
  onDecline: (notifId: string, boardId: string) => void;
  // Friend Handlers (Optional for now so page.tsx doesn't break!)
  onAcceptFriend?: (notifId: string) => void;
  onDeclineFriend?: (notifId: string) => void;
}

export function NotificationsModal({ 
  isOpen, 
  onClose, 
  notifications, 
  onAccept, 
  onDecline,
  onAcceptFriend,
  onDeclineFriend
}: NotificationsModalProps) {
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Notifications</h2>
        <div className="max-h-72 overflow-y-auto pr-2">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              <p>No new notifications.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className="p-4 mb-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800 flex flex-col gap-3">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{notif.message}</p>
                <div className="flex gap-2">
                  
                  {/* WORKSPACE INVITE BUTTONS */}
                  {notif.type === "workspace_invite" && (
                    <>
                      <button 
                        onClick={() => onAccept(notif.id, notif.board_id)} 
                        className="flex-1 bg-purple-600 text-white text-sm py-2 rounded-md hover:bg-purple-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => onDecline(notif.id, notif.board_id)} 
                        className="flex-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm py-2 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {/* FRIEND REQUEST BUTTONS */}
                  {notif.type === "friend_request" && (
                    <>
                      <button 
                        onClick={() => onAcceptFriend && onAcceptFriend(notif.id)} 
                        className="flex-1 bg-purple-600 text-white text-sm py-2 rounded-md hover:bg-purple-700 transition-colors"
                      >
                        Accept Friend
                      </button>
                      <button 
                        onClick={() => onDeclineFriend && onDeclineFriend(notif.id)} 
                        className="flex-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm py-2 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                      >
                        Decline
                      </button>
                    </>
                  )}

                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}