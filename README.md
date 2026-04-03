# 🔮 Taroti

Plataforma web de lecturas de tarot personalizadas generadas con inteligencia artificial.

## Descripción

Taroti es una aplicación web que ofrece lecturas de tarot mediante IA (OpenAI GPT-4o). Los usuarios pueden elegir entre tres tipos de tiradas, realizar su consulta, pagar de forma segura con Mercado Pago y recibir una interpretación personalizada.

## Características principales

- **Tres tipos de tirada**: Tres Cartas, Cruz Celta y Rueda del Año
- **IA avanzada**: Lecturas generadas por GPT-4o con contexto personalizado
- **Dos modalidades**: Usuario anónimo o registrado con Google
- **Pagos seguros**: Integración con Mercado Pago (Chile)
- **Historial**: Los usuarios registrados pueden consultar sus lecturas anteriores
- **Panel administrativo**: Gestión de planes, configuraciones y estadísticas

## Stack tecnológico

### Backend
- **Runtime**: Node.js 24
- **Framework**: Fastify
- **ORM**: Prisma
- **Base de datos**: MySQL
- **Autenticación**: Google Identity Services + JWT
- **Pagos**: Mercado Pago
- **IA**: OpenAI GPT-4o

### Frontend
- **Framework**: SvelteKit
- **Animaciones**: GSAP 3
- **Tipografía**: Cinzel (Google Fonts)
- **Deployment**: Static export

### Infraestructura
- **Hosting**: Hostinger Business
- **Entornos**:
  - Producción: `taroti.fun`
  - Test: `dev.taroti.fun`

## Estructura del proyecto

```
taroti/
├── backend/      # API REST con Fastify
├── frontend/     # Aplicación SvelteKit
└── README.md
```

## Estado del proyecto

**Fase actual**: MVP en desarrollo

## Licencia

Privado - Todos los derechos reservados

---

*Generado en Abril 2026*
