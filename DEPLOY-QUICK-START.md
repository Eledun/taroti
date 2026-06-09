# 🚀 Deploy Rápido a Hostinger

## Configuración Única (Solo la Primera Vez)

### 1. Crear archivo .env.production

```bash
cp .env.production.example .env.production
```

Edita `.env.production` y completa con las credenciales reales.

### 2. Configurar SSH (Opcional pero Recomendado)

Agrega a tu `~/.ssh/config`:

```
Host hostinger-taroti
    HostName 185.173.111.183
    Port 65002
    User u616221621
```

---

## Deploy Automático (Recomendado)

### Opción 1: Build + Deploy en un Solo Comando

```bash
npm run deploy:build
```

### Opción 2: Solo Deploy (si ya hiciste build)

```bash
npm run deploy:hostinger
```

### Opción 3: Manual Paso a Paso

```bash
# 1. Build
npm run build

# 2. Deploy
./deploy-hostinger.sh
```

---

## Deploy Manual (Sin Script)

### 1. Build Local

```bash
npm run build
```

### 2. Conectar por SSH

```bash
ssh -p 65002 u616221621@185.173.111.183
```

### 3. Subir Archivos

```bash
# En tu máquina local
scp -P 65002 -r ./build u616221621@185.173.111.183:~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/
scp -P 65002 ./package.json u616221621@185.173.111.183:~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/
scp -P 65002 ./start-server.js u616221621@185.173.111.183:~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/
```

### 4. Instalar Dependencias y Reiniciar

```bash
# En SSH
cd ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs
export PATH=/opt/alt/alt-nodejs22/root/bin:$PATH
npm install --production
touch tmp/restart.txt
```

---

## Verificación

```bash
curl -I https://dimgrey-louse-600796.hostingersite.com
```

Debería responder `HTTP/2 200`.

---

## Ver Logs

```bash
# Console logs
ssh -p 65002 u616221621@185.173.111.183 'cat ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/console.log'

# Error logs
ssh -p 65002 u616221621@185.173.111.183 'cat ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/stderr.log'
```

---

## Troubleshooting

### Error 503

```bash
# Ver logs de error
ssh -p 65002 u616221621@185.173.111.183 'cat ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/stderr.log'

# Reiniciar manualmente
ssh -p 65002 u616221621@185.173.111.183 'touch ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/tmp/restart.txt'
```

### Reinstalar Dependencias

```bash
ssh -p 65002 u616221621@185.173.111.183 << 'EOF'
cd ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs
export PATH=/opt/alt/alt-nodejs22/root/bin:$PATH
rm -rf node_modules package-lock.json
npm install --production
touch tmp/restart.txt
EOF
```

---

## 📚 Documentación Completa

Ver [docs/DEPLOY-HOSTINGER.md](docs/DEPLOY-HOSTINGER.md) para la guía completa.

---

**URL del Sitio:** https://dimgrey-louse-600796.hostingersite.com
