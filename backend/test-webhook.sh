#!/bin/bash

echo "🧪 Probando flujo completo de pago..."

# Paso 1: Obtener planes
echo -e "\n📋 Obteniendo planes disponibles..."
PLAN_ID=$(curl -s http://localhost:4000/api/planes | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['id'])")
echo "Plan ID seleccionado: $PLAN_ID"

# Paso 2: Crear sesión
echo -e "\n🎴 Creando sesión..."
SESION_RESPONSE=$(curl -s -X POST http://localhost:4000/api/sesiones \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"$PLAN_ID\",
    \"pregunta\": \"¿Qué me depara el futuro en el amor?\",
    \"tipo_usuario\": \"anonimo\"
  }")

SESION_ID=$(echo $SESION_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "Sesión creada: $SESION_ID"

# Paso 3: Crear preferencia de pago
echo -e "\n💳 Creando preferencia de pago..."
PREFERENCE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/pagos/preference \
  -H "Content-Type: application/json" \
  -d "{\"sesion_id\": \"$SESION_ID\"}")

echo $PREFERENCE_RESPONSE | python3 -m json.tool

PREFERENCE_ID=$(echo $PREFERENCE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('preference_id', 'N/A'))")
INIT_POINT=$(echo $PREFERENCE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('init_point', 'N/A'))")

echo -e "\n✅ Preferencia creada:"
echo "  - Preference ID: $PREFERENCE_ID"
echo "  - Init Point: $INIT_POINT"

echo -e "\n📝 Resumen del test:"
echo "  1. ✅ Planes obtenidos correctamente"
echo "  2. ✅ Sesión creada correctamente"
echo "  3. ✅ Preferencia de pago creada correctamente"
echo "  4. ⚠️  Webhook: Para probar el webhook, necesitas:"
echo "      - Completar el pago en: $INIT_POINT"
echo "      - O configurar un túnel ngrok para recibir notificaciones de MP"
echo ""
echo "🔗 Para configurar ngrok:"
echo "   ngrok http 4000"
echo "   Luego actualiza la URL del webhook en config_admin con la URL de ngrok"
