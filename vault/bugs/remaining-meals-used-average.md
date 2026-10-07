# Remaining meals used a rounded average

Status: fixed
Found: `src/data/plan.ts` `planProgress`
Summary: Delivered and remaining meals multiplied days by the rounded `mealsPerDayOf` average, so a rotation with uneven days showed a count that did not match what was paid for.

## Details
Progress now walks the real per-day counts over the delivery run, the same way `priceOf` does.

## Related
- Page: [[plans]], [[profile]]
- Feature: [[subscription-pricing]]
