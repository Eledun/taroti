#!/bin/bash

set -e

echo "════════════════════════════════════════════════════════════════"
echo "           PRUEBA REAL CON API DE OPENAI                        "
echo "════════════════════════════════════════════════════════════════"
echo ""

API_URL="http://localhost:4000/api"

# Paso 1: Obtener planes
echo "📋 Paso 1: Obteniendo planes disponibles..."
PLANES=$(curl -s "${API_URL}/planes")
PLAN_ID=$(echo $PLANES | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['id'])")
PLAN_NOMBRE=$(echo $PLANES | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['nombre'])")
echo "   ✓ Plan seleccionado: $PLAN_NOMBRE"
echo ""

# Paso 2: Crear sesión con una pregunta real e interesante
echo "🎴 Paso 2: Creando sesión de lectura..."
SESION_RESPONSE=$(curl -s -X POST "${API_URL}/sesiones" \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"$PLAN_ID\",
    \"pregunta\": \"¿Cómo puedo mejorar mi relación con mi familia y encontrar mayor armonía en el hogar?\",
    \"cartas\": [
      {\"arcano\": \"carta_6\", \"posicion\": 0, \"invertida\": false},
      {\"arcano\": \"carta_14\", \"posicion\": 1, \"invertida\": false},
      {\"arcano\": \"carta_10\", \"posicion\": 2, \"invertida\": true}
    ]
  }")

SESION_ID=$(echo $SESION_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['sesion_id'])")
TOKEN_ACCESO=$(echo $SESION_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token_acceso'])")
echo "   ✓ Sesión creada: $SESION_ID"
echo ""

# Paso 3: Crear preferencia de pago
echo "💳 Paso 3: Creando preferencia de pago..."
PREFERENCE_RESPONSE=$(curl -s -X POST "${API_URL}/pagos/preference" \
  -H "Content-Type: application/json" \
  -d "{\"sesion_id\": \"$SESION_ID\"}")
echo "   ✓ Preferencia creada"
echo ""

# Paso 4: Simular pago aprobado
echo "✅ Paso 4: Simulando pago aprobado..."
MP_PAYMENT_ID="real_$(date +%s)"

docker exec taroti_mysql mysql -u taroti_user -ptaroti_pass_2026 taroti_dev -e "
UPDATE pagos
SET estado = 'aprobado', mp_payment_id = '$MP_PAYMENT_ID'
WHERE sesion_id = '$SESION_ID';

UPDATE sesiones
SET estado = 'pagada'
WHERE id = '$SESION_ID';
" 2>/dev/null | grep -v "Warning"

echo "   ✓ Pago marcado como aprobado"
echo ""

# Paso 5: Agregar a cola y procesar con OpenAI REAL
echo "🔮 Paso 5: Agregando a cola para procesamiento con OpenAI..."

docker exec taroti_mysql mysql -u taroti_user -ptaroti_pass_2026 taroti_dev -e "
INSERT INTO cola_lecturas (id, sesion_id, estado, intentos, creado_en)
VALUES (UUID(), '$SESION_ID', 'pendiente', 0, NOW());
" 2>/dev/null | grep -v "Warning"

echo "   ✓ Sesión agregada a cola"
echo ""

# Paso 6: Esperar a que el backend procese la lectura
echo "⏳ Paso 6: Esperando que OpenAI genere la lectura (puede tomar 10-20 segundos)..."
echo ""

# Esperar y verificar el estado cada 3 segundos
MAX_ATTEMPTS=20
ATTEMPT=0
LECTURA_COMPLETA=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))

  # Verificar el estado de la sesión
  SESION_DATA=$(curl -s "${API_URL}/sesiones/${SESION_ID}?token_acceso=${TOKEN_ACCESO}")
  ESTADO=$(echo $SESION_DATA | python3 -c "import sys, json; print(json.load(sys.stdin).get('estado', 'desconocido'))" 2>/dev/null || echo "error")

  if [ "$ESTADO" = "completada" ]; then
    LECTURA_COMPLETA=true
    break
  fi

  echo "   Intento $ATTEMPT/$MAX_ATTEMPTS - Estado: $ESTADO"
  sleep 3
done

echo ""

if [ "$LECTURA_COMPLETA" = true ]; then
  echo "✅ ¡Lectura completada con éxito!"
  echo ""

  # Obtener detalles de la lectura
  LECTURA=$(curl -s "${API_URL}/sesiones/${SESION_ID}?token_acceso=${TOKEN_ACCESO}")

  HAS_LECTURA=$(echo $LECTURA | python3 -c "import sys, json; print('yes' if json.load(sys.stdin).get('lectura') else 'no')" 2>/dev/null || echo "no")

  if [ "$HAS_LECTURA" = "yes" ]; then
    AMBITO=$(echo $LECTURA | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('lectura', {}).get('ambito_detectado', 'N/A'))" 2>/dev/null || echo "N/A")
    INTERPRETACION_PREVIEW=$(echo $LECTURA | python3 -c "import sys, json; d=json.load(sys.stdin); interp=d.get('lectura', {}).get('interpretacion', ''); print(interp[:200] + '...' if len(interp) > 200 else interp)" 2>/dev/null || echo "")

    echo "📖 Detalles de la lectura:"
    echo "   Ámbito detectado: $AMBITO"
    echo ""
    echo "   Preview de interpretación:"
    echo "   $INTERPRETACION_PREVIEW"
    echo ""
  fi
else
  echo "⚠️  La lectura aún no se ha completado después de esperar."
  echo "   Verifica que el backend esté procesando la cola."
  echo ""
fi

# Paso 7: Mostrar URL
echo "════════════════════════════════════════════════════════════════"
echo "                    PRUEBA COMPLETADA                           "
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📱 Ver la lectura REAL con OpenAI en el navegador:"
echo ""
echo "   http://localhost:5173/lectura/${SESION_ID}?token_acceso=${TOKEN_ACCESO}"
echo ""
echo "🔗 O ejecuta:"
echo ""
echo "   open \"http://localhost:5173/lectura/${SESION_ID}?token_acceso=${TOKEN_ACCESO}\""
echo ""
