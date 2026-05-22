import { auth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const attachment = await prisma.attachment.findUnique({
    where: { id },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Generate signed URL (valid for 1 hour)
  const { data, error } = await getSupabaseAdmin().storage
    .from("attachments")
    .createSignedUrl(attachment.storagePath, 3600);

  if (error || !data) {
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
