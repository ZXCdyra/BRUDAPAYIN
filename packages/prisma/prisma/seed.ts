import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import {
  encryptMerchantApiSigningSecretForStorage,
  isMerchantSecretSha256FingerprintOnly,
} from './merchant-api-secret-storage';

const prisma = new PrismaClient();

/** Secret column must be AES-256-GCM ciphertext; HmacAuthGuard decrypts and verifies HMAC-SHA512. */
function generateApiKey(direction: 'payin' | 'payout') {
  const publicKey = `pk_${direction}_${crypto.randomBytes(24).toString('hex')}`;
  const secretKey = `sk_${direction}_${crypto.randomBytes(32).toString('hex')}`;
  const secretKeyHash = encryptMerchantApiSigningSecretForStorage(secretKey);
  return { publicKey, secretKey, secretKeyHash };
}

/** Все банки РФ для выбора реквизитов (админ может добавить/скрыть банки через справочник). */
const RU_BANKS = [
  // ─── Крупнейшие розничные ───
  'СберБанк',
  'Т-Банк',
  'Альфа-Банк',
  'ВТБ',
  'Газпромбанк',
  'Райффайзенбанк',
  'Россельхозбанк',
  'Московский кредитный банк',
  'Совкомбанк',
  'Росбанк',
  'Открытие',
  'Почта Банк',
  'Промсвязьбанк',
  'РНКБ',
  'МТС Банк',
  'Ак Барс',
  'Уралсиб',
  'Санкт-Петербург',
  'Хоум Банк',
  'ОТП Банк',
  'Ренессанс Кредит',
  'Кредит Европа Банк',
  'Русский Стандарт',
  'Абсолют Банк',
  'Зенит',
  'Авангард',
  'ДОМ.РФ',
  'СМП Банк',
  'Связь-Банк',
  'ВБРР',
  'УБРиР',
  'СКБ-банк',
  'Запсибкомбанк',
  'Транскапиталбанк',
  'Локо-Банк',
  'Металлинвестбанк',
  'МСП Банк',
  'Новикомбанк',
  'Газэнергобанк',
  // ─── Региональные и универсальные ───
  'Аверс',
  'Агропромкредит',
  'Азиатско-Тихоокеанский Банк',
  'Акибанк',
  'Алмазэргиэнбанк',
  'Приморье',
  'Примсоцбанк',
  'Кубань Кредит',
  'Левобережный',
  'Центр-инвест',
  'Челиндбанк',
  'Челябинвестбанк',
  'Чувашкредитпромбанк',
  'Саровбизнесбанк',
  'Севергазбанк',
  'Солидарность',
  'Таврический Банк',
  'Генбанк',
  'Тимер Банк',
  'Кедр',
  'Крайинвестбанк',
  'Экспобанк',
  'Энерготрансбанк',
  'Юнистрим',
  'Финам Банк',
  'Интерпрогрессбанк',
  'Держава',
  'Морской Банк',
  'Модульбанк',
  'Кредит Урал Банк',
  'БыстроБанк',
  'Вокбанк',
  'Волго-Каспийский Акционерный Банк',
  'Дальневосточный Банк',
  'Девон-Кредит',
  'Заубер Банк',
  'Инвестторгбанк',
  'ИНГ Банк (Евразия)',
  'Коммерцбанк (Евразия)',
  'Кошелев-Банк',
  'Кросна-Банк',
  'Курскпромбанк',
  'Липецккомбанк',
  'Московский областной банк',
  'Национальный Стандарт',
  'Нейва',
  'Норвик Банк',
  'Пойдём!',
  'Тольяттихимбанк',
  'Углеметбанк',
  'Уралприватбанк',
  'Уралфинанс',
  'Уссури',
  'Хлынов',
  'Южный Региональный Банк',
  'Яринтербанк',
  'Ижкомбанк',
  'Интехбанк',
  'Банк Казани',
  'Камкомбанк',
  'Консервативный Коммерческий Банк',
  'Союз',
  'Промсельхозбанк',
  'Руснарбанк',
  'Актив Капитал Банк',
  'Акцепт',
  'Енисейский Объединённый Банк',
  'Земский Банк',
  'НОТА-Банк',
  'ФораБанк',
];

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 12);

  // ─── Users ───
  const owner = await prisma.user.upsert({
    where: { login: 'owner' },
    update: {},
    create: { login: 'owner', passwordHash, role: 'OWNER' },
  });

  const admin = await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: { login: 'admin', passwordHash, role: 'ADMIN' },
  });

  const support = await prisma.user.upsert({
    where: { login: 'support' },
    update: {},
    create: { login: 'support', passwordHash, role: 'SUPPORT' },
  });

  const traderUser = await prisma.user.upsert({
    where: { login: 'trader' },
    update: {},
    create: { login: 'trader', passwordHash, role: 'TRADER' },
  });

  const merchantUser = await prisma.user.upsert({
    where: { login: 'merchant' },
    update: {},
    create: { login: 'merchant', passwordHash, role: 'MERCHANT' },
  });

  const referralUser = await prisma.user.upsert({
    where: { login: 'referral' },
    update: {},
    create: { login: 'referral', passwordHash, role: 'REFERRAL' },
  });

  // ─── Currencies (RF market: RUB + USDT only) ───
  for (const code of ['RUB', 'USDT']) {
    await prisma.currency.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }

  const rubRow = await prisma.currency.findUniqueOrThrow({ where: { code: 'RUB' } });
  const usdtRow = await prisma.currency.findUniqueOrThrow({ where: { code: 'USDT' } });

  // ─── Referral Profile ───
  const referralProfile = await prisma.referralProfile.upsert({
    where: { userId: referralUser.id },
    update: {},
    create: {
      userId: referralUser.id,
      referralPercent: 5,
      currencyId: rubRow.id,
    },
  });

  // ─── Trader Profile & Balance ───
  const traderProfile = await prisma.traderProfile.upsert({
    where: { userId: traderUser.id },
    update: {},
    create: {
      userId: traderUser.id,
      payoutMinLimit: 500,
      payoutMaxLimit: 150000,
    },
  });

  await prisma.traderBalance.upsert({
    where: { traderId_currencyId: { traderId: traderProfile.id, currencyId: rubRow.id } },
    update: {},
    create: { traderId: traderProfile.id, currencyId: rubRow.id, amount: 500000 },
  });

  await prisma.traderBalance.upsert({
    where: { traderId_currencyId: { traderId: traderProfile.id, currencyId: usdtRow.id } },
    update: {},
    create: { traderId: traderProfile.id, currencyId: usdtRow.id, amount: 1000 },
  });

  // ─── Merchant & Balance ───
  const merchant = await prisma.merchant.upsert({
    where: { userId: merchantUser.id },
    update: {},
    create: { userId: merchantUser.id, name: 'Test Merchant' },
  });

  await prisma.merchantBalance.upsert({
    where: { merchantId_currencyId: { merchantId: merchant.id, currencyId: usdtRow.id } },
    update: {},
    create: { merchantId: merchant.id, currencyId: usdtRow.id, amount: 10000 },
  });

  await prisma.merchantBalance.upsert({
    where: { merchantId_currencyId: { merchantId: merchant.id, currencyId: rubRow.id } },
    update: {},
    create: { merchantId: merchant.id, currencyId: rubRow.id, amount: 5000000 },
  });

  // ─── API Keys (encrypted at rest — same codec as MerchantService / HmacAuthGuard) ───
  let existingPayinKey = await prisma.merchantApiKey.findFirst({
    where: { merchantId: merchant.id, direction: 'PAYIN', isActive: true },
  });
  let existingPayoutKey = await prisma.merchantApiKey.findFirst({
    where: { merchantId: merchant.id, direction: 'PAYOUT', isActive: true },
  });

  const mustReplaceUndecryptableMerchantKeys =
    (existingPayinKey != null && isMerchantSecretSha256FingerprintOnly(existingPayinKey.secretKeyHash)) ||
    (existingPayoutKey != null && isMerchantSecretSha256FingerprintOnly(existingPayoutKey.secretKeyHash));

  if (mustReplaceUndecryptableMerchantKeys) {
    console.warn(
      '[seed] Removing undecryptable merchant API keys (SHA256-only fingerprints). Recreating encrypted keys.',
    );
    await prisma.merchantApiKey.deleteMany({ where: { merchantId: merchant.id } });
    existingPayinKey = null;
    existingPayoutKey = null;
  }

  let payinKeys: { publicKey: string; secretKey: string };
  let payoutKeys: { publicKey: string; secretKey: string };

  if (!existingPayinKey) {
    const keys = generateApiKey('payin');
    await prisma.merchantApiKey.create({
      data: {
        merchantId: merchant.id,
        direction: 'PAYIN',
        publicKey: keys.publicKey,
        secretKeyHash: keys.secretKeyHash,
      },
    });
    payinKeys = { publicKey: keys.publicKey, secretKey: keys.secretKey };
  } else {
    payinKeys = {
      publicKey: existingPayinKey.publicKey,
      secretKey: '(unchanged — regenerate from admin cabinet if lost)',
    };
  }

  if (!existingPayoutKey) {
    const keys = generateApiKey('payout');
    await prisma.merchantApiKey.create({
      data: {
        merchantId: merchant.id,
        direction: 'PAYOUT',
        publicKey: keys.publicKey,
        secretKeyHash: keys.secretKeyHash,
      },
    });
    payoutKeys = { publicKey: keys.publicKey, secretKey: keys.secretKey };
  } else {
    payoutKeys = {
      publicKey: existingPayoutKey.publicKey,
      secretKey: '(unchanged — regenerate from admin cabinet if lost)',
    };
  }


  // ─── Country (RF market) ───
  const russia = await prisma.country.upsert({
    where: { code: 'RU' },
    update: { name: 'Россия', currencyId: rubRow.id },
    create: { name: 'Россия', code: 'RU', currencyId: rubRow.id },
  });

  // ─── Pay-Out specialist user (pool B cabinet) ───
  const payoutCabinetUser = await prisma.user.upsert({
    where: { login: 'payout' },
    update: {},
    create: {
      login: 'payout',
      passwordHash,
      role: 'PAYOUT_TRADER',
    },
  });

  const payoutTraderProfileSeed = await prisma.payoutTraderProfile.upsert({
    where: { userId: payoutCabinetUser.id },
    update: { countryId: russia.id },
    create: {
      userId: payoutCabinetUser.id,
      countryId: russia.id,
      payoutRate: 0,
      balanceUsdt: 500,
    },
  });

  await prisma.payoutTraderTelegramSettings.upsert({
    where: { payoutTraderId: payoutTraderProfileSeed.id },
    update: {},
    create: {
      payoutTraderId: payoutTraderProfileSeed.id,
      notifyNewPoolOrder: true,
      notifySettlement: true,
    },
  });

  // ─── Payment Methods ───
  const cardP2P = await prisma.paymentMethod.upsert({
    where: { name: 'CARD_P2P' },
    update: { countryId: russia.id, displayName: 'Карта P2P' },
    create: {
      countryId: russia.id,
      name: 'CARD_P2P',
      displayName: 'Карта P2P',
      flowType: 'P2P',
      requisiteType: 'CARD',
      availability: 'BOTH',
    },
  });

  const sbpP2P = await prisma.paymentMethod.upsert({
    where: { name: 'SBP_P2P' },
    update: { countryId: russia.id, displayName: 'СБП' },
    create: {
      countryId: russia.id,
      name: 'SBP_P2P',
      displayName: 'СБП',
      flowType: 'P2P',
      requisiteType: 'CARD',
      availability: 'BOTH',
    },
  });
  void sbpP2P;

  // ─── Merchant Directions + Commission Tiers ───
  const payinDir = await prisma.merchantDirection.upsert({
    where: {
      merchantId_directionType_currencyId: {
        merchantId: merchant.id,
        directionType: 'PAYIN',
        currencyId: rubRow.id,
      },
    },
    update: {},
    create: {
      merchantId: merchant.id,
      paymentMethodId: cardP2P.id,
      directionType: 'PAYIN',
      currencyId: rubRow.id,
      minAmount: 500,
      maxAmount: 500000,
      defaultCommissionPercent: 5,
    },
  });

  // Tiered commission: up to 100k = 5%, 100k+ = 4%
  const existingTiers = await prisma.merchantCommissionTier.count({
    where: { merchantDirectionId: payinDir.id },
  });
  if (existingTiers === 0) {
    await prisma.merchantCommissionTier.createMany({
      data: [
        { merchantDirectionId: payinDir.id, amountFrom: 0, amountTo: 100000, commissionPercent: 5 },
        { merchantDirectionId: payinDir.id, amountFrom: 100001, amountTo: null, commissionPercent: 4 },
      ],
    });
  }

  // ─── Directions (idempotent) ───
  const directions = [
    {
      name: 'PayIn RUB → USDT',
      type: 'PAYIN' as const,
      fromCurrencyId: rubRow.id,
      toCurrencyId: usdtRow.id,
      minAmount: 500,
      maxAmount: 500000,
      percentFee: 5,
    },
    {
      name: 'PayOut USDT → RUB',
      type: 'PAYOUT' as const,
      fromCurrencyId: usdtRow.id,
      toCurrencyId: rubRow.id,
      minAmount: 500,
      maxAmount: 150000,
      percentFee: 3,
    },
  ];

  for (const d of directions) {
    const existing = await prisma.direction.findFirst({
      where: {
        type: d.type,
        fromCurrencyId: d.fromCurrencyId,
        toCurrencyId: d.toCurrencyId,
      },
    });
    if (!existing) {
      await prisma.direction.create({
        data: {
          name: d.name,
          type: d.type,
          fromCurrencyId: d.fromCurrencyId,
          toCurrencyId: d.toCurrencyId,
          minAmount: d.minAmount,
          maxAmount: d.maxAmount,
          percentFee: d.percentFee,
          isOnline: true,
        },
      });
    }
  }

  // ─── Banks (все банки РФ) ───
  const bankRecords: Record<string, { id: number }> = {};
  for (const name of RU_BANKS) {
    const existingBank = await prisma.bank.findFirst({ where: { name } });
    const bank = existingBank
      ? await prisma.bank.update({ where: { id: existingBank.id }, data: { isActive: true } })
      : await prisma.bank.create({ data: { name } });
    bankRecords[name] = bank;
  }

  // ─── Requisites (idempotent) ───
  const existingReqs = await prisma.requisite.count({ where: { traderId: traderProfile.id } });
  if (existingReqs === 0) {
    const seedGroup = await prisma.requisiteGroup.create({
      data: {
        traderId: traderProfile.id,
        name: 'Seed RUB',
        currencyId: rubRow.id,
        paymentMethodId: cardP2P.id,
      },
    });
    await prisma.requisite.createMany({
      data: [
        {
          traderId: traderProfile.id,
          requisiteGroupId: seedGroup.id,
          type: 'CARD',
          number: '4276550012345678',
          numberNormalized: '4276550012345678',
          owner: 'Test Trader',
          cardHolderName: 'Иванов Иван Иванович',
          bankId: bankRecords['СберБанк'].id,
          currencyId: rubRow.id,
          minAmount: 500,
          maxAmount: 300000,
          limitTotalAmount: 3000000,
          limitTotalOps: 100,
        },
        {
          traderId: traderProfile.id,
          requisiteGroupId: seedGroup.id,
          type: 'CARD',
          number: '5536913876543210',
          numberNormalized: '5536913876543210',
          owner: 'Test Trader',
          cardHolderName: 'Петрова Мария Сергеевна',
          bankId: bankRecords['Т-Банк'].id,
          currencyId: rubRow.id,
          minAmount: 500,
          maxAmount: 200000,
          limitTotalAmount: 2000000,
          limitTotalOps: 50,
        },
      ],
    });
  }

  // ─── Telegram Settings ───
  await prisma.telegramSettings.upsert({
    where: { traderId: traderProfile.id },
    update: {},
    create: {
      traderId: traderProfile.id,
      notifyPayin: true,
      notifyPayout: true,
      notifyAppeals: true,
    },
  });

  // ─── Sample Pay-In Orders ───
  const existingPayins = await prisma.payinOrder.count({ where: { merchantId: merchant.id } });
  if (existingPayins === 0) {
    const requisite = await prisma.requisite.findFirst({ where: { traderId: traderProfile.id } });
    const statuses = ['PAID', 'NEW', 'VERIFIED', 'CANCELED', 'PAID', 'PAID'] as const;
    for (let i = 0; i < statuses.length; i++) {
      await prisma.payinOrder.create({
        data: {
          requestId: `test-payin-${i + 1}`,
          merchantId: merchant.id,
          traderId: traderProfile.id,
          requisiteId: requisite?.id,
          amount: 5000 + i * 2500,
          currencyId: rubRow.id,
          commission: (5000 + i * 2500) * 0.05,
          partnerAmount: (5000 + i * 2500) * 0.024,
          rate: 0.024,
          status: statuses[i],
          autocloseAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });
    }
  }

  // ─── Link trader to referral agent ───
  await prisma.user.update({
    where: { id: traderUser.id },
    data: { referredById: referralProfile.id },
  });

  // ─── Sample Pay-Out Orders ───
  const existingPayouts = await prisma.payoutOrder.count({ where: { merchantId: merchant.id } });
  if (existingPayouts === 0) {
    // Assigned orders (have a trader)
    const assignedStatuses = ['COMPLETED', 'NEW', 'PROCESSING'] as const;
    for (let i = 0; i < assignedStatuses.length; i++) {
      await prisma.payoutOrder.create({
        data: {
          requestId: `test-payout-${i + 1}`,
          merchantId: merchant.id,
          traderId: traderProfile.id,
          amount: 5000 + i * 2500,
          currencyId: rubRow.id,
          status: assignedStatuses[i],
          detailsType: 'CARD',
          detailsNumber: '4276550012345678',
          detailsOwner: 'Иванов Иван Иванович',
          rate: 1,
          partnerAmount: (5000 + i * 2500) * 0.97,
          percentFee: 3,
        },
      });
    }

    // Pool orders — PENDING with no traderId (visible to traders in pool)
    const poolAmounts = [5000, 20000, 60000, 90000, 120000];
    for (let i = 0; i < poolAmounts.length; i++) {
      await prisma.payoutOrder.create({
        data: {
          requestId: `test-payout-pool-${i + 1}`,
          merchantId: merchant.id,
          traderId: null,
          amount: poolAmounts[i],
          currencyId: rubRow.id,
          status: 'PENDING',
          detailsType: 'CARD',
          detailsNumber: '5536913876543210',
          detailsOwner: 'Получатель из пула',
          rate: 1,
          partnerAmount: poolAmounts[i] * 0.97,
          percentFee: 3,
        },
      });
    }
  }

  console.log('');
  console.log('=== Seed Complete ===');
  console.log('');
  console.log('Тестовые аккаунты (пароль: admin123):');
  console.log('  Owner:    owner');
  console.log('  Admin:    admin');
  console.log('  Support:  support');
  console.log('  Trader:         trader     (лимиты выплат: 500–150000 RUB)');
  console.log('  Payout-спец.:   payout     (пул B, RU, 500 USDT)');
  console.log('  Merchant:       merchant');
  console.log('  Referral:       referral   (5% комиссия, трейдер привязан)');
  console.log('');
  console.log(`Гео/Платежи: Россия (RU/RUB) → Карта P2P, СБП; банков в справочнике: ${RU_BANKS.length}`);
  console.log('Направление мерчанта: PAYIN/RUB, тиры: 0–100k=5%, 100k+=4%');
  console.log('');
  console.log('Pay-In API Key:  ', payinKeys.publicKey);
  console.log('Pay-In Secret:   ', payinKeys.secretKey);
  console.log('Pay-Out API Key: ', payoutKeys.publicKey);
  console.log('Pay-Out Secret:  ', payoutKeys.secretKey);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
