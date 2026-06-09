#!/bin/bash

# Script de Deploy Automatizado para Hostinger
# Versión: 2.3.9
# Fecha: 2026-06-08

set -e  # Salir si hay errores

echo "=========================================="
echo "  TAROTI - Deploy a Hostinger"
echo "=========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración
HOSTINGER_USER="u616221621"
HOSTINGER_HOST="185.173.111.183"
HOSTINGER_PORT="65002"
HOSTINGER_PATH="/home/u616221621/domains/dimgrey-louse-600796.hostingersite.com/nodejs"
LOCAL_BUILD_DIR="./build"
LOCAL_PACKAGE="./package.json"
LOCAL_START_SERVER="./start-server.js"
LOCAL_ENV="./.env.production"

echo -e "${YELLOW}[1/7] Verificando archivos locales...${NC}"
if [ ! -d "$LOCAL_BUILD_DIR" ]; then
    echo -e "${RED}Error: No existe el directorio build/. Ejecuta 'npm run build' primero.${NC}"
    exit 1
fi

if [ ! -f "$LOCAL_PACKAGE" ]; then
    echo -e "${RED}Error: No existe package.json${NC}"
    exit 1
fi

if [ ! -f "$LOCAL_START_SERVER" ]; then
    echo -e "${RED}Error: No existe start-server.js${NC}"
    exit 1
fi

if [ ! -f "$LOCAL_ENV" ]; then
    echo -e "${YELLOW}Advertencia: No existe .env.production. Asegúrate de que .env esté en el servidor.${NC}"
fi

echo -e "${GREEN}✓ Archivos verificados${NC}"
echo ""

echo -e "${YELLOW}[2/7] Creando backup en servidor...${NC}"
ssh -p $HOSTINGER_PORT $HOSTINGER_USER@$HOSTINGER_HOST << 'ENDSSH'
cd /home/u616221621/domains/dimgrey-louse-600796.hostingersite.com/nodejs
if [ -d "build" ]; then
    echo "Creando backup de build anterior..."
    mv build build.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "No hay build previo"
fi
ENDSSH
echo -e "${GREEN}✓ Backup creado${NC}"
echo ""

echo -e "${YELLOW}[3/7] Subiendo archivos al servidor...${NC}"
echo "Subiendo build/..."
scp -P $HOSTINGER_PORT -r $LOCAL_BUILD_DIR $HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH/

echo "Subiendo package.json..."
scp -P $HOSTINGER_PORT $LOCAL_PACKAGE $HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH/

echo "Subiendo start-server.js..."
scp -P $HOSTINGER_PORT $LOCAL_START_SERVER $HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH/

if [ -f "$LOCAL_ENV" ]; then
    echo "Subiendo .env.production como .env..."
    scp -P $HOSTINGER_PORT $LOCAL_ENV $HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH/.env
fi

echo -e "${GREEN}✓ Archivos subidos${NC}"
echo ""

echo -e "${YELLOW}[4/7] Instalando dependencias en servidor...${NC}"
ssh -p $HOSTINGER_PORT $HOSTINGER_USER@$HOSTINGER_HOST << 'ENDSSH'
cd /home/u616221621/domains/dimgrey-louse-600796.hostingersite.com/nodejs
export PATH=/opt/alt/alt-nodejs22/root/bin:$PATH
echo "Instalando dependencias..."
npm install --production
ENDSSH
echo -e "${GREEN}✓ Dependencias instaladas${NC}"
echo ""

echo -e "${YELLOW}[5/7] Verificando estructura de archivos...${NC}"
ssh -p $HOSTINGER_PORT $HOSTINGER_USER@$HOSTINGER_HOST << 'ENDSSH'
cd /home/u616221621/domains/dimgrey-louse-600796.hostingersite.com/nodejs
echo "Archivos en nodejs/:"
ls -lh
echo ""
echo "Archivos en build/:"
ls -lh build/ | head -10
ENDSSH
echo -e "${GREEN}✓ Estructura verificada${NC}"
echo ""

echo -e "${YELLOW}[6/7] Reiniciando aplicación (Passenger)...${NC}"
ssh -p $HOSTINGER_PORT $HOSTINGER_USER@$HOSTINGER_HOST << 'ENDSSH'
cd /home/u616221621/domains/dimgrey-louse-600796.hostingersite.com/nodejs
mkdir -p tmp
touch tmp/restart.txt
echo "Passenger reiniciado"
ENDSSH
echo -e "${GREEN}✓ Aplicación reiniciada${NC}"
echo ""

echo -e "${YELLOW}[7/7] Verificando que el sitio responda...${NC}"
sleep 5
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://dimgrey-louse-600796.hostingersite.com)

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Sitio respondiendo correctamente (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${RED}✗ Error: El sitio responde con HTTP $HTTP_STATUS${NC}"
    echo -e "${YELLOW}Revisa los logs en el servidor con:${NC}"
    echo "ssh -p $HOSTINGER_PORT $HOSTINGER_USER@$HOSTINGER_HOST 'cat ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/stderr.log'"
    exit 1
fi

echo ""
echo -e "${GREEN}=========================================="
echo "  ✓ DEPLOY COMPLETADO EXITOSAMENTE"
echo "==========================================${NC}"
echo ""
echo "URL: https://dimgrey-louse-600796.hostingersite.com"
echo ""
echo "Para ver logs:"
echo "  ssh -p $HOSTINGER_PORT $HOSTINGER_USER@$HOSTINGER_HOST 'tail -f ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/console.log'"
echo ""
