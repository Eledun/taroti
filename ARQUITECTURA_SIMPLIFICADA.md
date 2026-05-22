# 🔮 Taroti - Arquitectura Simplificada (Solo SvelteKit)

**Fecha**: 22 de mayo de 2026
**Estado**: ✅ Implementado y compilado exitosamente

---

## 📋 Resumen

Taroti ha sido migrado a una **arquitectura simplificada** que elimina el backend externo y la base de datos MySQL. Ahora funciona completamente con **SvelteKit** utilizando server endpoints para llamar a las APIs externas (Mercado Pago y OpenAI) de forma segura.

---

## 🏗️ Arquitectura Actual

```
Usuario
  ↓
SvelteKit App (Hostinger con Node.js)
  ├── Frontend (páginas + componentes)
  └── Server Endpoints (+server.ts)
        ↓
        ├─→ Mercado Pago API (pagos)
        └─→ OpenAI API (lecturas de tarot)
```

### ✅ **Lo que SÍ tiene**
- Frontend completo en SvelteKit
- Server endpoints para API calls seguros
- Planes hardcodeados (sin DB)
- Sesiones en sessionStorage (navegador)
- Integración con Mercado Pago
- Generación de lecturas con OpenAI GPT-4o

### ❌ **Lo que NO tiene**
- Backend Fastify separado
- Base de datos MySQL/Prisma
- Autenticación de usuarios
- Historial de lecturas persistente
- Docker/docker-compose

---

## 📁 Estructura del Proyecto

```
taroti/
└── frontend/
    ├── src/
    │   ├── lib/
    │   │   ├── components/      # Componentes UI
    │   │   ├── data/
    │   │   │   ├── planes.ts    # ✅ Planes hardcodeados
    │   │   │   └── arcanos-mayores.ts
    │   │   ├── services/
    │   │   │   └── api.ts       # ✅ Cliente API refactorizado
    │   │   └── types/
    │   │       └── index.ts     # Tipos TypeScript
    │   └── routes/
    │       ├── api/             # ✅ Server Endpoints
    │       │   ├── planes/
    │       │   │   └── +server.ts
    │       │   ├── sesiones/
    │       │   │   └── +server.ts
    │       │   ├── pagos/
    │       │   │   └── preference/
    │       │   │       └── +server.ts
    │       │   └── lecturas/
    │       │       └── [sesion_id]/
    │       │           └── +server.ts
    │       ├── consulta/
    │       │   └── [plan_id]/
    │       │       └── +page.svelte
    │       ├── lectura/
    │       │   └── [sesion_id]/
    │       │       ├── +page.ts
    │       │       └── +page.svelte
    │       ├── pago/
    │       │   ├── exito/
    │       │   ├── error/
    │       │   └── pendiente/
    │       └── +page.svelte
    ├── build/                   # ✅ Output del build (Node.js)
    ├── .env                     # ✅ Variables de entorno
    ├── .env.example
    ├── svelte.config.js         # ✅ Configurado con adapter-node
    └── package.json
```

---

## 🔐 Variables de Entorno

**Archivo**: `frontend/.env`

