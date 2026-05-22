'use client';

import { useActionState, useRef, useState } from 'react';
import { createTicket } from '@/lib/actions/tickets';

export default function NewTicketPage() {
  const [state, formAction, pending] = useActionState(createTicket, undefined);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Nový požadavek
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Popište svůj problém nebo požadavek a my se vám ozveme co nejdříve.
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        {state?.error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 p-4 text-sm text-red-700 dark:text-red-400">
            {state.error}
          </div>
        )}

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2"
            >
              Název požadavku
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="Např. Nemohu se přihlásit do systému"
              className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm transition-colors focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2"
            >
              Podrobný popis
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={8}
              placeholder="Podrobně popište váš problém — co se děje, kdy to začalo, jaké kroky jste už zkusili..."
              className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm transition-colors focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y min-h-[180px]"
            />
          </div>

          {/* File upload area */}
          <div>
            <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              Přílohy
            </label>
            <div
              className="relative rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 p-6 text-center transition-colors hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                name="files"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
              />
              <div className="flex flex-col items-center gap-2">
                <svg
                  className="w-8 h-8 text-zinc-400 dark:text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
                  />
                </svg>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    Klikněte pro nahrání
                  </span>{' '}
                  nebo přetáhněte soubory
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Obrázky, PDF, dokumenty — max. 10 MB na soubor
                </p>
              </div>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-lg bg-zinc-100 dark:bg-zinc-800/60 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <svg
                        className="w-4 h-4 text-zinc-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                        />
                      </svg>
                      <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="ml-2 p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18 18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="max-w-xs">
            <label
              htmlFor="priority"
              className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2"
            >
              Priorita
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue="MEDIUM"
              className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 text-base text-zinc-900 dark:text-zinc-100 shadow-sm transition-colors focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="LOW">Nízká — mohu počkat</option>
              <option value="MEDIUM">Střední — potřebuji řešení brzy</option>
              <option value="HIGH">Vysoká — blokuje mou práci</option>
              <option value="URGENT">Urgentní — kritický výpadek</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Odesílání...' : 'Odeslat požadavek'}
          </button>
          <span className="text-sm text-zinc-400 dark:text-zinc-500">
            Odpovíme obvykle do 24 hodin
          </span>
        </div>
      </form>
    </div>
  );
}
