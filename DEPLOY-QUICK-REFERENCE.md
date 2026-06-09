# 🚀 Deploy Quick Reference

## Comando de Deploy (Default)

```bash
npm run build && ./deploy-with-password.sh
```

---

## Credenciales SSH

```
Host: 185.173.111.183:65002
User: u616221621
Pass: Taroti2026!
Path: /home/u616221621/domains/dimgrey-louse-600796.hostingersite.com/nodejs
```

---

## URLs

- **Producción:** https://dimgrey-louse-600796.hostingersite.com
- **Panel Hostinger:** https://hpanel.hostinger.com

---

## Verificar Deploy

```bash
curl -I https://dimgrey-louse-600796.hostingersite.com
# Debe responder: HTTP/2 200
```

---

## Ver Logs

```bash
cat > /tmp/logs.exp << 'EOF'
#!/usr/bin/expect -f
spawn ssh -p 65002 u616221621@185.173.111.183 "tail -50 ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/stderr.log"
expect "password:" { send "Taroti2026!\r"; expect eof }
EOF
chmod +x /tmp/logs.exp && /tmp/logs.exp
```

---

## Reiniciar Passenger

```bash
cat > /tmp/restart.exp << 'EOF'
#!/usr/bin/expect -f
spawn ssh -p 65002 u616221621@185.173.111.183 "touch ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/tmp/restart.txt"
expect "password:" { send "Taroti2026!\r"; expect eof }
EOF
chmod +x /tmp/restart.exp && /tmp/restart.exp
```

---

## Documentación Completa

📖 [docs/SSH-DEPLOY-METHOD.md](./docs/SSH-DEPLOY-METHOD.md)
