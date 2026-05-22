import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const ticketId = formData.get("ticketId") as string | null;
  const commentId = formData.get("commentId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  // Generate storage path
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${session.user.id}/${timestamp}-${safeName}`;

  // Upload to Supabase Storage
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await getSupabaseAdmin().storage
    .from("attachments")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[Upload] Failed:", uploadError);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  // Save attachment record
  const attachment = await prisma.attachment.create({
    data: {
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      storagePath,
      ticketId: ticketId || null,
      commentId: commentId || null,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json({ attachment });
}
