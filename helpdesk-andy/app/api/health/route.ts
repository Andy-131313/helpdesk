import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test database connection
    const result = await prisma.user.count();
    return NextResponse.json({ status: "ok", userCount: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { status: "error", message, stack },
      { status: 500 }
    );
  }
}
