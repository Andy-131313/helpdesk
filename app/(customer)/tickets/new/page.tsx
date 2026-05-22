'use client';

import { useActionState } from 'react';
import { createTicket } from '@/lib/actions/tickets';

export default function NewTicketPage() {
  const [state, formAction, pending] = useActionState(createTicket, undefined);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
        Nový požadavek
      </h1>

      <form action={formAction} className="space-y-5">
        {state?.error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
            {state.error}
          </div>
        )}

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Název požadavku
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="Stručný popis problému"
            className="block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Podrobný popis
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={6}
            placeholder="Podrobně popište váš problém nebo požadavek..."
            className="block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
          />
        </div>

        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Priorita
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue="MEDIUM"
            className="block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="LOW">Nízká</option>
            <option value="MEDIUM">Střední</option>
            <option value="HIGH">Vysoká</option>
            <option value="URGENT">Urgentní</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Odesílání...' : 'Odeslat požadavek'}
          </button>
        </div>
      </form>
    </div>
  );
}
