"use client";

import { useRef, useState } from "react";

type Marker = { id: number; x: number; y: number };

type ImageState = {
  file: File;
  dataUrl: string;
  originalW: number;
  originalH: number;
  currentW: number;
  currentH: number;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function readImage(file: File): Promise<{ dataUrl: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new window.Image();
      img.onerror = () => reject(new Error("Could not read image"));
      img.onload = () => resolve({ dataUrl, w: img.naturalWidth, h: img.naturalHeight });
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function PointPreviewer() {
  const [image, setImage] = useState<ImageState | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [mode, setMode] = useState<"mark" | "view">("mark");
  const [lockRatio, setLockRatio] = useState(true);
  const [resizeW, setResizeW] = useState("");
  const [resizeH, setResizeH] = useState("");
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextIdRef = useRef(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadFile(file: File | null | undefined) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("File must be an image.");
      return;
    }
    try {
      const { dataUrl, w, h } = await readImage(file);
      setImage({ file, dataUrl, originalW: w, originalH: h, currentW: w, currentH: h });
      setResizeW(String(w));
      setResizeH(String(h));
      setMarkers([]);
      nextIdRef.current = 1;
    } catch {
      setError("Could not read image.");
    }
  }

  function coordsFromEvent(e: React.MouseEvent<HTMLDivElement>) {
    if (!image) return null;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;
    const x = Math.round((dx / rect.width) * image.originalW);
    const y = Math.round((dy / rect.height) * image.originalH);
    if (x < 0 || y < 0 || x > image.originalW || y > image.originalH) return null;
    return { x, y };
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (mode !== "mark") return;
    const c = coordsFromEvent(e);
    if (!c) return;
    setMarkers((m) => [...m, { id: nextIdRef.current++, x: c.x, y: c.y }]);
  }

  function handleCanvasMove(e: React.MouseEvent<HTMLDivElement>) {
    if (mode !== "mark") return;
    setHover(coordsFromEvent(e));
  }

  function handleWChange(v: string) {
    setResizeW(v);
    if (lockRatio && image) {
      const w = parseInt(v, 10);
      if (w > 0) {
        const h = Math.round(w * (image.originalH / image.originalW));
        setResizeH(String(h));
      }
    }
  }

  function handleHChange(v: string) {
    setResizeH(v);
    if (lockRatio && image) {
      const h = parseInt(v, 10);
      if (h > 0) {
        const w = Math.round(h * (image.originalW / image.originalH));
        setResizeW(String(w));
      }
    }
  }

  function applyResize() {
    if (!image) return;
    const w = parseInt(resizeW, 10);
    const h = parseInt(resizeH, 10);
    if (!w || !h || w < 1 || h < 1) return;
    setImage({ ...image, currentW: w, currentH: h });
  }

  function resetSize() {
    if (!image) return;
    setImage({ ...image, currentW: image.originalW, currentH: image.originalH });
    setResizeW(String(image.originalW));
    setResizeH(String(image.originalH));
  }

  function clearImage() {
    setImage(null);
    setMarkers([]);
    setHover(null);
    setError(null);
  }

  if (!image) {
    return (
      <div className="w-full max-w-2xl">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            loadFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex h-80 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed transition-colors ${
            dragOver
              ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900"
              : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          }`}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-zinc-400"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
            Drop image here, or click to upload
          </p>
          <p className="mt-1 text-xs text-zinc-500">PNG, JPG, GIF, WebP, SVG</p>
        </div>
        {error && (
          <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => loadFile(e.target.files?.[0])}
        />
      </div>
    );
  }

  const displayScale = image.currentW / image.originalW;

  return (
    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
      <div className="flex min-w-0 flex-col gap-3">
        <div
          className="overflow-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
          style={{ maxHeight: "70vh" }}
        >
          <div
            className="relative inline-block select-none"
            style={{
              width: image.currentW,
              height: image.currentH,
              cursor: mode === "mark" ? "crosshair" : "default",
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMove}
            onMouseLeave={() => setHover(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.dataUrl}
              alt={image.file.name}
              draggable={false}
              className="block h-full w-full select-none"
            />
            {markers.map((m, i) => (
              <div
                key={m.id}
                className="pointer-events-none absolute"
                style={{
                  left: m.x * displayScale,
                  top: m.y * displayScale,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-medium text-white shadow-sm ring-2 ring-white dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-900">
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
          <button
            type="button"
            onClick={() => setMode(mode === "mark" ? "view" : "mark")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "mark"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Mark
          </button>
          <button
            type="button"
            onClick={() => setMarkers([])}
            disabled={markers.length === 0}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Clear
          </button>
          <div className="ml-auto flex items-center gap-3">
            <span className="font-mono text-xs text-zinc-500">
              {hover ? `${hover.x}, ${hover.y}` : "—"}
            </span>
            <button
              type="button"
              onClick={clearImage}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              New image
            </button>
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-3">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Image
          </h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <InfoRow label="Name" value={image.file.name} />
            <InfoRow label="Type" value={image.file.type || "—"} />
            <InfoRow label="Size" value={formatBytes(image.file.size)} />
            <InfoRow label="Original" value={`${image.originalW} × ${image.originalH}`} />
            <InfoRow label="Current" value={`${image.currentW} × ${image.currentH}`} />
          </dl>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Resize
          </h2>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs text-zinc-500">Width</span>
                <input
                  type="number"
                  min={1}
                  value={resizeW}
                  onChange={(e) => handleWChange(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 font-mono text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
                />
              </label>
              <label className="block">
                <span className="text-xs text-zinc-500">Height</span>
                <input
                  type="number"
                  min={1}
                  value={resizeH}
                  onChange={(e) => handleHChange(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 font-mono text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={lockRatio}
                onChange={(e) => setLockRatio(e.target.checked)}
                className="h-3.5 w-3.5 accent-zinc-900 dark:accent-zinc-100"
              />
              Lock aspect ratio
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={applyResize}
                className="flex-1 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={resetSize}
                className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Markers ({markers.length})
          </h2>
          {markers.length === 0 ? (
            <p className="mt-3 text-xs text-zinc-500">Click on the image to add a marker.</p>
          ) : (
            <ul className="mt-3 space-y-0.5">
              {markers.map((m, i) => (
                <li
                  key={m.id}
                  className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    {m.x}, {m.y}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMarkers((ms) => ms.filter((mm) => mm.id !== m.id))}
                    className="text-zinc-400 opacity-0 transition-opacity hover:text-zinc-900 group-hover:opacity-100 dark:hover:text-zinc-100"
                    aria-label={`Remove marker ${i + 1}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="truncate font-mono text-xs text-zinc-900 dark:text-zinc-100" title={value}>
        {value}
      </dd>
    </div>
  );
}
