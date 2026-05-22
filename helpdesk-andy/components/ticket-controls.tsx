'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { changeTicketStatus, assignTicket } from '@/lib/actions/tickets';

interface Status {
  id: string;
  name: string;
  slug: string;
  color: string;
  order: number;
}

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

interface Props {
  ticketId: string;
  currentStatusId: string;
  currentAssignedToId: string | null;
  statuses: Status[];
  agents: Agent[];
}

export function TicketControls({
  ticketId,
  currentStatusId,
  currentAssignedToId,
  statuses,
  agents,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatusId = e.target.value;
    if (newStatusId === currentStatusId) return;

    startTransition(async () => {
      try {
        await changeTicketStatus(ticketId, newStatusId);
        toast.success('Stav byl změněn');
      } catch {
        toast.error('Nepodařilo se změnit stav');
      }
    });
  }

  function handleAssignChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newAssignedToId = e.target.value || null;
    if (newAssignedToId === currentAssignedToId) return;

    startTransition(async () => {
      try {
        await assignTicket(ticketId, newAssignedToId);
        toast.success('Ticket byl přiřazen');
      } catch {
        toast.error('Nepodařilo se přiřadit ticket');
      }
    });
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-4 sticky top-20">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Správa ticketu
      </h3>

      <div>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
          Stav
        </label>
        <select
          value={currentStatusId}
          onChange={handleStatusChange}
          disabled={isPending}
          className="block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        >
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
          Přiřazeno
        </label>
        <select
          value={currentAssignedToId || ''}
          onChange={handleAssignChange}
          disabled={isPending}
          className="block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">Nepřiřazeno</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name || a.email}
            </option>
          ))}
        </select>
      </div>

      {/* Quick status buttons */}
      <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Rychlé akce
        </p>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s.id}
              disabled={isPending || s.id === currentStatusId}
              onClick={() => {
                startTransition(async () => {
                  try {
                    await changeTicketStatus(ticketId, s.id);
                    toast.success(`Stav změněn na "${s.name}"`);
                  } catch {
                    toast.error('Chyba');
                  }
                });
              }}
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium border transition-opacity disabled:opacity-40"
              style={{
                borderColor: s.color,
                color: s.color,
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
