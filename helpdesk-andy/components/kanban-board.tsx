'use client';

import { useState, useOptimistic, useTransition } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import Link from 'next/link';
import { toast } from 'sonner';
import { changeTicketStatus } from '@/lib/actions/tickets';
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

interface Props {
  tickets: Ticket[];
  statuses: Status[];
}

export function KanbanBoard({ tickets: initialTickets, statuses }: Props) {
  const [tickets, setTickets] = useState(initialTickets);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  function handleDragStart(event: DragStartEvent) {
    const ticket = tickets.find((t) => t.id === event.active.id);
    if (ticket) setActiveTicket(ticket);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTicket(null);

    const { active, over } = event;
    if (!over) return;

    const ticketId = active.id as string;
    const newStatusId = over.id as string;

    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.statusId === newStatusId) return;

    const newStatus = statuses.find((s) => s.id === newStatusId);
    if (!newStatus) return;

    // Optimistic update
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              statusId: newStatusId,
              status: newStatus as Ticket['status'],
            }
          : t,
      ),
    );

    // Server action
    startTransition(async () => {
      try {
        await changeTicketStatus(ticketId, newStatusId);
        toast.success(`Stav změněn na "${newStatus.name}"`);
      } catch (error) {
        // Rollback
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? { ...t, statusId: ticket.statusId, status: ticket.status }
              : t,
          ),
        );
        toast.error('Nepodařilo se změnit stav');
      }
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => {
          const columnTickets = tickets.filter((t) => t.statusId === status.id);
          return (
            <KanbanColumn
              key={status.id}
              status={status}
              tickets={columnTickets}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeTicket && <TicketCard ticket={activeTicket} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  tickets,
}: {
  status: Status;
  tickets: Ticket[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 rounded-lg border ${
        isOver
          ? 'border-blue-400 bg-blue-50/50 dark:border-blue-600 dark:bg-blue-900/10'
          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30'
      }`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 p-3 border-b border-zinc-200 dark:border-zinc-800">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: status.color }}
        />
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {status.name}
        </span>
        <span className="ml-auto text-xs text-zinc-500 bg-zinc-200 dark:bg-zinc-800 rounded-full px-1.5 py-0.5">
          {tickets.length}
        </span>
      </div>

      {/* Cards */}
      <SortableContext
        items={tickets.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="p-2 space-y-2 min-h-[100px]">
          {tickets.map((ticket) => (
            <SortableTicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableTicketCard({ ticket }: { ticket: Ticket }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TicketCard ticket={ticket} />
    </div>
  );
}

function TicketCard({
  ticket,
  isDragging = false,
}: {
  ticket: Ticket;
  isDragging?: boolean;
}) {
  const priorityColors: Record<string, string> = {
    LOW: 'border-l-zinc-300',
    MEDIUM: 'border-l-blue-400',
    HIGH: 'border-l-orange-400',
    URGENT: 'border-l-red-500',
  };

  return (
    <div
      className={`rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 border-l-[3px] ${
        priorityColors[ticket.priority] || ''
      } ${isDragging ? 'shadow-lg rotate-2' : 'shadow-sm hover:shadow-md'} transition-shadow cursor-grab active:cursor-grabbing`}
    >
      <Link
        href={`/staff/tickets/${ticket.id}`}
        className="block"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[11px] font-mono text-zinc-500">
            {formatTicketNumber(ticket.number)}
          </span>
        </div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 line-clamp-2 mb-2">
          {ticket.title}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            {ticket.assignedTo?.name ||
              ticket.assignedTo?.email ||
              'Nepřiřazeno'}
          </span>
          <span className="text-[11px] text-zinc-500">
            {new Date(ticket.createdAt).toLocaleDateString('cs-CZ')}
          </span>
        </div>
      </Link>
    </div>
  );
}
