import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/permissions';
import { notFound } from 'next/navigation';
import { formatTicketNumber } from '@/lib/utils';
import { CommentForm } from '@/components/comment-form';
import { TicketControls } from '@/components/ticket-controls';

export default async function StaffTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole('AGENT', 'ADMIN');
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      status: true,
      category: true,
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!ticket) notFound();

  const [statuses, agents] = await Promise.all([
    prisma.ticketStatus.findMany({ orderBy: { order: 'asc' } }),
    prisma.user.findMany({
      where: { role: { in: ['AGENT', 'ADMIN'] } },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono text-zinc-500">
                {formatTicketNumber(ticket.number)}
              </span>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${ticket.status.color}20`,
                  color: ticket.status.color,
                }}
              >
                {ticket.status.name}
              </span>
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {ticket.title}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Vytvořil: {ticket.createdBy.name || ticket.createdBy.email} ·{' '}
              {new Date(ticket.createdAt).toLocaleString('cs-CZ')}
            </p>
          </div>

          {/* Description */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 mb-6">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {ticket.description}
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Konverzace ({ticket.comments.length})
            </h2>

            {ticket.comments.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4">
                Zatím žádné odpovědi.
              </p>
            ) : (
              <div className="space-y-3">
                {ticket.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`rounded-lg border p-4 ${
                      comment.isInternal
                        ? 'border-yellow-200 dark:border-yellow-800/50 bg-yellow-50/50 dark:bg-yellow-900/10'
                        : comment.author.role !== 'CUSTOMER'
                          ? 'border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {comment.author.name || comment.author.email}
                      </span>
                      {comment.author.role !== 'CUSTOMER' && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400">
                          Staff
                        </span>
                      )}
                      {comment.isInternal && (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 dark:text-yellow-400">
                          Interní
                        </span>
                      )}
                      <span className="text-xs text-zinc-500">
                        {new Date(comment.createdAt).toLocaleString('cs-CZ')}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                      {comment.body}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comment form */}
          <CommentForm ticketId={ticket.id} showInternal />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <TicketControls
            ticketId={ticket.id}
            currentStatusId={ticket.statusId}
            currentAssignedToId={ticket.assignedToId}
            statuses={JSON.parse(JSON.stringify(statuses))}
            agents={agents}
          />
        </div>
      </div>
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
