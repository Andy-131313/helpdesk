import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { formatTicketNumber } from '@/lib/utils';

export default async function CustomerTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const params = await searchParams;

  const where: Record<string, unknown> = { createdById: session.user.id };

  if (params.status) {
    where.status = { slug: params.status };
  }
  if (params.priority) {
    where.priority = params.priority;
  }
  if (params.q) {
    where.title = { contains: params.q, mode: 'insensitive' };
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: { status: true, category: true },
    orderBy: { createdAt: 'desc' },
  });

  const statuses = await prisma.ticketStatus.findMany({
    orderBy: { order: 'asc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Moje požadavky
        </h1>
        <Link
          href="/tickets/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Nový požadavek
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <form className="flex items-center gap-2 flex-wrap">
          <input
            name="q"
            type="text"
            placeholder="Hledat..."
            defaultValue={params.q || ''}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            name="status"
            defaultValue={params.status || ''}
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
            defaultValue={params.priority || ''}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
          >
            <option value="">Všechny priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-zinc-200 dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700"
          >
            Filtrovat
          </button>
        </form>
      </div>

      {/* Ticket list */}
      {tickets.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            Zatím nemáte žádné požadavky.
          </p>
          <Link
            href="/tickets/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Vytvořit první požadavek
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="block rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-zinc-500">
                      {formatTicketNumber(ticket.number)}
                    </span>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: `${ticket.status.color}20`,
                        color: ticket.status.color,
                      }}
                    >
                      {ticket.status.name}
                    </span>
                    {ticket.category && (
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          backgroundColor: `${ticket.category.color}20`,
                          color: ticket.category.color,
                        }}
                      >
                        {ticket.category.name}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
                    {ticket.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={ticket.priority} />
                  <span className="text-xs text-zinc-500">
                    {new Date(ticket.createdAt).toLocaleDateString('cs-CZ')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
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
