export function FancyEditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()} 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="group/btn relative flex h-7 w-[70px] overflow-hidden items-center justify-start rounded-md border-none bg-[rgb(168,38,255)] px-3 text-[10px] font-medium text-white shadow-[3px_3px_0px_rgb(140,32,212)] transition-all duration-300 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_rgb(140,32,212)]"
    >
      <span className="transition-all duration-300 group-hover/btn:-translate-y-8 group-hover/btn:opacity-0">Edit</span>
      <svg className="absolute right-3 w-[10px] fill-white transition-all duration-300 group-hover/btn:right-[calc(50%-5px)]" viewBox="0 0 512 512">
        <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
      </svg>
    </button>
  );
}

export function FancyDeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()} 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="group/btn relative flex h-7 w-[70px] overflow-hidden items-center justify-start rounded-md border-none bg-red-500 px-2.5 text-[10px] font-medium text-white shadow-[3px_3px_0px_rgb(185,28,28)] transition-all duration-300 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_rgb(185,28,28)] dark:bg-red-600 dark:shadow-[3px_3px_0px_rgb(153,27,27)]"
    >
      <span className="transition-all duration-300 group-hover/btn:-translate-y-8 group-hover/btn:opacity-0">Delete</span>
      <svg className="absolute right-2.5 w-[10px] fill-white transition-all duration-300 group-hover/btn:right-[calc(50%-5px)]" viewBox="0 0 448 512">
        <path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"/>
      </svg>
    </button>
  );
}