#!/bin/bash

# 🚀 Script de Deploy - Taroti SvelteKit a Hostinger
# Este script sube la aplicación compilada al servidor via FTP

set -e  # Salir si hay algún error

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Credenciales de Hostinger
FTP_HOST="taroti.fun"
FTP_USER="u616221621"
FTP_PASS="Taraoti_1"

# Directorios
LOCAL_BUILD_DIR="./frontend/build"
LOCAL_PACKAGE_JSON="./frontend/package.json"
LOCAL_ENV_PRODUCTION="./frontend/.env.production"
REMOTE_DIR="/domains/taroti.fun/public_html"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔮 Taroti - Deploy a Hostinger${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Verificar que existe el build
if [ ! -d "$LOCAL_BUILD_DIR" ]; then
    echo -e "${RED}❌ Error: No se encontró el directorio build${NC}"
    echo -e "${YELLOW}💡 Ejecuta primero: cd frontend && npm run build${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build encontrado${NC}"
echo ""

# Verificar que lftp está instalado
if ! command -v lftp &> /dev/null; then
    echo -e "${RED}❌ Error: lftp no está instalado${NC}"
    echo -e "${YELLOW}💡 Instala lftp: brew install lftp${NC}"
    exit 1
fi

echo -e "${GREEN}✅ lftp instalado${NC}"
echo ""

echo -e "${BLUE}📤 Subiendo archivos al servidor...${NC}"
echo ""

# Usar lftp para subir archivos
lftp -e "
set ssl:verify-certificate no;
open -u ${FTP_USER},${FTP_PASS} ftp://${FTP_HOST};

# Ir al directorio remoto
cd ${REMOTE_DIR};

# Limpiar contenido anterior (excepto archivos ocultos y específicos)
echo '🧹 Limpiando directorio remoto...';
rm -rf build;
rm -f package.json;
rm -f .env;

# Crear directorio build si no existe
mkdir -p build;

# Subir todo el contenido de build/
echo '📦 Subiendo build/...';
mirror -R ${LOCAL_BUILD_DIR} build;

# Subir package.json (solo con dependencias de producción)
echo '📄 Subiendo package.json...';
put ${LOCAL_PACKAGE_JSON} -o package.json;

# Subir .env de producción
echo '🔐 Subiendo .env de producción...';
put ${LOCAL_ENV_PRODUCTION} -o .env;

# Crear archivo de inicio
echo '📝 Creando index.js...';

bye
" << 'LFTP_SCRIPT'

# Mensaje de confirmación
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deploy completado exitosamente${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo ""
echo -e "1. ${BLUE}Conectarte por SSH al servidor:${NC}"
echo -e "   ssh u616221621@taroti.fun"
echo ""
echo -e "2. ${BLUE}Ir al directorio de la app:${NC}"
echo -e "   cd /domains/taroti.fun/public_html"
echo ""
echo -e "3. ${BLUE}Instalar dependencias:${NC}"
echo -e "   npm install --production"
echo ""
echo -e "4. ${BLUE}Configurar Node.js App en hPanel:${NC}"
echo -e "   - Application root: domains/taroti.fun/public_html"
echo -e "   - Application startup file: build/index.js"
echo -e "   - Node.js version: 22.x"
echo -e "   - Application mode: Production"
echo ""
echo -e "5. ${BLUE}Iniciar la aplicación desde hPanel${NC}"
echo ""
echo -e "${GREEN}🌐 Tu app estará disponible en: http://taroti.fun${NC}"
echo ""
