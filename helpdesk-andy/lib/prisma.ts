import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getConnectionUrl() {
  const url = process.env.DATABASE_URL!;
  // Add SSL for production (Vercel -> Supabase)
  if (process.env.NODE_ENV === "production" && !url.includes("sslmode")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}sslmode=require`;
  }
  return url;
}

function createPrismaClient() {
  const adapter = new PrismaPg(getConnectionUrl());
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
