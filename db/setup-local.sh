#!/bin/bash
################################################################################
# SETUP SCRIPT - TAROTI LATAM v2.3.0
# Configuración rápida de MariaDB para desarrollo local
################################################################################

set -euo pipefail

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TAROTI LATAM v2.3.0 - Setup MariaDB Local"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"

# Verificar que MariaDB/MySQL está instalado
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL/MariaDB no está instalado${NC}"
    echo ""
    echo "Instalar con:"
    echo "  macOS:   brew install mariadb"
    echo "  Ubuntu:  sudo apt-get install mariadb-server"
    echo "  CentOS:  sudo yum install mariadb-server"
    exit 1
fi

echo -e "${GREEN}✅ MySQL/MariaDB encontrado${NC}"
echo ""

# Pedir credenciales
echo -e "${YELLOW}Ingresa credenciales de MariaDB root:${NC}"
read -p "Usuario root [root]: " MYSQL_ROOT_USER
MYSQL_ROOT_USER=${MYSQL_ROOT_USER:-root}

read -sp "Password root: " MYSQL_ROOT_PASSWORD
echo ""
echo ""

# Crear BD y usuario
echo -e "${YELLOW}Creando base de datos taroti_latam...${NC}"

mysql -u "$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASSWORD" <<EOF
-- Crear BD
CREATE DATABASE IF NOT EXISTS taroti_latam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario (si no existe)
CREATE USER IF NOT EXISTS 'taroti_user'@'localhost' IDENTIFIED BY 'taroti_dev_2024';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON taroti_latam.* TO 'taroti_user'@'localhost';
FLUSH PRIVILEGES;

-- Mostrar info
SELECT 'Base de datos creada exitosamente' AS status;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Base de datos taroti_latam creada${NC}"
else
    echo -e "${RED}❌ Error creando base de datos${NC}"
    exit 1
fi

echo ""

# Importar schema
echo -e "${YELLOW}Importando schema (tablas)...${NC}"

mysql -u taroti_user -ptaroti_dev_2024 taroti_latam < "$(dirname "$0")/schema-latam.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema importado correctamente${NC}"
else
    echo -e "${RED}❌ Error importando schema${NC}"
    exit 1
fi

echo ""

# Verificar tablas creadas
echo -e "${YELLOW}Verificando tablas creadas...${NC}"

mysql -u taroti_user -ptaroti_dev_2024 taroti_latam -e "SHOW TABLES;"

echo ""

# Crear .env si no existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creando archivo .env...${NC}"

    cat > .env << 'ENVEOF'
# Mercado Pago (TEST - Reemplazar con credenciales reales)
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx
PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxxx
MERCADOPAGO_WEBHOOK_SECRET=PENDIENTE_CONFIGURAR

# OpenAI (TEST - Reemplazar con API key real)
OPENAI_API_KEY=sk-proj-xxxx

# MariaDB LOCAL
DB_HOST=localhost
DB_PORT=3306
DB_USER=taroti_user
DB_PASSWORD=taroti_dev_2024
DB_NAME=taroti_latam

# URLs
FRONTEND_URL=http://localhost:5173

# Server
PORT=3000
HOST=0.0.0.0
ENVEOF

    echo -e "${GREEN}✅ Archivo .env creado${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANTE: Edita .env con tus credenciales reales${NC}"
else
    echo -e "${YELLOW}⚠️  .env ya existe, no se sobrescribió${NC}"
fi

echo ""
echo -e "${GREEN}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ SETUP COMPLETADO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"
echo ""
echo "Credenciales creadas:"
echo "  BD:       taroti_latam"
echo "  Usuario:  taroti_user"
echo "  Password: taroti_dev_2024"
echo ""
echo "Próximos pasos:"
echo ""
echo "  1. Editar .env con credenciales reales de MP y OpenAI"
echo ""
echo "  2. Instalar dependencias:"
echo "     npm install"
echo ""
echo "  3. Ejecutar en desarrollo:"
echo "     npm run dev"
echo ""
echo "  4. Testing conexión DB:"
echo "     curl http://localhost:5173/api/pagos/verificar/test-123"
echo ""
echo "  5. Ver datos en BD:"
echo "     mysql -u taroti_user -ptaroti_dev_2024 taroti_latam"
echo "     SELECT * FROM pagos;"
echo ""
