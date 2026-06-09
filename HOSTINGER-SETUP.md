# 🚀 Setup Base de Datos en Hostinger - Guía Paso a Paso

## 📋 Credenciales SSH
```
IP: 185.173.111.183
Puerto: 65002
Usuario: u616221621
Password: Taroti2026!
```

## 🔌 PASO 1: Conectarse via SSH

Desde tu terminal local, ejecuta:

```bash
ssh -p 65002 u616221621@185.173.111.183
```

Cuando pida password, ingresa: `Taroti2026!`

---

## 🔍 PASO 2: Verificar MySQL/MariaDB

Una vez conectado al servidor, verifica qué versión de MySQL tienes:

```bash
mysql --version
```

Salida esperada: `mysql  Ver 15.1 Distrib 10.X.X-MariaDB...`

---

## 🗄️ PASO 3: Acceder a MySQL

En Hostinger, usualmente el usuario root de MySQL tiene las mismas credenciales que tu usuario de hosting:

```bash
mysql -u u616221621 -p
```

Password: `Taroti2026!`

Si funciona, deberías ver:
```
Welcome to the MariaDB monitor.
MariaDB [(none)]>
```

---

## 📊 PASO 4: Crear Base de Datos

Dentro de la consola de MySQL, ejecuta:

```sql
-- Crear base de datos con charset UTF8MB4
CREATE DATABASE u616221621_taroti CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verificar que se creó
SHOW DATABASES;
```

**Nota**: En Hostinger, el nombre de la base de datos debe comenzar con tu usuario (`u616221621_`)

Salida esperada:
```
+--------------------+
| Database           |
+--------------------+
| u616221621_taroti  |
| information_schema |
| ...                |
+--------------------+
```

---

## 👤 PASO 5: Usar la Base de Datos

```sql
USE u616221621_taroti;
```

Salida: `Database changed`

---

## 📝 PASO 6: Subir el Schema SQL

**Opción A: Copiar/Pegar Directo en MySQL**

1. Mantén la sesión MySQL abierta
2. En otra terminal, copia el contenido de `db/schema-production-v2.3.10.sql`
3. Pega el SQL completo en la consola MySQL
4. Presiona Enter

**Opción B: Subir archivo y ejecutar (Recomendado)**

1. Salir de MySQL:
   ```sql
   exit;
   ```

2. Subir el archivo SQL al servidor (desde tu máquina local):
   ```bash
   scp -P 65002 db/schema-production-v2.3.10.sql u616221621@185.173.111.183:~/
   ```

3. En el servidor SSH, ejecutar:
   ```bash
   mysql -u u616221621 -p u616221621_taroti < schema-production-v2.3.10.sql
   ```

---

## ✅ PASO 7: Verificar Instalación

Volver a entrar a MySQL:

```bash
mysql -u u616221621 -p u616221621_taroti
```

Verificar tablas creadas:

```sql
SHOW TABLES;
```

Salida esperada:
```
+-----------------------------+
| Tables_in_u616221621_taroti |
+-----------------------------+
| audit_log                   |
| lecturas                    |
| pagos                       |
| sesiones                    |
| webhook_events_mp           |
+-----------------------------+
5 rows in set
```

Verificar estructura de tabla `pagos`:

```sql
DESCRIBE pagos;
```

Debe mostrar 27 columnas incluyendo:
- sesion_id
- payment_id_mp
- preference_id
- email_usuario
- etc.

---

## 🔐 PASO 8: Configurar .env en Servidor

Crear archivo `.env` en el directorio de la aplicación:

```bash
cd ~/public_html/taroti
nano .env
```

Contenido del `.env`:

