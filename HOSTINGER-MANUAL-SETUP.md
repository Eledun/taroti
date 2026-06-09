# 🔧 Setup Manual de Base de Datos en Hostinger (Sin SSH)

## ⚠️ Por Qué Este Método

El acceso SSH está bloqueado o requiere configuración adicional en tu panel de Hostinger.
Este método usa **phpMyAdmin** o el **Terminal MySQL** de Hostinger directamente desde el navegador.

---

## 📋 Credenciales

```
Database: u616221621_figoti
Usuario: u616221621_figoti
Password: Taroti2026!
Sitio: dimgrey-louse-600796.hostingersite.com
```

---

## 🎯 OPCIÓN 1: Usando phpMyAdmin (Recomendado)

### Paso 1: Acceder a phpMyAdmin

1. Ve a tu panel de Hostinger: https://hpanel.hostinger.com/
2. Selecciona tu sitio: **dimgrey-louse-600796.hostingersite.com**
3. En el menú lateral, haz clic en **Bases de datos** → **phpMyAdmin**
4. O busca el botón "Administrar" junto a tu base de datos `u616221621_figoti`

### Paso 2: Login en phpMyAdmin

- Usuario: `u616221621_figoti`
- Password: `Taroti2026!`

### Paso 3: Seleccionar Base de Datos

En el panel izquierdo, haz clic en la base de datos: **u616221621_figoti**

### Paso 4: Ejecutar SQL

1. Haz clic en la pestaña **SQL** en la parte superior
2. Abre el archivo `/Users/dr.herrera/Figotilabs/taroti LATAM/db/setup-hostinger-FINAL.sql` en tu editor local
3. **COPIA TODO EL CONTENIDO** del archivo SQL
4. **PEGA** el contenido en el cuadro de texto de phpMyAdmin
5. Haz clic en el botón **"Continuar"** o **"Go"** en la esquina inferior derecha

### Paso 5: Verificar Tablas Creadas

1. En el panel izquierdo, deberías ver las 5 tablas creadas:
   - ✅ `pagos`
   - ✅ `lecturas`
   - ✅ `sesiones`
   - ✅ `webhook_events_mp`
   - ✅ `audit_log`

2. Haz clic en la tabla **pagos** para verificar que tiene 27 columnas

---

## 🎯 OPCIÓN 2: Usando Terminal MySQL de Hostinger

### Paso 1: Acceder al Terminal

1. Ve a tu panel de Hostinger
2. Busca la opción **"Terminal"** o **"SSH/Shell Access"**
3. Puede estar en: **Avanzado** → **Terminal Web**

### Paso 2: Conectar a MySQL

Ejecuta en el terminal:

```bash
mysql -u u616221621_figoti -p u616221621_figoti
```

Cuando pida password, ingresa: `Taroti2026!`

### Paso 3: Verificar Conexión

Deberías ver:

```
Welcome to the MariaDB monitor.
MariaDB [u616221621_figoti]>
```

### Paso 4: Pegar SQL

**PROBLEMA**: El terminal web de Hostinger NO permite pegar archivos grandes.

**SOLUCIÓN**: Divide el SQL en partes o usa phpMyAdmin (Opción 1).

---

## 🎯 OPCIÓN 3: Subir Archivo SQL y Ejecutar (Si Terminal funciona)

### Paso 1: Subir Archivo SQL

Si tienes acceso FTP o File Manager:

1. Ve a **Archivos** → **Administrador de archivos**
2. Navega a tu directorio home (`/home/u616221621/`)
3. Sube el archivo `setup-hostinger-FINAL.sql`

### Paso 2: Ejecutar SQL desde Terminal

En el terminal web de Hostinger:

```bash
mysql -u u616221621_figoti -p u616221621_figoti < ~/setup-hostinger-FINAL.sql
```

---

## ✅ Verificación Final

Ejecuta en phpMyAdmin o MySQL terminal:

```sql
-- Ver tablas creadas
SHOW TABLES;

-- Debe mostrar:
-- audit_log
-- lecturas
-- pagos
-- sesiones
-- webhook_events_mp

-- Verificar estructura de tabla pagos
DESCRIBE pagos;

-- Debe mostrar 27 columnas
```

---

## 🔍 Troubleshooting

### Error: "Access denied"

**Solución**: Verifica que estés usando:
- Usuario: `u616221621_figoti`
- Password: `Taroti2026!`
- Base de datos: `u616221621_figoti`

### Error: "Table already exists"

**Solución**: Las tablas ya existen. Puedes:

1. **Eliminarlas primero** (en phpMyAdmin → SQL):

```sql
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS webhook_events_mp;
DROP TABLE IF EXISTS lecturas;
DROP TABLE IF EXISTS sesiones;
DROP TABLE IF EXISTS pagos;
```

2. Luego volver a ejecutar el schema completo.

### Error: "Max execution time exceeded"

**Solución**: phpMyAdmin tiene límite de tiempo. Divide el SQL en partes:

**Parte 1: Crear tabla pagos**
```sql
USE u616221621_figoti;
SET NAMES utf8mb4;
-- [COPIAR SOLO CREATE TABLE pagos]
```

**Parte 2: Crear tabla lecturas**
```sql
-- [COPIAR SOLO CREATE TABLE lecturas]
```

Y así sucesivamente para cada tabla.

---

## 📝 Checklist

- [ ] Acceso a phpMyAdmin exitoso
- [ ] Base de datos `u616221621_figoti` seleccionada
- [ ] SQL pegado en el editor de phpMyAdmin
- [ ] SQL ejecutado sin errores
- [ ] 5 tablas verificadas en panel izquierdo
- [ ] Tabla `pagos` tiene 27 columnas (verificar con DESCRIBE)

---

## 🚀 Próximo Paso

Una vez creadas las tablas, deberás:

1. Subir el código de la aplicación al servidor
2. Configurar archivo `.env` con las credenciales de la base de datos
3. Hacer build de producción
4. Configurar Node.js y PM2

---

## 💡 Nota Sobre SSH

**Si quieres habilitar SSH para futuros deployments:**

1. Ve a tu panel de Hostinger
2. **Avanzado** → **SSH Access**
3. Habilita SSH (puede requerir plan Premium o Business)
4. Genera una clave SSH si es necesario
5. Algunos planes de Hostinger NO incluyen SSH, solo planes superiores

**Planes que incluyen SSH:**
- ❌ Single Web Hosting
- ✅ Premium Web Hosting
- ✅ Business Web Hosting
- ✅ Cloud Hosting
- ✅ VPS Hosting

Verifica tu plan actual en: **Panel → Mi Plan**
