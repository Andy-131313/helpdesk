import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    results.userCount = await prisma.user.count();
    results.statusCount = await prisma.ticketStatus.count();
    results.ticketCount = await prisma.ticket.count();
    results.notificationCount = await prisma.notification.count();
    return NextResponse.json({ status: "ok", ...results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack?.split("\n").slice(0, 5).join("\n") : undefined;
    return NextResponse.json(
      { status: "error", message, stack, partialResults: results },
      { status: 500 }
    );
  }
}
