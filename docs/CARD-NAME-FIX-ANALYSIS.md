# Card Name Display Fix - Complete Analysis

## Problem Summary
AI-generated tarot readings were displaying "undefined" instead of actual card names like "La Fuerza", "La Justicia", "El Juicio".

## Root Cause
The MariaDB driver was returning `cartas_seleccionadas` as a JavaScript object instead of a JSON string. When `JSON.parse()` attempted to parse this object, it failed with:
```
SyntaxError: Unexpected token 'o', "[object Obj"... is not valid JSON
```

This caused the catch block to set `cartas_seleccionadas = []`, resulting in an empty array being passed to the prompt construction function.

## Complete Data Flow

### 1. Card Selection (Frontend)
- User selects cards in `CardSelection.svelte`
- Cards are stored as: `{ arcano: "8", invertida: false, posicion: 0 }`
- Card IDs are numeric strings: "8", "11", "20", etc.

### 2. Session Creation (POST /api/sesiones)
**File:** `src/routes/api/sesiones/+server.ts:86`
```typescript
JSON.stringify(cartas)  // Correctly saved as JSON string
```
✅ Works correctly - cards saved as JSON string in database

### 3. Database Storage
**Table:** `lecturas`
**Column:** `cartas_seleccionadas` (JSON type)
```json
[
  {"arcano":"8","invertida":false,"posicion":0},
  {"arcano":"11","invertida":false,"posicion":1},
  {"arcano":"20","invertida":false,"posicion":2}
]
```
✅ Data stored correctly

### 4. Reading Retrieval (GET /api/lecturas/[sesion_id])
**File:** `src/lib/db.js` - `obtenerLectura()` function

**PROBLEM WAS HERE:**
```javascript
// OLD CODE (BROKEN):
lectura.cartas_seleccionadas = JSON.parse(lectura.cartas_seleccionadas);
// ❌ Fails when MariaDB returns object instead of string
```

**FIX APPLIED:**
```javascript
// NEW CODE (FIXED):
if (lectura.cartas_seleccionadas) {
    if (typeof lectura.cartas_seleccionadas === 'string') {
        try {
            lectura.cartas_seleccionadas = JSON.parse(lectura.cartas_seleccionadas);
        } catch (err) {
            console.error('[DB] Error parseando cartas:', err);
            lectura.cartas_seleccionadas = [];
        }
    }
    // If already object/array, MariaDB already parsed it
    console.log('[DB] Cartas cargadas:', JSON.stringify(lectura.cartas_seleccionadas));
}
```
✅ Now handles both strings and objects

### 5. Prompt Construction
**File:** `src/routes/api/lecturas/[sesion_id]/+server.ts:29-109`

Function: `construirPromptSegunTirada()`
- Receives cards array: `[{arcano:"8",...}, {arcano:"11",...}, {arcano:"20",...}]`
- Maps each card through `obtenerNombreCompleto()`
- Returns: "La Fuerza", "La Justicia", "El Juicio"

Function: `obtenerNombreCompleto(carta)`
```typescript
const arcanoId = parseInt(carta.arcano);  // "8" → 8
const arcano = ARCANOS_MAYORES.find(a => a.id === arcanoId);
return carta.invertida ? `${arcano.nombre} (invertida)` : arcano.nombre;
```

### 6. OpenAI Prompt
**Before fix:**
```
- undefined: Pasado
- undefined: Presente
- undefined: Futuro
```

**After fix:**
```
- La Fuerza: Pasado
- La Justicia: Presente
- El Juicio: Futuro
```

### 7. Frontend Display
**File:** `src/routes/lectura/[sesion_id]/+page.svelte:341`

```svelte
<h3 class="carta-nombre">
    {obtenerNombreCarta(carta.arcano)}
</h3>
```

Function: `obtenerNombreCarta(arcano: string)`
```typescript
const nombresCarta = {
    '8': 'La Fuerza',
    '11': 'La Justicia',
    '20': 'El Juicio',
    // ... all 78 cards
};
return nombresCarta[arcano] || arcano;
```

## Verification Results

### Server Logs (BEFORE FIX):
```
[DEBUG construirPromptSegunTirada] Cartas recibidas: []
[DEBUG] Nombres obtenidos: undefined undefined undefined
[DB] Error parseando cartas: SyntaxError: Unexpected token 'o'
```

### Server Logs (AFTER FIX):
```
[DB] Cartas cargadas: [{"arcano":"8","invertida":false,"posicion":0}...]
[DEBUG construirPromptSegunTirada] Cartas recibidas: [{"arcano":"8"...}]
[DEBUG obtenerNombreCompleto] Resultado final: La Fuerza
[DEBUG obtenerNombreCompleto] Resultado final: La Justicia
[DEBUG obtenerNombreCompleto] Resultado final: El Juicio
[DEBUG] Nombres obtenidos: La Fuerza La Justicia El Juicio
```

### AI Reading Output:
```
### La Fuerza (Pasado)
En el pasado, La Fuerza indica que has enfrentado desafíos...

### La Justicia (Presente)
En el presente, La Justicia señala un momento de equilibrio...

### El Juicio (Futuro)
El Juicio en el futuro sugiere un gran despertar...
```

## Files Modified

1. **`src/lib/db.js` (Lines 249-262)**
   - Added type checking before JSON.parse()
   - Handles both string and object formats from MariaDB

2. **`src/routes/api/lecturas/[sesion_id]/+server.ts`**
   - Added debug logging (can be removed in production)
   - Implemented `obtenerNombreCompleto()` function
   - Modified `construirPromptSegunTirada()` to use real card names

## Testing

Test session: `1779820593205-udgtjjvch`
Cards: 8 (La Fuerza), 11 (La Justicia), 20 (El Juicio)

✅ Database stores cards correctly
✅ Cards load correctly from database
✅ Card names map correctly in prompt
✅ OpenAI receives correct card names
✅ AI interpretation uses real card names
✅ Frontend displays correct card names

## Status: FIXED ✅

The complete flow now works correctly from card selection through to final display.
