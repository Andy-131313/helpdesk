import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/permissions';
import { StaffTicketsClient } from '@/components/staff-tickets-client';

export default async function StaffTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    status?: string;
    priority?: string;
    q?: string;
    assignedTo?: string;
  }>;
}) {
  await requireRole('AGENT', 'ADMIN');

  const params = await searchParams;

  const where: Record<string, unknown> = {};
  if (params.status) where.status = { slug: params.status };
  if (params.priority) where.priority = params.priority;
  if (params.assignedTo) where.assignedToId = params.assignedTo;
  if (params.q) where.title = { contains: params.q, mode: 'insensitive' };

  const [tickets, statuses, agents] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        status: true,
        category: true,
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.ticketStatus.findMany({ orderBy: { order: 'asc' } }),
    prisma.user.findMany({
      where: { role: { in: ['AGENT', 'ADMIN'] } },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const view = params.view || 'list';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Všechny tickety
        </h1>
      </div>

      <StaffTicketsClient
        tickets={JSON.parse(JSON.stringify(tickets))}
        statuses={JSON.parse(JSON.stringify(statuses))}
        agents={agents}
        currentView={view}
        filters={params}
      />
    </div>
  );
}
