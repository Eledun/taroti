#!/bin/bash

# Deploy a Hostinger usando SCP con contraseña
# Versión: 2.3.12

set -e

echo "=========================================="
echo "  TAROTI - Deploy a Hostinger"
echo "=========================================="
echo ""

# Configuración
HOSTINGER_USER="u616221621"
HOSTINGER_HOST="185.173.111.183"
HOSTINGER_PORT="65002"
HOSTINGER_PASSWORD="Taroti2026!"
HOSTINGER_PATH="/home/u616221621/domains/dimgrey-louse-600796.hostingersite.com/nodejs"

# Verificar archivos locales
echo "[1/6] Verificando archivos locales..."
if [ ! -d "./build" ]; then
    echo "Error: No existe el directorio build/"
    exit 1
fi

if [ ! -f "./start-server.js" ]; then
    echo "Error: No existe start-server.js"
    exit 1
fi

if [ ! -f "./package.json" ]; then
    echo "Error: No existe package.json"
    exit 1
fi

echo "✓ Archivos verificados"
echo ""

# Crear script expect temporal
echo "[2/6] Preparando conexión SSH..."
cat > /tmp/hostinger_deploy.exp << 'EOF'
#!/usr/bin/expect -f

set timeout 30
set password [lindex $argv 0]
set host [lindex $argv 1]
set port [lindex $argv 2]
set user [lindex $argv 3]
set command [lindex $argv 4]

spawn ssh -p $port -o StrictHostKeyChecking=no $user@$host $command
expect {
    "password:" {
        send "$password\r"
        expect eof
    }
    timeout {
        puts "Timeout!"
        exit 1
    }
}
EOF

chmod +x /tmp/hostinger_deploy.exp

# Hacer backup
echo "[3/6] Haciendo backup del build anterior..."
/tmp/hostinger_deploy.exp "$HOSTINGER_PASSWORD" "$HOSTINGER_HOST" "$HOSTINGER_PORT" "$HOSTINGER_USER" \
    "cd $HOSTINGER_PATH && mv build build.backup.\$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo 'No hay build previo'"

echo "✓ Backup completado"
echo ""

# Subir archivos usando SCP con expect
echo "[4/6] Subiendo archivos..."

cat > /tmp/hostinger_scp.exp << 'EOF'
#!/usr/bin/expect -f

set timeout 120
set password [lindex $argv 0]
set port [lindex $argv 1]
set source [lindex $argv 2]
set destination [lindex $argv 3]

spawn scp -P $port -r -o StrictHostKeyChecking=no $source $destination
expect {
    "password:" {
        send "$password\r"
        expect {
            "100%" {
                expect eof
            }
            eof
        }
    }
    timeout {
        puts "Timeout during upload!"
        exit 1
    }
}
EOF

chmod +x /tmp/hostinger_scp.exp

echo "  Subiendo build/..."
/tmp/hostinger_scp.exp "$HOSTINGER_PASSWORD" "$HOSTINGER_PORT" \
    "./build" "$HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH/"

echo "  Subiendo package.json..."
/tmp/hostinger_scp.exp "$HOSTINGER_PASSWORD" "$HOSTINGER_PORT" \
    "./package.json" "$HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH/"

echo "  Subiendo start-server.js..."
/tmp/hostinger_scp.exp "$HOSTINGER_PASSWORD" "$HOSTINGER_PORT" \
    "./start-server.js" "$HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH/"

if [ -f ".env.production" ]; then
    echo "  Subiendo .env..."
    /tmp/hostinger_scp.exp "$HOSTINGER_PASSWORD" "$HOSTINGER_PORT" \
        "./.env.production" "$HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH/.env"
fi

echo "✓ Archivos subidos"
echo ""

# Instalar dependencias
echo "[5/6] Instalando dependencias en servidor..."
/tmp/hostinger_deploy.exp "$HOSTINGER_PASSWORD" "$HOSTINGER_HOST" "$HOSTINGER_PORT" "$HOSTINGER_USER" \
    "cd $HOSTINGER_PATH && export PATH=/opt/alt/alt-nodejs22/root/bin:\$PATH && npm install --production"

echo "✓ Dependencias instaladas"
echo ""

# Reiniciar Passenger
echo "[6/6] Reiniciando aplicación..."
/tmp/hostinger_deploy.exp "$HOSTINGER_PASSWORD" "$HOSTINGER_HOST" "$HOSTINGER_PORT" "$HOSTINGER_USER" \
    "cd $HOSTINGER_PATH && mkdir -p tmp && touch tmp/restart.txt"

echo "✓ Aplicación reiniciada"
echo ""

# Limpiar archivos temporales
rm -f /tmp/hostinger_deploy.exp /tmp/hostinger_scp.exp

echo "=========================================="
echo "  ✓ DEPLOY COMPLETADO"
echo "=========================================="
echo ""
echo "URL: https://dimgrey-louse-600796.hostingersite.com"
echo ""
