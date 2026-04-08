import { FormEvent } from "react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  newPassword: string;
  setNewPassword: (password: string) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}

export function ResetPasswordModal({
  isOpen,
  newPassword,
  setNewPassword,
  onSubmit,
  onCancel
}: ResetPasswordModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Reset Password</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          Please enter your new password below to secure your account.
        </p>
        <form onSubmit={onSubmit}>
          <input 
            autoFocus
            type="password" 
            placeholder="New Password (min 6 chars)" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-500 mb-6"
            required
          />
          <div className="flex justify-end gap-3">
            <button 
              type="button"
              onClick={onCancel}
              className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}