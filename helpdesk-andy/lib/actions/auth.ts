"use server";

import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerSchema, loginSchema } from "@/lib/validations";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

export async function registerAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Uživatel s tímto e-mailem již existuje" };
  }

  // Create user
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name, email, passwordHash, role: "CUSTOMER" },
  });

  // Auto sign-in after registration
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Registrace proběhla, ale přihlášení selhalo. Zkuste se přihlásit." };
    }
    throw error;
  }

  redirect("/tickets");
}

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await signIn("credentials", {
      email: raw.email,
      password: raw.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Nesprávný e-mail nebo heslo" };
    }
    throw error;
  }

  // Determine redirect based on role
  const user = await prisma.user.findUnique({
    where: { email: raw.email },
    select: { role: true },
  });

  if (user?.role === "CUSTOMER") {
    redirect("/tickets");
  } else {
    redirect("/staff/tickets");
  }
}
