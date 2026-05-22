import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email/transport";
import { NotificationType } from "@/app/generated/prisma/enums";

interface NotifyOptions {
  type: NotificationType;
  ticketId: string;
  message: string;
  recipientIds: string[];
  emailSubject: string;
  emailBody: string;
}

export async function notify({
  type,
  ticketId,
  message,
  recipientIds,
  emailSubject,
  emailBody,
}: NotifyOptions) {
  // Create in-app notifications
  if (recipientIds.length > 0) {
    await prisma.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        type,
        ticketId,
        message,
      })),
    });
  }

  // Get recipient emails
  const recipients = await prisma.user.findMany({
    where: { id: { in: recipientIds } },
    select: { email: true },
  });

  const emails = recipients.map((r) => r.email);

  if (emails.length > 0) {
    await sendMail({
      to: emails,
      subject: emailSubject,
      text: emailBody,
    });
  }
}

export async function getAgentAndAdminIds(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { role: { in: ["AGENT", "ADMIN"] } },
    select: { id: true },
  });
  return users.map((u) => u.id);
}
