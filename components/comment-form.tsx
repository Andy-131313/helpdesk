'use client';

import { useActionState } from 'react';
import { addComment } from '@/lib/actions/tickets';

export function CommentForm({
  ticketId,
  showInternal = false,
}: {
  ticketId: string;
  showInternal?: boolean;
}) {
  const [state, formAction, pending] = useActionState(addComment, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="ticketId" value={ticketId} />

      {state?.error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          {state.error}
        </div>
      )}

      <div>
        <textarea
          name="body"
          required
          rows={4}
          placeholder="Napište odpověď..."
          className="block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          {showInternal && (
            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                name="isInternal"
                value="true"
                className="rounded border-zinc-300 dark:border-zinc-700"
              />
              Interní poznámka (zákazník neuvidí)
            </label>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Odesílání...' : 'Odpovědět'}
        </button>
      </div>
    </form>
  );
}
