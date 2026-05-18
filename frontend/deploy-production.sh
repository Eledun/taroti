#!/bin/bash

# 🔮 Taroti Frontend - Script de Build para Producción
# Este script compila el frontend de SvelteKit para producción en Hostinger

set -e  # Detener si hay errores

echo "════════════════════════════════════════════════════════════════"
echo "        🔮 BUILD FRONTEND PARA PRODUCCIÓN - HOSTINGER           "
echo "════════════════════════════════════════════════════════════════"
echo ""

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Debes ejecutar este script desde la carpeta /frontend"
    exit 1
fi

echo "📦 Paso 1: Instalando dependencias..."
npm ci
echo "   ✓ Dependencias instaladas"
echo ""

echo "🔍 Paso 2: Verificando variables de entorno..."
if [ ! -f ".env" ]; then
    echo "   ⚠️  WARNING: No se encontró archivo .env"
    echo "   → Asegúrate de tener PUBLIC_API_URL configurado correctamente"
    echo "   → Para producción debe ser: https://api.tudominio.com/api"
else
    echo "   ✓ Archivo .env encontrado"
    grep "PUBLIC_API_URL" .env || echo "   ⚠️  PUBLIC_API_URL no encontrado en .env"
fi
echo ""

echo "🏗️  Paso 3: Compilando aplicación SvelteKit..."
npm run build
echo "   ✓ Build completado"
echo ""

echo "📋 Paso 4: Verificando archivos generados..."
if [ ! -d "build" ]; then
    echo "   ❌ Error: No se generó la carpeta /build"
    exit 1
fi
echo "   ✓ Carpeta /build generada correctamente"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "                  ✅ BUILD COMPLETADO                           "
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📁 Archivos listos para deploy:"
echo "   • /build - Aplicación compilada (SPA)"
echo "   • /static - Archivos estáticos"
echo ""
echo "🚀 Próximos pasos en Hostinger:"
echo "   1. Sube todo el contenido de /build a public_html/"
echo "   2. Configura .htaccess para SPA routing"
echo "   3. Verifica que tu dominio apunte correctamente"
echo ""
echo "📖 Consulta DEPLOY_HOSTINGER.md para instrucciones completas"
echo ""
