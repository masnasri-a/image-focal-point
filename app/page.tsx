import { PointPreviewer } from "./components/point-previewer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100">
            <Logo />
            <h1 className="text-sm font-semibold tracking-tight">Point Previewer</h1>
          </div>
          <p className="text-xs text-zinc-500">Click to mark, resize to preview</p>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 py-8">
        <PointPreviewer />
      </main>
    </div>
  );
}

function Logo() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="text-zinc-900 dark:text-zinc-100"
    >
      <rect
        x="3"
        y="3"
        width="26"
        height="26"
        rx="6"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle cx="20" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}
