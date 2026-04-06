

export function FloatingInput({ label, type = "text", value, onChange, onKeyDown }: any) {
  const hasText = value.length > 0;

  return (
    <div className="relative my-2 w-full font-sans">
      <input
        type={type}
        required
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className="peer w-full rounded-[20px] border border-zinc-300 bg-transparent p-3 text-base outline-none transition-colors focus:border-purple-600 dark:border-zinc-700 dark:focus:border-purple-500"
      />
      <label
        className={`pointer-events-none absolute left-3 transition-all duration-300 px-1 bg-white dark:bg-zinc-900 ${
          hasText 
            ? "top-0 -translate-y-1/2 scale-90 text-purple-600 dark:text-purple-400" 
            : "top-1/2 -translate-y-1/2 text-zinc-500 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-90 peer-focus:text-purple-600 dark:peer-focus:text-purple-400"
        }`}
      >
        {label}
      </label>
    </div>
  );
}