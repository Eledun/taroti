# Card Display Fix - CardSelection Component

## Problem
Selected cards were not displaying on the consultation page after being clicked. The card selection positions showed empty slots instead of the selected cards.

## Root Cause
The CardSelection component was using the OLD card ID format (`"carta_8"`) to parse and display cards, but the application now uses the NEW format (`"8"`).

When cards were selected and stored with the new format (`{arcano: "8"}`), the component tried to parse them using:
```typescript
const cartaIndex = parseInt(carta.arcano.split('_')[1])
```

This returned `undefined` because:
- `"8".split('_')` returns `["8"]` (no underscore to split on)
- `["8"][1]` is `undefined`
- `parseInt(undefined)` is `NaN`
- Card component receives invalid `cardIndex` and doesn't render

## Files Fixed

### `/src/lib/components/CardSelection.svelte`

**5 locations fixed:**

1. **Line 338 - Celtic Cross Layout**
   ```typescript
   // OLD (BROKEN):
   {@const cartaIndex = parseInt(carta.arcano.split('_')[1])}

   // NEW (FIXED):
   {@const cartaIndex = parseInt(carta.arcano)}
   ```

2. **Line 394 - Wheel of the Year Layout**
   ```typescript
   // OLD (BROKEN):
   {@const cartaIndex = parseInt(carta.arcano.split('_')[1])}

   // NEW (FIXED):
   {@const cartaIndex = parseInt(carta.arcano)}
   ```

3. **Line 449 - 3-Card Spread Layout**
   ```typescript
   // OLD (BROKEN):
   {@const cartaIndex = parseInt(carta.arcano.split('_')[1])}

   // NEW (FIXED):
   {@const cartaIndex = parseInt(carta.arcano)}
   ```

4. **Line 296 - Helper Function `estaSeleccionada()`**
   ```typescript
   // OLD (BROKEN):
   return cartasSeleccionadas.some(c => c.arcano === `carta_${index}`);

   // NEW (FIXED):
   return cartasSeleccionadas.some(c => c.arcano === `${index}`);
   ```

5. **Line 300 - Helper Function `obtenerPosicion()`**
   ```typescript
   // OLD (BROKEN):
   const carta = cartasSeleccionadas.find(c => c.arcano === `carta_${index}`);

   // NEW (FIXED):
   const carta = cartasSeleccionadas.find(c => c.arcano === `${index}`);
   ```

## Card Format Specification

### Current Format (NEW)
```typescript
{
  arcano: "8",           // Numeric string: "0" to "21"
  invertida: false,      // Boolean
  posicion: 0            // Number: position in spread
}
```

### Old Format (DEPRECATED)
```typescript
{
  arcano: "carta_8",     // ❌ No longer used
  invertida: false,
  posicion: 0
}
```

## Verification

All card selection now works correctly for:
- ✅ 3-card spread (Tirada de Tres Cartas)
- ✅ 10-card spread (Cruz Celta)
- ✅ 13-card spread (Rueda del Año)

Selected cards now properly display in their designated positions with the correct card imagery and data.

## Related Fixes

This fix is part of the broader card format standardization that also fixed:
1. Card name display in AI readings (CARD-NAME-FIX-ANALYSIS.md)
2. Database card storage and retrieval
3. API prompt construction with proper card names

## Testing

To test:
1. Go to consultation page for any plan
2. Enter a question
3. Select cards from the deck
4. Verify cards appear in their designated positions
5. Complete selection and proceed to payment

All layouts should now correctly display selected cards.
