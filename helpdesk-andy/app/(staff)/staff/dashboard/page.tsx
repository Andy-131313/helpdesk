import { requireRole } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  await requireRole('AGENT', 'ADMIN');

  const [
    totalTickets,
    openTickets,
    inProgressTickets,
    pendingTickets,
    resolvedTickets,
    closedTickets,
    byPriority,
    recentTickets,
  ] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: { slug: 'open' } } }),
    prisma.ticket.count({ where: { status: { slug: 'in-progress' } } }),
    prisma.ticket.count({
      where: { status: { slug: 'pending-customer-feedback' } },
    }),
    prisma.ticket.count({ where: { status: { slug: 'resolved' } } }),
    prisma.ticket.count({ where: { status: { slug: 'closed' } } }),
    prisma.ticket.groupBy({
      by: ['priority'],
      _count: { priority: true },
    }),
    prisma.ticket.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        status: true,
        createdBy: { select: { name: true, email: true } },
      },
    }),
  ]);

  const priorityCounts = Object.fromEntries(
    byPriority.map((p) => [p.priority, p._count.priority]),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
        Dashboard
      </h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Celkem" value={totalTickets} color="#6b7280" />
        <StatCard label="Open" value={openTickets} color="#3b82f6" />
        <StatCard
          label="In Progress"
          value={inProgressTickets}
          color="#f59e0b"
        />
        <StatCard label="Pending" value={pendingTickets} color="#8b5cf6" />
        <StatCard label="Resolved" value={resolvedTickets} color="#10b981" />
        <StatCard label="Closed" value={closedTickets} color="#6b7280" />
      </div>

      {/* Priority breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            Podle priority
          </h2>
          <div className="space-y-3">
            <PriorityRow
              label="Urgent"
              count={priorityCounts.URGENT || 0}
              color="#ef4444"
              total={totalTickets}
            />
            <PriorityRow
              label="High"
              count={priorityCounts.HIGH || 0}
              color="#f97316"
              total={totalTickets}
            />
            <PriorityRow
              label="Medium"
              count={priorityCounts.MEDIUM || 0}
              color="#3b82f6"
              total={totalTickets}
            />
            <PriorityRow
              label="Low"
              count={priorityCounts.LOW || 0}
              color="#6b7280"
              total={totalTickets}
            />
          </div>
        </div>

        {/* Recent tickets */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            Poslední tickety
          </h2>
          <div className="space-y-3">
            {recentTickets.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-zinc-900 dark:text-zinc-50 truncate max-w-[200px]">
                  {t.title}
                </span>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${t.status.color}20`,
                    color: t.status.color,
                  }}
                >
                  {t.status.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <p className="text-xs font-medium text-zinc-500 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function PriorityRow({
  label,
  count,
  color,
  total,
}: {
  label: string;
  count: number;
  color: string;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
        <span className="text-zinc-500">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
