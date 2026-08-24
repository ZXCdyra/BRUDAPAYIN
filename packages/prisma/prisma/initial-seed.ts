import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Running initial seed...');

  // 1. Create admin user
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      login: 'admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.login);

  // 2. Create basic currencies
  const [rub, usdt] = await Promise.all([
    prisma.currency.upsert({
      where: { code: 'RUB' },
      update: {},
      create: {
        code: 'RUB',
        isActive: true,
      },
    }),
    prisma.currency.upsert({
      where: { code: 'USDT' },
      update: {},
      create: {
        code: 'USDT',
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Currencies created:', rub.code, usdt.code);

  // 3. Create Russia country
  await prisma.country.upsert({
    where: { code: 'RU' },
    update: {},
    create: {
      name: 'Russia',
      code: 'RU',
      currencyId: rub.id,
      isActive: true,
    },
  });
  console.log('✅ Country created: RU');

  // 4. Create basic payment methods
  const [cardPM, ibanPM] = await Promise.all([
    prisma.paymentMethod.upsert({
      where: { name: 'CARD_RU' },
      update: {},
      create: {
        name: 'CARD_RU',
        displayName: 'Карта РФ',
        countryId: (await prisma.country.findUnique({ where: { code: 'RU' } })).id,
        flowType: 'P2P',
        requisiteType: 'CARD',
        availability: 'BOTH',
        isActive: true,
      },
    }),
    prisma.paymentMethod.upsert({
      where: { name: 'IBAN_RU' },
      update: {},
      create: {
        name: 'IBAN_RU',
        displayName: 'Счет РФ (IBAN)',
        countryId: (await prisma.country.findUnique({ where: { code: 'RU' } })).id,
        flowType: 'P2P',
        requisiteType: 'IBAN',
        availability: 'BOTH',
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Payment methods created:', cardPM.name, ibanPM.name);

  // 5. Create default platform settings
  await prisma.platformSettings.upsert({
    where: { key: 'payout_pool_global_percent' },
    update: {},
    create: {
      key: 'payout_pool_global_percent',
      value: '0',
    },
  });
  console.log('✅ Platform settings created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
