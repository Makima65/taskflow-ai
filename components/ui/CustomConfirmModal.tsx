export function CustomConfirmModal({ isOpen, onClose, onConfirm, title, description }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[300px] h-fit bg-white dark:bg-zinc-900 rounded-[20px] flex flex-col items-center justify-center gap-5 p-[30px] relative shadow-[20px_20px_30px_rgba(0,0,0,0.068)] dark:shadow-[20px_20px_30px_rgba(0,0,0,0.4)] animate-in fade-in zoom-in-95 duration-200">
        
        <button onClick={onClose} className="absolute top-[20px] right-[20px] flex items-center justify-center border-none bg-transparent cursor-pointer group">
          <svg height="20px" viewBox="0 0 384 512" className="fill-[#afafaf] group-hover:fill-black dark:group-hover:fill-white transition-colors">
            <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
          </svg>
        </button>

        <div className="w-full flex flex-col gap-[5px]">
          <p className="text-[20px] font-bold text-[#1b1b1b] dark:text-zinc-50 m-0 leading-tight">{title}</p>
          <p className="font-[100] text-[#666666] dark:text-zinc-400 m-0 text-sm leading-snug">{description}</p>
        </div>

        <div className="w-full flex items-center justify-center gap-[10px]">
          <button onClick={onClose} className="w-1/2 h-[35px] rounded-[10px] border-none cursor-pointer font-semibold bg-[#ddd] hover:bg-[#c5c5c5] dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 transition-colors text-zinc-900">
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className="w-1/2 h-[35px] rounded-[10px] border-none cursor-pointer font-semibold bg-[#ff726d] hover:bg-[#ff4942] text-white transition-colors"
          >
            Confirm
          </button>
        </div>

      </div>
    </div>
  );
}