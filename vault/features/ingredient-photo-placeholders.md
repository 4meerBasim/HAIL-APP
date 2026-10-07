# Ingredient photo placeholders

Status: shipped
Summary: Every part card on اصنع وجبتك carries a photograph — the shared placeholder plate until the real shots are exported.

## Details

The ingredient cards on [[menu]] used to show the group's icon repeated on every
card in the step: five rices all wearing the same wheat glyph, told apart by name
alone. The parts of a meal are told apart by sight before they are told apart by
name — white rice against red — so every ingredient in `src/data/ingredients.ts`
now carries an `image`, pointing at `assets/placeholder-dish.jpg`: the same
cream-and-girih stand-in the menu already uses wherever a photograph has not been
shot yet. A card holding one still looks like the app rather than like a missing
file.

Swapping in a real shot is a change to that ingredient's `image` and nothing
else — the same one-line swap the sweets and drinks in `src/data/menu.ts` are
waiting on.

The card's icon tile and its selected-state variant (`cardTile` / `cardTileOn`)
went with the change; the photo occupies that slot now. The step **header** keeps
its group icon — that is a heading, not a card, and one glyph for the whole step
still reads.

## Related
- Page: [[menu]]
- Features: [[ingredient-weights-and-macros]]
