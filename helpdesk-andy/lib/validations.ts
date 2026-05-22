import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Neplatný e-mail"),
  password: z.string().min(1, "Heslo je povinné"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Jméno musí mít alespoň 2 znaky"),
  email: z.string().email("Neplatný e-mail"),
  password: z.string().min(8, "Heslo musí mít alespoň 8 znaků"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hesla se neshodují",
  path: ["confirmPassword"],
});

export const createTicketSchema = z.object({
  title: z.string().min(3, "Název musí mít alespoň 3 znaky").max(200),
  description: z.string().min(10, "Popis musí mít alespoň 10 znaků"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  categoryId: z.string().optional(),
});

export const addCommentSchema = z.object({
  ticketId: z.string(),
  body: z.string().min(1, "Komentář nesmí být prázdný"),
  isInternal: z.boolean().default(false),
});

export const changeStatusSchema = z.object({
  ticketId: z.string(),
  statusId: z.string(),
});

export const assignTicketSchema = z.object({
  ticketId: z.string(),
  assignedToId: z.string().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