```env
# --- MySQL Database ---
MYSQL_HOST=localhost
MYSQL_USER=u616221621
MYSQL_PASSWORD=Taroti2026!
MYSQL_DATABASE=u616221621_taroti
MYSQL_PORT=3306

# --- URLs ---
ORIGIN=https://taroti.mx
FRONTEND_URL=https://taroti.mx

# --- Mercado Pago PRODUCCIÓN ---
MP_ACCESS_TOKEN=TU_ACCESS_TOKEN_DE_PRODUCCION
MP_PUBLIC_KEY=TU_PUBLIC_KEY_DE_PRODUCCION

# --- OpenAI ---
OPENAI_API_KEY=TU_NUEVO_API_KEY_DE_OPENAI

# --- Node.js ---
NODE_ENV=production
PORT=3000
```

Guardar: `Ctrl+O`, Enter, `Ctrl+X`

---

## 🧪 PASO 9: Test de Conexión

Crear script de test `test-db.js`:

```bash
nano test-db.js
```

Contenido:

```javascript
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'u616221621',
      password: 'Taroti2026!',
      database: 'u616221621_taroti'
    });

    console.log('✅ Conexión exitosa a MySQL');

    const [rows] = await connection.execute('SHOW TABLES');
    console.log('📊 Tablas encontradas:', rows.length);
    rows.forEach(row => console.log('  -', Object.values(row)[0]));

    const [pagos] = await connection.execute('SELECT COUNT(*) as total FROM pagos');
    console.log('💳 Total de pagos:', pagos[0].total);

    await connection.end();
    console.log('✅ Test completado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testConnection();
```

Ejecutar test:

```bash
node test-db.js
```

Salida esperada:
```
✅ Conexión exitosa a MySQL
📊 Tablas encontradas: 5
  - audit_log
  - lecturas
  - pagos
  - sesiones
  - webhook_events_mp
💳 Total de pagos: 0
✅ Test completado exitosamente
```

---

## 📝 Resumen de Nombres en Hostinger

**IMPORTANTE**: En Hostinger, todos los nombres deben tener el prefijo de tu usuario:

| Concepto | Valor |
|----------|-------|
| Usuario SSH | `u616221621` |
| Usuario MySQL | `u616221621` |
| Password | `Taroti2026!` |
| Base de Datos | `u616221621_taroti` |
| Host MySQL | `localhost` |
| Puerto MySQL | `3306` |

---

## 🎯 Próximos Pasos

Después de crear la base de datos:

1. ✅ Subir código de la aplicación al servidor
2. ✅ Configurar `.env` con las credenciales correctas
3. ✅ Instalar dependencias: `npm ci --production`
4. ✅ Build de producción: `npm run build`
5. ✅ Iniciar con PM2: `pm2 start build/index.js --name taroti`

---

## 🆘 Troubleshooting

### Error: "Access denied for user"

**Solución**: Verificar que el password sea correcto y que el usuario tenga permisos en la base de datos.

```sql
-- Otorgar permisos si es necesario
GRANT ALL PRIVILEGES ON u616221621_taroti.* TO 'u616221621'@'localhost';
FLUSH PRIVILEGES;
```

### Error: "Database does not exist"

**Solución**: Crear la base de datos manualmente:

```sql
CREATE DATABASE u616221621_taroti CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Error: "Table already exists"

**Solución**: Eliminar tablas existentes antes de ejecutar schema:

```sql
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS webhook_events_mp;
DROP TABLE IF EXISTS lecturas;
DROP TABLE IF EXISTS sesiones;
DROP TABLE IF EXISTS pagos;
```

Luego volver a ejecutar el schema.

---

## ✅ Checklist Final

- [ ] Conexión SSH exitosa
- [ ] MySQL accesible
- [ ] Base de datos `u616221621_taroti` creada
- [ ] Schema SQL ejecutado sin errores
- [ ] 5 tablas verificadas (pagos, lecturas, sesiones, webhook_events_mp, audit_log)
- [ ] Tabla `pagos` tiene 27 columnas
- [ ] `.env` configurado con credenciales correctas
- [ ] Test de conexión exitoso

---

**Estado**: Listo para deployment de la aplicación
