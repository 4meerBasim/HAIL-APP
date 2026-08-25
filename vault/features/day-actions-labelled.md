# Labelled day actions

Status: shipped
Summary: Postpone, skip and undo on an upcoming delivery are labelled pills instead of bare glyphs.

## Details
`UpcomingDays` showed two 17px muted icons in circles — a clock and a skip-forward arrow, no text. A clock reads as "when is this"; a skip arrow reads as "next". Neither says the tap moves or cancels a delivery.

Now `[ 🕐 تأجيل ]`, `[ ⏭ تخطّي ]` and `[ ↩ تراجع ]`. Icons dropped to 14px so the glyph sits beside the word rather than competing with it; 30pt pills keep the target past 44pt with the existing `hitSlop`. The disabled postpone state fades the label too, which it did not before.

## Related
- Page: [[upcoming]]
