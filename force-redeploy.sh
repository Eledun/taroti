#!/bin/bash
set -e

# Script para forzar un redeploy completo limpiando cache de Node y Passenger
# Uso: ./force-redeploy.sh

SERVER="185.173.111.183"
PORT="65002"
USER="u616221621"
REMOTE_DIR="~/domains/dimgrey-louse-600796.hostingersite.com/nodejs"
PASSWORD="Taroti2026!"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 FORCE REDEPLOY - LIMPIEZA COMPLETA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar que existe el build local
if [ ! -d "./build" ]; then
  echo "❌ Error: No existe ./build. Ejecuta 'npm run build' primero."
  exit 1
fi

echo ""
echo "📦 Verificando archivos locales..."
ls -lh ./build/ | head -5
echo "..."

echo ""
echo "🗑️  Paso 1: Limpiando build anterior en servidor..."
sshpass -p "$PASSWORD" ssh -p $PORT -o StrictHostKeyChecking=no $USER@$SERVER << 'EOF'
cd ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs

# Backup del .env actual
cp .env .env.backup 2>/dev/null || echo "No hay .env previo"

# Eliminar build completo y node_modules
echo "   Eliminando build anterior..."
rm -rf build/

# Limpiar cache de Node
echo "   Limpiando cache de Node.js..."
export PATH=/opt/alt/alt-nodejs22/root/bin:$PATH
npm cache clean --force 2>/dev/null || echo "   Cache limpiado"

# Eliminar archivos de log para ver logs frescos
echo "   Limpiando logs..."
> console.log
> stderr.log

echo "✅ Servidor limpio"
EOF

echo ""
echo "📤 Paso 2: Subiendo build nuevo..."
scp -P $PORT -r ./build $USER@$SERVER:$REMOTE_DIR/

echo ""
echo "📤 Paso 3: Subiendo archivos de configuración..."
scp -P $PORT ./package.json $USER@$SERVER:$REMOTE_DIR/
scp -P $PORT ./start-server.js $USER@$SERVER:$REMOTE_DIR/

echo ""
echo "📦 Paso 4: Instalando dependencias..."
sshpass -p "$PASSWORD" ssh -p $PORT -o StrictHostKeyChecking=no $USER@$SERVER << 'EOF'
cd ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs

export PATH=/opt/alt/alt-nodejs22/root/bin:$PATH

# Reinstalar dependencias
echo "   Instalando dependencias..."
rm -rf node_modules package-lock.json
npm install --production

echo "✅ Dependencias instaladas"
EOF

echo ""
echo "🔄 Paso 5: Forzando restart de Passenger..."
sshpass -p "$PASSWORD" ssh -p $PORT -o StrictHostKeyChecking=no $USER@$SERVER << 'EOF'
cd ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs

# Crear directorio tmp si no existe
mkdir -p tmp

# Tocar restart.txt
touch tmp/restart.txt

# Matar todos los procesos node para forzar reinicio
pkill -9 -u $(whoami) node 2>/dev/null || echo "   No hay procesos node corriendo"

echo "✅ Passenger reiniciado"

# Esperar 3 segundos
sleep 3

# Verificar que se creó el log
echo ""
echo "📋 Primeras líneas del log nuevo:"
head -20 console.log 2>/dev/null || echo "   Aún no hay logs (Passenger iniciando...)"
EOF

echo ""
echo "✅ Deploy completo"
echo ""
echo "🔍 Verificando sitio..."
sleep 2
curl -I https://dimgrey-louse-600796.hostingersite.com 2>/dev/null | head -5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ REDEPLOY COMPLETADO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Para ver logs en tiempo real:"
echo "  sshpass -p 'Taroti2026!' ssh -p 65002 $USER@$SERVER 'tail -f $REMOTE_DIR/console.log'"
