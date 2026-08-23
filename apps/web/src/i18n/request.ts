import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import ru from '../../messages/ru.json';

import { routing } from './routing';

const messagesByLocale = {
  ru,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: messagesByLocale[locale as keyof typeof messagesByLocale],
  };
}); // Скобка закрыта
