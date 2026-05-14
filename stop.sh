#!/bin/bash

# Script para detener el proyecto Taroti
# Uso: ./stop.sh

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Deteniendo Taroti...${NC}\n"

# Detener procesos por PIDs guardados
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID 2>/dev/null || kill -9 $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✓ Backend detenido (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend no está corriendo${NC}"
    fi
    rm logs/backend.pid
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID 2>/dev/null || kill -9 $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✓ Frontend detenido (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend no está corriendo${NC}"
    fi
    rm logs/frontend.pid
fi

# Detener procesos por puerto (fallback)
if lsof -i :4000 >/dev/null 2>&1; then
    echo -e "${YELLOW}Deteniendo proceso en puerto 4000...${NC}"
    lsof -ti :4000 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✓ Puerto 4000 liberado${NC}"
fi

if lsof -i :5173 >/dev/null 2>&1; then
    echo -e "${YELLOW}Deteniendo proceso en puerto 5173...${NC}"
    lsof -ti :5173 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✓ Puerto 5173 liberado${NC}"
fi

echo -e "\n${GREEN}✨ Taroti detenido exitosamente${NC}\n"
