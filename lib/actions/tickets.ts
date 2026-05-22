"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createTicketSchema,
  addCommentSchema,
  changeStatusSchema,
  assignTicketSchema,
} from "@/lib/validations";
import { notify, getAgentAndAdminIds } from "@/lib/notifications";
import { isStaff } from "@/lib/permissions";
import { formatTicketNumber } from "@/lib/utils";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function createTicket(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const raw = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    priority: (formData.get("priority") as string) || "MEDIUM",
    categoryId: (formData.get("categoryId") as string) || undefined,
  };

  const parsed = createTicketSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Get default "Open" status
  const openStatus = await prisma.ticketStatus.findUnique({
    where: { slug: "open" },
  });
  if (!openStatus) {
    return { error: "Systémová chyba: stav 'Open' nenalezen" };
  }

  const ticket = await prisma.ticket.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      statusId: openStatus.id,
      categoryId: parsed.data.categoryId || null,
      createdById: session.user.id,
    },
  });

  // Handle file uploads (non-blocking)
  try {
    const files = formData.getAll("files") as File[];
    const validFiles = files.filter((f) => f instanceof File && f.size > 0 && f.size <= 10 * 1024 * 1024);
    if (validFiles.length > 0) {
      const supabase = getSupabaseAdmin();
      for (const file of validFiles) {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${session.user.id}/${timestamp}-${safeName}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(storagePath, buffer, { contentType: file.type, upsert: false });
        if (!uploadError) {
          await prisma.attachment.create({
            data: {
              fileName: file.name,
              mimeType: file.type,
              size: file.size,
              storagePath,
              ticketId: ticket.id,
              uploadedById: session.user.id,
            },
          });
        }
      }
    }
  } catch (err) {
    console.error("[createTicket] File upload failed:", err);
  }

  // Notify agents (non-blocking — don't let email failures crash ticket creation)
  try {
    const agentIds = await getAgentAndAdminIds();
    await notify({
      type: "TICKET_CREATED",
      ticketId: ticket.id,
      message: `Nový ticket ${formatTicketNumber(ticket.number)}: ${ticket.title}`,
      recipientIds: agentIds.filter((id) => id !== session.user.id),
      emailSubject: `[${formatTicketNumber(ticket.number)}] Nový požadavek: ${ticket.title}`,
      emailBody: `Byl vytvořen nový ticket ${formatTicketNumber(ticket.number)}.\n\nTitulek: ${ticket.title}\nPriorita: ${ticket.priority}\nVytvořil: ${session.user.name || session.user.email}\n\nPopis:\n${ticket.description}`,
    });
  } catch (err) {
    console.error("[createTicket] Notification failed:", err);
  }

  redirect(`/tickets/${ticket.id}`);
}

export async function addComment(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const raw = {
    ticketId: formData.get("ticketId") as string,
    body: formData.get("body") as string,
    isInternal: formData.get("isInternal") === "true",
  };

  const parsed = addCommentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Verify access
  const ticket = await prisma.ticket.findUnique({
    where: { id: parsed.data.ticketId },
    include: { createdBy: true, assignedTo: true },
  });
  if (!ticket) return { error: "Ticket nenalezen" };

  // Customers can only comment on their own tickets
  if (!isStaff(session.user.role) && ticket.createdById !== session.user.id) {
    return { error: "Nemáte oprávnění" };
  }

  // Only staff can post internal comments
  if (parsed.data.isInternal && !isStaff(session.user.role)) {
    return { error: "Nemáte oprávnění pro interní poznámku" };
  }

  await prisma.comment.create({
    data: {
      ticketId: parsed.data.ticketId,
      authorId: session.user.id,
      body: parsed.data.body,
      isInternal: parsed.data.isInternal,
    },
  });

  // Notify based on who commented
  try {
    if (!parsed.data.isInternal) {
      if (isStaff(session.user.role)) {
        // Staff replied → notify customer
        await notify({
          type: "COMMENT_ADDED",
          ticketId: ticket.id,
          message: `Nová odpověď na ticket ${formatTicketNumber(ticket.number)}`,
          recipientIds: [ticket.createdById],
          emailSubject: `[${formatTicketNumber(ticket.number)}] Nová odpověď na váš požadavek`,
          emailBody: `Obdrželi jste novou odpověď na ticket "${ticket.title}".\n\n${parsed.data.body}`,
        });
      } else {
        // Customer replied → notify assigned agent or all agents
        const recipientIds = ticket.assignedToId
          ? [ticket.assignedToId]
          : await getAgentAndAdminIds();
        await notify({
          type: "COMMENT_ADDED",
          ticketId: ticket.id,
          message: `${session.user.name || session.user.email} odpověděl na ${formatTicketNumber(ticket.number)}`,
          recipientIds: recipientIds.filter((id) => id !== session.user.id),
          emailSubject: `[${formatTicketNumber(ticket.number)}] Nový komentář od zákazníka`,
          emailBody: `Zákazník přidal komentář k ticketu "${ticket.title}".\n\n${parsed.data.body}`,
        });
      }
    }
  } catch (err) {
    console.error("[addComment] Notification failed:", err);
  }

  revalidatePath(`/tickets/${ticket.id}`);
  revalidatePath(`/staff/tickets/${ticket.id}`);
  return {};
}

export async function changeTicketStatus(ticketId: string, statusId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isStaff(session.user.role)) {
    return { error: "Nemáte oprávnění" };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { status: true },
  });
  if (!ticket) return { error: "Ticket nenalezen" };

  const newStatus = await prisma.ticketStatus.findUnique({
    where: { id: statusId },
  });
  if (!newStatus) return { error: "Stav nenalezen" };

  try {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        statusId,
        closedAt: newStatus.isClosedState ? new Date() : null,
      },
    });
  } catch (err) {
    console.error("[changeTicketStatus] DB update failed:", err);
    return { error: "Nepodařilo se aktualizovat stav v databázi" };
  }

  // Notify customer about status change
  try {
    await notify({
      type: "STATUS_CHANGED",
      ticketId: ticket.id,
      message: `Stav ticketu ${formatTicketNumber(ticket.number)} změněn na "${newStatus.name}"`,
      recipientIds: [ticket.createdById],
      emailSubject: `[${formatTicketNumber(ticket.number)}] Stav změněn: ${newStatus.name}`,
      emailBody: `Stav vašeho ticketu "${ticket.title}" byl změněn na "${newStatus.name}".`,
    });
  } catch (err) {
    console.error("[changeTicketStatus] Notification failed:", err);
  }

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath(`/staff/tickets/${ticketId}`);
  revalidatePath("/staff/tickets");
  return {};
}

export async function assignTicket(ticketId: string, assignedToId: string | null): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isStaff(session.user.role)) {
    return { error: "Nemáte oprávnění" };
  }

  try {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { assignedToId },
    });
  } catch (err) {
    console.error("[assignTicket] DB update failed:", err);
    return { error: "Nepodařilo se přiřadit ticket" };
  }

  if (assignedToId && assignedToId !== session.user.id) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (ticket) {
      try {
        await notify({
          type: "ASSIGNED",
          ticketId,
          message: `Ticket ${formatTicketNumber(ticket.number)} vám byl přiřazen`,
          recipientIds: [assignedToId],
          emailSubject: `[${formatTicketNumber(ticket.number)}] Přiřazený ticket`,
          emailBody: `Ticket "${ticket.title}" vám byl přiřazen.`,
        });
      } catch (err) {
        console.error("[assignTicket] Notification failed:", err);
      }
    }
  }

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath(`/staff/tickets/${ticketId}`);
  revalidatePath("/staff/tickets");
  return {};
}
