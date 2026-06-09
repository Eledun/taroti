#!/bin/bash
# ============================================================================
# Script para ejecutar DENTRO del servidor Hostinger
# ============================================================================
# Instrucciones:
# 1. Primero sube el archivo SQL al servidor (desde tu máquina local):
#    scp -P 65002 "/Users/dr.herrera/Figotilabs/taroti LATAM/db/setup-hostinger-FINAL.sql" u616221621@185.173.111.183:~/setup-taroti.sql
#
# 2. Luego ejecuta este script EN EL SERVIDOR:
#    bash ~/run-on-hostinger.sh
# ============================================================================

set -e

echo "========================================="
echo "Setup Base de Datos - TAROTI LATAM"
echo "========================================="
echo ""

# Credenciales
MYSQL_USER="u616221621_figoti"
MYSQL_PASS="Taroti2026!"
MYSQL_DB="u616221621_figoti"

echo "[1/3] Verificando archivo SQL..."
if [ ! -f ~/setup-taroti.sql ]; then
    echo "❌ ERROR: No se encuentra ~/setup-taroti.sql"
    echo "Por favor sube el archivo primero con:"
    echo "scp -P 65002 'db/setup-hostinger-FINAL.sql' u616221621@185.173.111.183:~/setup-taroti.sql"
    exit 1
fi
echo "✅ Archivo SQL encontrado"
echo ""

echo "[2/3] Ejecutando schema SQL en MySQL..."
mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" < ~/setup-taroti.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema ejecutado exitosamente"
else
    echo "❌ Error al ejecutar SQL"
    exit 1
fi
echo ""

echo "[3/3] Verificando tablas creadas..."
mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" -e "SHOW TABLES;"
echo ""

echo "========================================="
echo "✅ Setup completado exitosamente"
echo "========================================="
echo ""
echo "Tablas creadas:"
mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" -e "SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA='$MYSQL_DB' ORDER BY TABLE_NAME;"
echo ""
echo "Columnas en tabla 'pagos':"
mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" -e "SELECT COUNT(*) as total_columnas FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$MYSQL_DB' AND TABLE_NAME='pagos';"
