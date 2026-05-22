'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { List, Columns3 } from 'lucide-react';
import { KanbanBoard } from '@/components/kanban-board';
import { formatTicketNumber } from '@/lib/utils';

interface Ticket {
  id: string;
  number: number;
  title: string;
  priority: string;
  statusId: string;
  createdAt: string;
  status: { id: string; name: string; color: string; slug: string };
  category: { id: string; name: string; color: string } | null;
  createdBy: { id: string; name: string | null; email: string };
  assignedTo: { id: string; name: string | null; email: string } | null;
}

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
  tickets: Ticket[];
  statuses: Status[];
  agents: Agent[];
  currentView: string;
  filters: {
    status?: string;
    priority?: string;
    q?: string;
    assignedTo?: string;
  };
}

export function StaffTicketsClient({
  tickets,
  statuses,
  agents,
  currentView,
  filters,
}: Props) {
  const [view, setView] = useState(currentView);
  const router = useRouter();

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${
              view === 'list'
                ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <List className="h-4 w-4" />
            List
          </button>
          <button
            onClick={() => setView('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${
              view === 'board'
                ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Columns3 className="h-4 w-4" />
            Board
          </button>
        </div>

        {/* Filters */}
        <form className="flex items-center gap-2 flex-wrap flex-1">
          <input
            name="q"
            type="text"
            placeholder="Hledat..."
            defaultValue={filters.q || ''}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            name="status"
            defaultValue={filters.status || ''}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
          >
            <option value="">Všechny stavy</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            name="priority"
            defaultValue={filters.priority || ''}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
          >
            <option value="">Všechny priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          <select
            name="assignedTo"
            defaultValue={filters.assignedTo || ''}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
          >
            <option value="">Všichni agenti</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name || a.email}
              </option>
            ))}
          </select>
          <input type="hidden" name="view" value={view} />
          <button
            type="submit"
            className="rounded-lg bg-zinc-200 dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700"
          >
            Filtrovat
          </button>
        </form>
      </div>

      {/* Content */}
      {view === 'board' ? (
        <KanbanBoard tickets={tickets} statuses={statuses} />
      ) : (
        <TicketListView tickets={tickets} />
      )}
    </div>
  );
}

function TicketListView({ tickets }: { tickets: Ticket[] }) {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-500 dark:text-zinc-400">
          Žádné tickety nenalezeny.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
              #
            </th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
              Název
            </th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
              Stav
            </th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
              Priorita
            </th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
              Autor
            </th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
              Přiřazeno
            </th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
              Datum
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/staff/tickets/${ticket.id}`}
                  className="font-mono text-zinc-500 hover:text-blue-600"
                >
                  {formatTicketNumber(ticket.number)}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/staff/tickets/${ticket.id}`}
                  className="font-medium text-zinc-900 dark:text-zinc-50 hover:text-blue-600"
                >
                  {ticket.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    backgroundColor: `${ticket.status.color}20`,
                    color: ticket.status.color,
                  }}
                >
                  {ticket.status.name}
                </span>
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={ticket.priority} />
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {ticket.createdBy.name || ticket.createdBy.email}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {ticket.assignedTo?.name || ticket.assignedTo?.email || '—'}
              </td>
              <td className="px-4 py-3 text-zinc-500 text-xs">
                {new Date(ticket.createdAt).toLocaleDateString('cs-CZ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    LOW: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${colors[priority] || colors.MEDIUM}`}
    >
      {priority}
    </span>
  );
}
