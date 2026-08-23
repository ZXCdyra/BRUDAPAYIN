/**
 * Ensures core reference currencies (RUB, USDT) and a single OWNER user so an empty
 * database can be configured without full seed.
 * Run after migrate: `npm run db:bootstrap` from repo root.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_OWNER_LOGIN = 'owner';
const DEFAULT_OWNER_PASSWORD = 'admin123';

const CORE_CURRENCY_CODES = ['RUB', 'USDT'] as const;

async function ensureCoreCurrencies(): Promise<void> {
  for (const code of CORE_CURRENCY_CODES) {
    await prisma.currency.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }
  console.log(`Bootstrap OK: currencies ${CORE_CURRENCY_CODES.join(', ')} ensured.`);
}

async function main() {
  await ensureCoreCurrencies();

  const login = process.env.BOOTSTRAP_OWNER_LOGIN ?? DEFAULT_OWNER_LOGIN;
  const password = process.env.BOOTSTRAP_OWNER_PASSWORD ?? DEFAULT_OWNER_PASSWORD;

  const existing = await prisma.user.findUnique({ where: { login } });
  if (existing) {
    console.log(`Bootstrap skip: user already exists (${login}).`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { login, passwordHash, role: 'OWNER' },
  });

  console.log(`Bootstrap OK: OWNER created — ${login}`);
  if (!process.env.BOOTSTRAP_OWNER_PASSWORD) {
    console.log(`Default password: ${DEFAULT_OWNER_PASSWORD} (set BOOTSTRAP_OWNER_PASSWORD to override)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
