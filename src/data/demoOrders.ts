import type { Order, OrderLine } from './menu';

const DAY = 86_400_000;

// Placeholder delivery history, so the past-deliveries card and its time
// filters have something to show before any real order has been placed.
// Offsets are picked to land orders in every filter window: two inside the
// week, two more inside the month, two beyond it.
//
// Ids stop at 4820 on purpose — `nextOrderId` continues from the highest one,
// so the first order a customer actually places is still #4821.
//
// To ship without this: delete this file and its import in OrdersContext.
const SEED: { id: string; daysAgo: number; lines: OrderLine[] }[] = [
  {
    id: '4820',
    daysAgo: 2,
    lines: [
      { dishId: 'quzi', qty: 1 },
      { dishId: 'noodles', qty: 1 },
    ],
  },
  {
    id: '4819',
    daysAgo: 5,
    lines: [
      { dishId: 'dolma', qty: 1 },
      { dishId: 'lasagna', qty: 1 },
    ],
  },
  {
    id: '4818',
    daysAgo: 12,
    lines: [{ dishId: 'half-chicken', qty: 2 }],
  },
  {
    id: '4817',
    daysAgo: 26,
    lines: [
      { dishId: 'tashreeb', qty: 1 },
      { dishId: 'maqluba-chicken', qty: 1 },
      { dishId: 'rice-stews', qty: 1 },
    ],
  },
  {
    id: '4816',
    daysAgo: 47,
    lines: [
      { dishId: 'biryani', qty: 1 },
      { dishId: 'fish', qty: 1 },
    ],
  },
  {
    id: '4815',
    daysAgo: 63,
    lines: [
      { dishId: 'burger', qty: 2 },
      { dishId: 'pasta', qty: 1 },
    ],
  },
];

// Every one is `delivered` — a fake order in flight would put a tracking card
// and a live status dot on a screen where nothing is actually being delivered.
export const demoOrders = (now: number = Date.now()): Order[] =>
  SEED.map((seed) => ({
    id: seed.id,
    status: 'delivered' as const,
    placedAt: now - seed.daysAgo * DAY,
    lines: seed.lines,
  }));
