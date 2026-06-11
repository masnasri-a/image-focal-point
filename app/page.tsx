import { PointPreviewer } from "./components/point-previewer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Point Previewer
          </h1>
          <p className="text-xs text-zinc-500">Click to mark, resize to preview</p>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 py-8">
        <PointPreviewer />
      </main>
    </div>
  );
}
