#!/bin/bash

# 🔮 Taroti - Script de Deploy a Producción (Hostinger)
# Este script prepara la aplicación para ser desplegada en Hostinger

set -e  # Detener si hay errores

echo "════════════════════════════════════════════════════════════════"
echo "           🔮 DEPLOY A PRODUCCIÓN - HOSTINGER                   "
echo "════════════════════════════════════════════════════════════════"
echo ""

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Debes ejecutar este script desde la carpeta /backend"
    exit 1
fi

echo "📦 Paso 1: Instalando dependencias de producción..."
npm ci --production=false
echo "   ✓ Dependencias instaladas"
echo ""

echo "🔨 Paso 2: Compilando TypeScript..."
npm run build
echo "   ✓ Código compilado en /dist"
echo ""

echo "🗄️  Paso 3: Generando Prisma Client..."
npx prisma generate
echo "   ✓ Prisma Client generado"
echo ""

echo "📋 Paso 4: Verificando archivos necesarios..."
if [ ! -f ".env" ]; then
    echo "   ⚠️  WARNING: No se encontró archivo .env"
    echo "   → Crea uno basado en .env.example antes de deployar"
else
    echo "   ✓ Archivo .env encontrado"
fi

if [ ! -d "dist" ]; then
    echo "   ❌ Error: No se generó la carpeta /dist"
    exit 1
fi
echo "   ✓ Todos los archivos necesarios están presentes"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "                  ✅ BUILD COMPLETADO                           "
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📁 Archivos listos para deploy:"
echo "   • /dist - Código compilado"
echo "   • /node_modules - Dependencias"
echo "   • /prisma - Schema y migraciones"
echo "   • .env - Variables de entorno (crear en producción)"
echo ""
echo "🚀 Próximos pasos en Hostinger:"
echo "   1. Sube los archivos al servidor via FTP/SFTP"
echo "   2. Crea archivo .env con variables de producción"
echo "   3. Ejecuta: npm run prisma:migrate:deploy"
echo "   4. Ejecuta: npm run prisma:seed"
echo "   5. Inicia la app: npm run start:prod"
echo ""
echo "📖 Consulta DEPLOY_HOSTINGER.md para instrucciones completas"
echo ""
