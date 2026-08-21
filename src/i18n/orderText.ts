import { useCallback } from 'react';
import { type Order, daysSince, getDish } from '../data/menu';
import { formatNumber } from './digits';
import { useLanguage } from './LanguageContext';

export interface OrderText {
  dishName: (id: string) => string;
  summarize: (order: Order) => string;
  whenLabel: (order: Order) => string;
}

// Shared by the Orders screen and the past-deliveries list so a receipt reads
// the same in both places — the two drifted apart the moment they each kept
// their own copy of these.
export function useOrderText(): OrderText {
  const { t, lang } = useLanguage();

  const dishName = useCallback(
    (id: string): string => {
      const dish = getDish(id);
      if (!dish) return id;
      return lang === 'ar' ? dish.name : t(`dish.${id}.name`, dish.name);
    },
    [t, lang],
  );

  const summarize = useCallback(
    (order: Order): string =>
      order.lines
        .map((line) =>
          line.qty > 1
            ? `${dishName(line.dishId)} ×${formatNumber(line.qty)}`
            : dishName(line.dishId),
        )
        .join(' + '),
    [dishName],
  );

  // Computed from when the order was placed rather than a fixed i18n key, so a
  // receipt still reads correctly the week after it was written.
  const whenLabel = useCallback(
    (order: Order): string => {
      const days = daysSince(order.placedAt);
      if (days === 0) return t('orders.when.today');
      if (days === 1) return t('orders.when.yesterday');
      return t('orders.when.daysAgo').replace('{n}', formatNumber(days));
    },
    [t],
  );

  return { dishName, summarize, whenLabel };
}