```env
# Mercado Pago (PRIVADO - solo server)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-XXXXXXXX
MERCADOPAGO_WEBHOOK_SECRET=XXXXXXXX

# Public Key (puede ser público)
PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-XXXXXXXX

# OpenAI (PRIVADO - solo server)
OPENAI_API_KEY=sk-proj-XXXXXXXX

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

**⚠️ IMPORTANTE:**
- Las variables **sin** `PUBLIC_` solo están disponibles en server endpoints
- Las variables **con** `PUBLIC_` están expuestas al cliente
- **NUNCA** pongas API keys con prefijo `PUBLIC_`

---

## 🔌 Server Endpoints

### 1. **GET /api/planes**
Retorna lista hardcodeada de planes disponibles.

**Response:**
```json
[
  {
    "id": "tres-cartas",
    "nombre": "Tres Cartas",
    "tipo_tirada": "tres_cartas",
    "num_cartas": 3,
    "precio_final": 5000
  },
  ...
]
```

### 2. **POST /api/sesiones**
Crea una sesión temporal (solo en memoria del servidor durante el request).

**Body:**
```json
{
  "plan_id": "tres-cartas",
  "pregunta": "¿Qué me depara el futuro?",
  "cartas": [...]
}
```

**Response:**
```json
{
  "id": "1234567890-abc123",
  "pregunta": "...",
  "cartas": [...],
  "estado": "pendiente",
  "precio": 5000,
  "token_acceso": "random_token_here"
}
```

### 3. **POST /api/pagos/preference**
Crea una preferencia de pago en Mercado Pago.

**Body:**
```json
{
  "sesion_id": "1234567890-abc123",
  "plan_nombre": "Tres Cartas",
  "precio": 5000
}
```

**Response:**
```json
{
  "preference_id": "123456789-abc-def",
  "init_point": "https://mercadopago.com/checkout/..."
}
```

### 4. **GET /api/lecturas/[sesion_id]**
Genera la lectura usando OpenAI GPT-4o.

**Query params:**
- `pregunta`: La pregunta del usuario
- `cartas`: JSON string con las cartas seleccionadas
- `tipo_tirada`: tres_cartas | cruz_celta | rueda_del_anio
- `plan_nombre`: Nombre del plan

**Response:**
```json
{
  "id": "lectura-1234567890",
  "sesion_id": "1234567890-abc123",
  "pregunta": "...",
  "cartas": [...],
  "interpretacion": "La lectura completa en markdown...",
  "ambito_detectado": "general",
  "creado_en": "2026-05-22T..."
}
```

---

## 🔄 Flujo Completo

1. **Usuario selecciona plan** → `/consulta/[plan_id]`
2. **Ingresa pregunta** → `frontend/src/routes/consulta/[plan_id]/+page.svelte`
3. **Selecciona cartas** → `CardSelection.svelte`
4. **Se crea sesión** → `POST /api/sesiones`
5. **Datos guardados en sessionStorage** → `sessionStorage.setItem('sesion_...')`
6. **Se crea pago** → `POST /api/pagos/preference`
7. **Usuario paga en Mercado Pago** → Redirige a back_urls
8. **Mercado Pago redirige** → `/pago/exito?external_reference=sesion_id`
9. **Usuario ve página de lectura** → `/lectura/[sesion_id]`
10. **Se recupera sesión** → `sessionStorage.getItem('sesion_...')`
11. **Se genera lectura** → `GET /api/lecturas/[sesion_id]` (llama a OpenAI)
12. **Usuario ve su lectura** ✅

---

## 🚀 Deploy en Hostinger

### Requisitos
- Hosting con soporte para Node.js
- Node.js 22.x
- Acceso SSH o panel hPanel

### Pasos

1. **Compilar el proyecto**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **El build genera**:
   - `frontend/build/` → Aplicación Node.js completa
   - Incluye server endpoints, assets, etc.

3. **Subir a Hostinger**:
   - Copiar contenido de `build/` a `/public_html/taroti/` (o donde prefieras)
   - Configurar Node.js app en hPanel:
     - **Carpeta**: `/public_html/taroti`
     - **Archivo de inicio**: `index.js`
     - **Versión Node**: 22.x
     - **Variables de entorno**: Configurar las del `.env`

4. **Iniciar la app**:
   - Desde hPanel → Node.js → Start

---

## 🧪 Testing Local

```bash
# 1. Instalar dependencias
cd frontend
npm install

# 2. Configurar .env con tus credenciales
cp .env.example .env
# Editar .env y agregar:
# - MERCADOPAGO_ACCESS_TOKEN
# - OPENAI_API_KEY
# - Etc.

# 3. Modo desarrollo
npm run dev

# 4. Build para producción
npm run build

# 5. Preview del build
npm run preview
```

---

## 📝 Notas Importantes

### ⚠️ Limitaciones de sessionStorage
- Los datos de sesión **solo viven mientras el tab del navegador esté abierto**
- Si el usuario cierra el tab antes de pagar, perderá la sesión
- Para producción, considera implementar una solución de persistencia temporal (Redis, KV store, etc.)

### 🔑 Seguridad
- Las API keys **nunca** se exponen al cliente
- Solo los server endpoints (+server.ts) pueden acceder a variables privadas
- Mercado Pago maneja la seguridad de pagos

### 🎨 Personalización
- Planes: Editar `frontend/src/lib/data/planes.ts`
- Prompts de IA: Editar `frontend/src/routes/api/lecturas/[sesion_id]/+server.ts`
- Estilos: Archivos `.svelte` tienen `<style>` scoped

---

## 📞 Soporte

Si tienes problemas:
1. Verifica que las variables de entorno estén configuradas
2. Revisa los logs del servidor Node.js
3. Usa `npm run check` para verificar errores de TypeScript
4. Usa `npm run build` para verificar que compile sin errores

---

**✅ Estado actual**: Migración completada y build exitoso
**🚀 Próximo paso**: Configurar credenciales de producción y deploy a Hostinger
