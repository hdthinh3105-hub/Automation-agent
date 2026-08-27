import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Phase 1+2 seed: just enough to log in and try the Identity Module.
 * Seeding for tickets/knowledge base/etc. will be added in later Phases
 * (see TDD Ngày 6 — "Seed dữ liệu mẫu").
 */
async function main() {
  const email = 'admin@example.com';
  const plainPassword = 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log('✅ Seeded admin user:');
  console.log(`   email:    ${admin.email}`);
  console.log(`   password: ${plainPassword} (change after first login)`);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
