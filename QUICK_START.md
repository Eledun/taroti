# 🚀 Guía de Inicio Rápido - Taroti

## Levantar el Proyecto

```bash
./start.sh
```

Esto iniciará automáticamente:
- ✅ MySQL (si no está corriendo)
- ✅ Backend en `http://localhost:4000`
- ✅ Frontend en `http://localhost:5173`

## Detener el Proyecto

```bash
./stop.sh
```

## Ver Logs en Tiempo Real

```bash
# Backend
tail -f logs/backend.log

# Frontend
tail -f logs/frontend.log
```

## URLs del Proyecto

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **API Endpoints**: http://localhost:4000/api

## Estructura de Archivos Importante

```
taroti/
├── start.sh          # Script para levantar todo
├── stop.sh           # Script para detener todo
├── logs/             # Logs de backend y frontend
│   ├── backend.log
│   ├── frontend.log
│   ├── backend.pid
│   └── frontend.pid
├── backend/
│   ├── .env          # Variables de entorno del backend
│   └── prisma/       # Base de datos y migraciones
└── frontend/
    └── .env          # Variables de entorno del frontend
```

## Primera Vez

Si es la primera vez que levantas el proyecto:

1. **Asegúrate de tener MySQL corriendo** (Docker o Homebrew)
2. **Crea los archivos .env** (el script lo hará automáticamente desde .env.example)
3. **Ejecuta**: `./start.sh`
4. **Espera** unos segundos mientras instala dependencias y aplica migraciones
5. **Accede** a http://localhost:5173

## Comandos Útiles

```bash
# Ver procesos corriendo en los puertos
lsof -i :4000    # Backend
lsof -i :5173    # Frontend
lsof -i :3306    # MySQL

# Acceder a la base de datos
cd backend
npx prisma studio

# Ver todas las sesiones en la base de datos
mysql -u taroti_user -p -h localhost -P 3306 taroti_dev
```

## Troubleshooting

### Puerto ya en uso

Si ves "Address already in use":
```bash
./stop.sh
./start.sh
```

### No se puede conectar a MySQL

Verifica que MySQL esté corriendo:
```bash
lsof -i :3306
```

Si no está corriendo:
```bash
# Con Homebrew
brew services start mysql

# Con Docker
docker-compose up -d
```

### Cambios en .env no se reflejan

```bash
./stop.sh
./start.sh
```

## Más Información

Ver el [README.md](README.md) completo para documentación detallada.
