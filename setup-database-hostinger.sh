#!/bin/bash

# ============================================================================
# Script Automatizado para Configurar Base de Datos en Hostinger
# ============================================================================
# Ejecutar: bash setup-database-hostinger.sh
# ============================================================================

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Credenciales
SSH_HOST="185.173.111.183"
SSH_PORT="65002"
SSH_USER="u616221621"
SSH_PASS="Taroti2026!"
MYSQL_USER="u616221621_figoti"
MYSQL_PASS="Taroti2026!"
MYSQL_DB="u616221621_figoti"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  TAROTI LATAM - Setup Base de Datos Hostinger             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# PASO 1: Subir archivo SQL al servidor
# ============================================================================

echo -e "${YELLOW}[1/4] Subiendo archivo SQL al servidor...${NC}"

# Verificar que existe el archivo SQL
if [ ! -f "db/setup-hostinger-FINAL.sql" ]; then
    echo -e "${RED}❌ Error: No se encuentra el archivo db/setup-hostinger-FINAL.sql${NC}"
    exit 1
fi

# Subir archivo usando SCP
sshpass -p "$SSH_PASS" scp -P $SSH_PORT \
    db/setup-hostinger-FINAL.sql \
    ${SSH_USER}@${SSH_HOST}:~/setup-taroti.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Archivo SQL subido exitosamente${NC}"
else
    echo -e "${RED}❌ Error al subir archivo SQL${NC}"
    echo -e "${YELLOW}Nota: Instala sshpass si no lo tienes: brew install hudochenkov/sshpass/sshpass${NC}"
    exit 1
fi

echo ""

# ============================================================================
# PASO 2: Ejecutar SQL en el servidor
# ============================================================================

echo -e "${YELLOW}[2/4] Ejecutando schema SQL en MySQL...${NC}"

# Ejecutar SQL via SSH
sshpass -p "$SSH_PASS" ssh -p $SSH_PORT ${SSH_USER}@${SSH_HOST} << 'ENDSSH'
    # Ejecutar SQL
    mysql -u u616221621_figoti -p'Taroti2026!' u616221621_figoti < ~/setup-taroti.sql

    if [ $? -eq 0 ]; then
        echo "✅ Schema SQL ejecutado exitosamente"
    else
        echo "❌ Error al ejecutar SQL"
        exit 1
    fi
ENDSSH

echo -e "${GREEN}✅ Schema SQL ejecutado${NC}"
echo ""

# ============================================================================
# PASO 3: Verificar tablas creadas
# ============================================================================

echo -e "${YELLOW}[3/4] Verificando tablas creadas...${NC}"

sshpass -p "$SSH_PASS" ssh -p $SSH_PORT ${SSH_USER}@${SSH_HOST} << 'ENDSSH'
    mysql -u u616221621_figoti -p'Taroti2026!' u616221621_figoti -e "SHOW TABLES;" 2>/dev/null
ENDSSH

echo ""

# ============================================================================
# PASO 4: Verificar estructura de tabla pagos
# ============================================================================

echo -e "${YELLOW}[4/4] Verificando estructura de tabla 'pagos'...${NC}"

sshpass -p "$SSH_PASS" ssh -p $SSH_PORT ${SSH_USER}@${SSH_HOST} << 'ENDSSH'
    echo "Columnas en tabla 'pagos':"
    mysql -u u616221621_figoti -p'Taroti2026!' u616221621_figoti -e "SELECT COUNT(*) as total_columnas FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='u616221621_figoti' AND TABLE_NAME='pagos';" 2>/dev/null
ENDSSH

echo ""

# ============================================================================
# RESUMEN
# ============================================================================

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Base de Datos Configurada Exitosamente                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Resumen:${NC}"
echo -e "   Database: ${GREEN}u616221621_figoti${NC}"
echo -e "   Usuario: ${GREEN}u616221621_figoti${NC}"
echo -e "   Tablas creadas: ${GREEN}5${NC} (pagos, lecturas, sesiones, webhook_events_mp, audit_log)"
echo ""
echo -e "${BLUE}📝 Próximos pasos:${NC}"
echo -e "   1. Configurar archivo .env en el servidor"
echo -e "   2. Subir código de la aplicación"
echo -e "   3. Hacer build y deployment"
echo ""
echo -e "${BLUE}🔗 Conexión a MySQL:${NC}"
echo -e "   mysql -u u616221621_figoti -p u616221621_figoti"
echo ""
