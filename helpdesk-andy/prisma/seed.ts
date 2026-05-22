import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const DEFAULT_STATUSES = [
  { name: "Open", slug: "open", color: "#3b82f6", order: 0, isSystem: true, isClosedState: false },
  { name: "In Progress", slug: "in-progress", color: "#f59e0b", order: 1, isSystem: true, isClosedState: false },
  { name: "Pending Customer Feedback", slug: "pending-customer-feedback", color: "#8b5cf6", order: 2, isSystem: true, isClosedState: false },
  { name: "Resolved", slug: "resolved", color: "#10b981", order: 3, isSystem: true, isClosedState: false },
  { name: "Closed", slug: "closed", color: "#6b7280", order: 4, isSystem: true, isClosedState: true },
];

async function main() {
  console.log("Seeding database...");

  // Create default statuses
  for (const status of DEFAULT_STATUSES) {
    await prisma.ticketStatus.upsert({
      where: { slug: status.slug },
      update: {},
      create: status,
    });
  }
  console.log(`✓ Created ${DEFAULT_STATUSES.length} default statuses`);

  // Create initial admin
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "changeme123";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`✓ Created admin user: ${adminEmail}`);
  } else {
    console.log(`✓ Admin user already exists: ${adminEmail}`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
