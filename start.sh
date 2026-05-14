#!/bin/bash

# Script para levantar el proyecto Taroti
# Uso: ./start.sh

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔮 Iniciando Taroti...${NC}\n"

# 1. Verificar MySQL
echo -e "${YELLOW}📊 Verificando MySQL...${NC}"
if lsof -i :3306 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ MySQL está corriendo en puerto 3306${NC}"
else
    echo -e "${RED}✗ MySQL no está corriendo en puerto 3306${NC}"
    echo -e "${YELLOW}Intentando iniciar MySQL con Homebrew...${NC}"

    if command -v brew &> /dev/null && brew list mysql &> /dev/null; then
        brew services start mysql
        echo -e "${YELLOW}Esperando a que MySQL inicie...${NC}"
        sleep 5

        if lsof -i :3306 >/dev/null 2>&1; then
            echo -e "${GREEN}✓ MySQL iniciado exitosamente${NC}"
        else
            echo -e "${RED}✗ No se pudo iniciar MySQL${NC}"
            echo -e "${YELLOW}Verifica que MySQL esté instalado o que Docker esté corriendo${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}MySQL no encontrado con Homebrew. Verifica que Docker esté corriendo.${NC}"
    fi
fi

# 2. Verificar y configurar Backend
echo -e "\n${YELLOW}⚙️  Configurando Backend...${NC}"
cd backend

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Archivo .env no encontrado en backend${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Creado .env desde .env.example${NC}"
        echo -e "${RED}⚠️  IMPORTANTE: Configura las variables de entorno en backend/.env${NC}"
        exit 1
    else
        echo -e "${RED}✗ No se encontró .env.example${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Archivo .env encontrado${NC}"
fi

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependencias del backend...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencias instaladas${NC}"
else
    echo -e "${GREEN}✓ Dependencias del backend ya instaladas${NC}"
fi

echo -e "${YELLOW}🗄️  Aplicando migraciones de base de datos...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✓ Migraciones aplicadas${NC}"

# 3. Verificar y configurar Frontend
echo -e "\n${YELLOW}⚙️  Configurando Frontend...${NC}"
cd ../frontend

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Archivo .env no encontrado en frontend${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Creado .env desde .env.example${NC}"
        echo -e "${RED}⚠️  IMPORTANTE: Configura las variables de entorno en frontend/.env${NC}"
        exit 1
    else
        echo -e "${RED}✗ No se encontró .env.example${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Archivo .env encontrado${NC}"
fi

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependencias del frontend...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencias instaladas${NC}"
else
    echo -e "${GREEN}✓ Dependencias del frontend ya instaladas${NC}"
fi

# 4. Iniciar servidores
cd ..
echo -e "\n${GREEN}🚀 Iniciando servidores...${NC}\n"

# Verificar si ya hay procesos corriendo
if lsof -i :4000 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  El puerto 4000 ya está en uso (backend)${NC}"
    read -p "¿Deseas detener el proceso existente? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        lsof -ti :4000 | xargs kill -9 2>/dev/null || true
        sleep 2
        echo -e "${GREEN}✓ Proceso anterior detenido${NC}"
    else
        echo -e "${YELLOW}Manteniendo proceso existente en puerto 4000${NC}"
    fi
fi

if lsof -i :5173 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  El puerto 5173 ya está en uso (frontend)${NC}"
    read -p "¿Deseas detener el proceso existente? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        lsof -ti :5173 | xargs kill -9 2>/dev/null || true
        sleep 2
        echo -e "${GREEN}✓ Proceso anterior detenido${NC}"
    else
        echo -e "${YELLOW}Manteniendo proceso existente en puerto 5173${NC}"
    fi
fi

# Iniciar backend en segundo plano
echo -e "${YELLOW}🔧 Iniciando backend en http://localhost:4000${NC}"
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..

# Esperar a que el backend inicie
sleep 3

# Verificar que el backend esté corriendo
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${GREEN}✓ Backend iniciado (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ Error al iniciar el backend${NC}"
    echo -e "${YELLOW}Ver logs en: logs/backend.log${NC}"
    exit 1
fi

# Iniciar frontend en segundo plano
echo -e "${YELLOW}🎨 Iniciando frontend en http://localhost:5173${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..

# Esperar a que el frontend inicie
sleep 3

# Verificar que el frontend esté corriendo
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${GREEN}✓ Frontend iniciado (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}✗ Error al iniciar el frontend${NC}"
    echo -e "${YELLOW}Ver logs en: logs/frontend.log${NC}"
    exit 1
fi

# Resumen final
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Taroti está corriendo exitosamente ✨${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}📍 URLs:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "   Backend:  ${GREEN}http://localhost:4000${NC}"
echo -e "   API:      ${GREEN}http://localhost:4000/api${NC}\n"

echo -e "${YELLOW}📝 Logs:${NC}"
echo -e "   Backend:  ${GREEN}tail -f logs/backend.log${NC}"
echo -e "   Frontend: ${GREEN}tail -f logs/frontend.log${NC}\n"

echo -e "${YELLOW}🛑 Para detener:${NC}"
echo -e "   Ejecuta: ${GREEN}./stop.sh${NC}\n"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
