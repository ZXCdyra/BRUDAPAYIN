import { NextResponse } from 'next/server';

const RU_BANKS = [
  'СберБанк', 'Т-Банк', 'Альфа-Банк', 'ВТБ', 'Газпромбанк',
  'Райффайзенбанк', 'Россельхозбанк', 'Московский кредитный банк', 'Совкомбанк',
  'Росбанк', 'Открытие', 'Почта Банк', 'Промсвязьбанк', 'РНКБ',
  'МТС Банк', 'Ак Барс', 'Уралсиб', 'Санкт-Петербург', 'Хоум Банк',
];

export async function GET() {
  return NextResponse.json({
    items: RU_BANKS.map((name, i) => ({
      id: String(i + 1),
      name,
      type: 'BANK',
      active: true,
      country_code: 'RU',
    })),
    total: RU_BANKS.length,
  });
}
