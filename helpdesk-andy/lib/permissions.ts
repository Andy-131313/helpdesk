import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export type AllowedRole = "CUSTOMER" | "AGENT" | "ADMIN";

const roleHierarchy: Record<AllowedRole, number> = {
  CUSTOMER: 0,
  AGENT: 1,
  ADMIN: 2,
};

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(...roles: AllowedRole[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role as AllowedRole)) {
    redirect("/");
  }
  return session;
}

export function hasMinRole(userRole: string, minRole: AllowedRole): boolean {
  return (
    roleHierarchy[userRole as AllowedRole] >= roleHierarchy[minRole]
  );
}

export function isStaff(role: string): boolean {
  return role === "AGENT" || role === "ADMIN";
}
