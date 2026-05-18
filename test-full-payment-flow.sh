#!/bin/bash

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           SIMULACIÓN DE FLUJO COMPLETO DE PAGO                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL base
API_URL="http://localhost:4000/api"

# Paso 1: Obtener planes
echo -e "${BLUE}📋 Paso 1: Obteniendo planes disponibles...${NC}"
PLANES=$(curl -s "${API_URL}/planes")
PLAN_ID=$(echo $PLANES | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['id'])")
PLAN_NOMBRE=$(echo $PLANES | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['nombre'])")
echo -e "${GREEN}   ✓ Plan seleccionado: $PLAN_NOMBRE${NC}"
echo -e "   ID: $PLAN_ID"
echo ""

# Paso 2: Crear sesión
echo -e "${BLUE}🎴 Paso 2: Creando sesión de lectura...${NC}"
SESION_RESPONSE=$(curl -s -X POST "${API_URL}/sesiones" \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"$PLAN_ID\",
    \"pregunta\": \"¿Qué me depara el futuro en mi carrera profesional?\",
    \"cartas\": [
      {\"arcano\": \"carta_1\", \"posicion\": 0, \"invertida\": false},
      {\"arcano\": \"carta_13\", \"posicion\": 1, \"invertida\": true},
      {\"arcano\": \"carta_19\", \"posicion\": 2, \"invertida\": false}
    ]
  }")

SESION_ID=$(echo $SESION_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['sesion_id'])")
TOKEN_ACCESO=$(echo $SESION_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token_acceso'])")
echo -e "${GREEN}   ✓ Sesión creada${NC}"
echo -e "   ID: $SESION_ID"
echo -e "   Token: $TOKEN_ACCESO"
echo ""

# Paso 3: Crear preferencia de pago
echo -e "${BLUE}💳 Paso 3: Creando preferencia de pago...${NC}"
PREFERENCE_RESPONSE=$(curl -s -X POST "${API_URL}/pagos/preference" \
  -H "Content-Type: application/json" \
  -d "{\"sesion_id\": \"$SESION_ID\"}")

PREFERENCE_ID=$(echo $PREFERENCE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('preference_id', ''))")
echo -e "${GREEN}   ✓ Preferencia creada${NC}"
echo -e "   Preference ID: $PREFERENCE_ID"
echo ""

# Paso 4: Simular webhook de pago aprobado
echo -e "${BLUE}✅ Paso 4: Simulando pago aprobado (webhook)...${NC}"

# Primero, creamos un pago simulado en Mercado Pago (ID ficticio)
MP_PAYMENT_ID="sim_$(date +%s)"

# Simular webhook con datos mínimos
WEBHOOK_RESPONSE=$(curl -s -X POST "${API_URL}/pagos/webhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"payment\",
    \"action\": \"payment.updated\",
    \"data\": {
      \"id\": \"$MP_PAYMENT_ID\"
    }
  }" || echo '{"error": "webhook failed"}')

echo -e "${YELLOW}   ⚠️  Webhook simulado (en dev mode)${NC}"
echo -e "   Nota: El pago real requeriría API de MP"
echo ""

# Paso 5: Actualizar manualmente el estado (simulación directa en BD)
echo -e "${BLUE}🔧 Paso 5: Actualizando estado del pago directamente...${NC}"

# Actualizar pago y sesión usando MySQL
docker exec taroti_mysql mysql -u taroti_user -ptaroti_pass_2026 taroti_dev -e "
UPDATE pagos
SET estado = 'aprobado', mp_payment_id = '$MP_PAYMENT_ID'
WHERE sesion_id = '$SESION_ID';

UPDATE sesiones
SET estado = 'pagada'
WHERE id = '$SESION_ID';

SELECT 'Pago actualizado' as resultado;
" 2>/dev/null | grep -v "Warning"

echo -e "${GREEN}   ✓ Estado actualizado a 'pagada'${NC}"
echo ""

# Paso 6: Agregar a cola y esperar generación
echo -e "${BLUE}🔮 Paso 6: Agregando sesión a cola de procesamiento...${NC}"

# La cola se procesa automáticamente cuando hay un pago aprobado
# Vamos a insertar directamente en la cola simulando el proceso
docker exec taroti_mysql mysql -u taroti_user -ptaroti_pass_2026 taroti_dev -e "
INSERT INTO lecturas (id, sesion_id, usuario_id, ambito_detectado, interpretacion, expira_en, creado_en, expirada)
VALUES (
  UUID(),
  '$SESION_ID',
  NULL,
  'trabajo',
  '## Tu Camino Profesional

**Las cartas revelan un momento de transformación importante en tu vida laboral.** La energía que rodea tu consulta indica que estás en un punto de inflexión crucial.

### Presente
El universo te está preparando para cambios significativos. La situación actual puede parecer estancada, pero es en realidad un periodo de gestación necesario para lo que viene.

### Desafíos
- **Miedo al cambio**: Es natural sentir resistencia ante lo desconocido
- **Decisiones importantes**: Se aproximan elecciones que definirán tu rumbo
- **Paciencia**: Los procesos llevan su tiempo

### Oportunidades
Las cartas señalan que **nuevas puertas comenzarán a abrirse** en los próximos meses. Tu experiencia y habilidades están siendo reconocidas, aunque quizás aún no lo veas claramente.

> \"El éxito no es el final, el fracaso no es fatal: es el coraje para continuar lo que cuenta.\"

### Consejo del Tarot
Mantén una actitud abierta y receptiva. *Confía en tu intuición* cuando llegue el momento de tomar decisiones. La claridad que buscas vendrá cuando te permitas soltar el control y fluir con las circunstancias.

**Recuerda**: Cada desafío es una oportunidad disfrazada. Tu crecimiento profesional está directamente ligado a tu disposición para evolucionar como persona.',
  NULL,
  NOW(),
  FALSE
);

UPDATE sesiones
SET estado = 'completada', generando = false
WHERE id = '$SESION_ID';

SELECT 'Lectura creada' as resultado;
" 2>/dev/null | grep -v "Warning"

echo -e "${GREEN}   ✓ Lectura generada (simulada con contenido de ejemplo)${NC}"
echo -e "${YELLOW}   📝 Nota: Esta es una lectura de ejemplo para demostración${NC}"
echo ""

# Paso 7: Obtener la lectura
echo -e "${BLUE}📖 Paso 7: Obteniendo lectura generada...${NC}"
LECTURA=$(curl -s "${API_URL}/sesiones/${SESION_ID}?token_acceso=${TOKEN_ACCESO}")

# Verificar si tiene interpretación
HAS_INTERPRETATION=$(echo $LECTURA | python3 -c "import sys, json; d=json.load(sys.stdin); print('yes' if d.get('interpretacion') else 'no')" 2>/dev/null || echo "no")

if [ "$HAS_INTERPRETATION" = "yes" ]; then
  echo -e "${GREEN}   ✓ Lectura generada con interpretación${NC}"

  AMBITO=$(echo $LECTURA | python3 -c "import sys, json; print(json.load(sys.stdin).get('ambito_detectado', 'N/A'))" 2>/dev/null || echo "N/A")
  INTERPRETACION_PREVIEW=$(echo $LECTURA | python3 -c "import sys, json; interp=json.load(sys.stdin).get('interpretacion', ''); print(interp[:150] + '...' if len(interp) > 150 else interp)" 2>/dev/null || echo "")

  echo -e "   Ámbito detectado: ${YELLOW}$AMBITO${NC}"
  echo -e "   Preview: $INTERPRETACION_PREVIEW"
else
  echo -e "${YELLOW}   ⚠️  La lectura aún no tiene interpretación generada${NC}"
  echo -e "   Esto es normal si OpenAI aún no respondió"
fi
echo ""

# Paso 8: Mostrar URL para ver la lectura
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    SIMULACIÓN COMPLETADA                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Flujo completo simulado exitosamente${NC}"
echo ""
echo -e "${BLUE}📱 Ver la lectura en el navegador:${NC}"
echo ""
echo -e "   ${YELLOW}http://localhost:5173/lectura/${SESION_ID}?token_acceso=${TOKEN_ACCESO}${NC}"
echo ""
echo -e "${BLUE}🔗 O copia este comando para abrir automáticamente:${NC}"
echo ""
echo -e "   open \"http://localhost:5173/lectura/${SESION_ID}?token_acceso=${TOKEN_ACCESO}\""
echo ""
echo "───────────────────────────────────────────────────────────────"
echo -e "${BLUE}📊 Resumen de la sesión:${NC}"
echo "   • Sesión ID: $SESION_ID"
echo "   • Plan: $PLAN_NOMBRE"
echo "   • Estado: pagada"
echo "   • Token: $TOKEN_ACCESO"
echo ""
echo -e "${YELLOW}💡 Nota:${NC} Si la interpretación no aparece, el procesador de"
echo "   cola necesita estar activo. Revisa los logs del backend."
echo ""
