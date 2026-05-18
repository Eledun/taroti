#!/bin/bash

# ================================================================
# 🔮 TAROTI - SCRIPT DE DEPLOY A HOSTINGER
# ================================================================
#
# Este script automatiza el despliegue completo a Hostinger usando LFTP
#
# Requisitos:
#   - lftp instalado (brew install lftp en macOS)
#
# Uso:
#   chmod +x deploy-to-hostinger.sh
#   ./deploy-to-hostinger.sh
#
# ================================================================

set -e  # Detener en caso de error

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración FTP
FTP_HOST="46.202.145.196"
FTP_USER="u616221621"
FTP_PORT="21"

echo -e "${BLUE}"
echo "════════════════════════════════════════════════════════════════"
echo "           🔮 DEPLOY A HOSTINGER - TAROTI                       "
echo "════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Verificar que lftp está instalado
if ! command -v lftp &> /dev/null; then
    echo -e "${RED}✗ Error: lftp no está instalado${NC}"
    echo -e "${YELLOW}Instálalo con: brew install lftp${NC}"
    exit 1
fi

# Pedir contraseña si no está en variable de entorno
if [ -z "$FTP_PASSWORD" ]; then
    echo -e "${YELLOW}Por favor, ingresa la contraseña de FTP:${NC}"
    read -s FTP_PASSWORD
    export FTP_PASSWORD
    echo ""
fi

echo -e "${BLUE}📦 Paso 1: Compilando aplicaciones...${NC}"

# Compilar Backend
echo -e "   ${GREEN}→${NC} Compilando backend..."
cd backend
./deploy-production.sh > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✓${NC} Backend compilado"
else
    echo -e "   ${RED}✗${NC} Error compilando backend"
    exit 1
fi
cd ..

# Compilar Frontend
echo -e "   ${GREEN}→${NC} Compilando frontend..."
cd frontend
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✓${NC} Frontend compilado"
else
    echo -e "   ${RED}✗${NC} Error compilando frontend"
    exit 1
fi
cd ..

echo ""
echo -e "${BLUE}🚀 Paso 2: Subiendo Backend a Hostinger...${NC}"

echo -e "   ${GREEN}→${NC} Subiendo carpeta dist..."
lftp -u "$FTP_USER","$FTP_PASSWORD" -p "$FTP_PORT" "$FTP_HOST" <<EOF
set ftp:ssl-allow no
set net:timeout 30
set net:reconnect-interval-base 5
set net:max-retries 3
mkdir -p /public_html/api
cd /public_html/api
mirror -R --verbose=0 backend/dist dist
mirror -R --verbose=0 backend/prisma prisma
put backend/package.json
put backend/package-lock.json
put backend/.htaccess
bye
EOF

if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✓${NC} Backend subido exitosamente"
else
    echo -e "   ${RED}✗${NC} Error subiendo backend"
    exit 1
fi

echo ""
echo -e "${BLUE}🚀 Paso 3: Subiendo Frontend a Hostinger...${NC}"

echo -e "   ${GREEN}→${NC} Subiendo archivos del frontend..."
lftp -u "$FTP_USER","$FTP_PASSWORD" -p "$FTP_PORT" "$FTP_HOST" <<EOF
set ftp:ssl-allow no
set net:timeout 30
set net:reconnect-interval-base 5
set net:max-retries 3
cd /public_html
lcd frontend/build
mput -O /public_html *
mirror -R --verbose=0 _app /public_html/_app
mirror -R --verbose=0 arcan_mayor /public_html/arcan_mayor
put .htaccess 2>/dev/null || echo "No .htaccess found"
bye
EOF

if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✓${NC} Frontend subido exitosamente"
else
    echo -e "   ${RED}✗${NC} Error subiendo frontend"
    exit 1
fi

echo ""
echo -e "${GREEN}"
echo "════════════════════════════════════════════════════════════════"
echo "                  ✅ DEPLOY COMPLETADO                          "
echo "════════════════════════════════════════════════════════════════"
echo -e "${NC}"

echo -e "${YELLOW}📋 Próximos pasos en Hostinger:${NC}"
echo ""
echo "1. Conéctate por SSH al servidor:"
echo "   ${GREEN}ssh $FTP_USER@$FTP_HOST${NC}"
echo ""
echo "2. Navega a la carpeta del backend:"
echo "   ${GREEN}cd /home/$FTP_USER/public_html/api${NC}"
echo ""
echo "3. Instala las dependencias:"
echo "   ${GREEN}npm install --production${NC}"
echo "   ${GREEN}npx prisma generate${NC}"
echo ""
echo "4. Aplica las migraciones de base de datos:"
echo "   ${GREEN}npx prisma migrate deploy${NC}"
echo "   ${GREEN}npx prisma db seed${NC}"
echo ""
echo "5. Configura el archivo .env con las credenciales de producción"
echo ""
echo "6. Inicia la aplicación Node.js desde el panel de Hostinger"
echo "   (Avanzado → Node.js → Crear aplicación)"
echo ""
echo -e "${GREEN}🔮 ¡Tu aplicación Taroti está lista para funcionar!${NC}"
echo ""
echo -e "${BLUE}📚 Para más detalles, consulta: INSTRUCCIONES_DEPLOY.md${NC}"
echo ""
