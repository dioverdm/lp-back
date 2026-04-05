# ⚡ GUÍA RÁPIDA DE DEPLOYMENT

## 🎯 Configuración Recomendada para Producción

### 📊 Stack Recomendado

```
Frontend + Backend: Vercel (Next.js unificado)
Base de Datos: PlanetScale / Railway / Aiven (MySQL remoto)
Almacenamiento: Cloudinary / Vercel Blob (imágenes)
Email: SendGrid / Resend (invitaciones)
```

---

## 🚀 OPCIÓN 1: Deployment Rápido en Vercel + PlanetScale

### Paso 1: Crear Base de Datos en PlanetScale

```bash
# 1. Regístrate en https://planetscale.com (gratis)
# 2. Crea una nueva base de datos "liquidpos"
# 3. Obtén las credenciales de conexión
# 4. Ejecuta el SQL:

# Desde la consola web de PlanetScale o usando CLI:
pscale shell liquidpos main < database.sql
```

**Credenciales que obtendrás:**
```
Host: xxx.us-east-2.psdb.cloud
Username: xxxxxxxx
Password: pscale_pw_xxxxxxxx
```

### Paso 2: Deployment en Vercel

```bash
# 1. Instala Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Configura las variables de entorno cuando te lo pida
```

**Variables de Entorno para Vercel:**

```env
# Database (PlanetScale)
DB_HOST=xxx.us-east-2.psdb.cloud
DB_PORT=3306
DB_USER=tu-usuario
DB_PASSWORD=pscale_pw_xxxxxxxx
DB_NAME=liquidpos
DB_SSL=true

# Auth
JWT_SECRET=genera-con-crypto-randomBytes
NEXTAUTH_SECRET=genera-con-crypto-randomBytes
NEXTAUTH_URL=https://tu-app.vercel.app

# App
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

### Paso 3: Generar Secrets Seguros

```bash
# En tu terminal local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ejecuta esto dos veces y usa los resultados para:
# - JWT_SECRET
# - NEXTAUTH_SECRET
```

---

## 🚀 OPCIÓN 2: Deployment en Railway (Todo en uno)

Railway te permite tener Base de Datos y App en un solo lugar.

### Paso 1: Crear Cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Regístrate con GitHub
3. Crea un nuevo proyecto

### Paso 2: Agregar MySQL

```bash
# Desde Railway Dashboard:
1. Clic en "New" > "Database" > "Add MySQL"
2. Espera a que se provisione
3. Copia las credenciales
```

### Paso 3: Ejecutar SQL

```bash
# Descarga MySQL Workbench o usa CLI
mysql -h containers-us-west-xxx.railway.app \
      -u root \
      -p \
      -P xxxx \
      railway < database.sql
```

### Paso 4: Deploy de la App

```bash
# En Railway:
1. New > "GitHub Repo"
2. Conecta tu repositorio
3. Railway detectará Next.js automáticamente
4. Agrega las variables de entorno
5. Deploy
```

---

## 🚀 OPCIÓN 3: VPS Propio (Para Mayor Control)

Si tienes un VPS (DigitalOcean, Linode, etc.):

### Instalación en Ubuntu 22.04

```bash
# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Instalar MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# 4. Crear base de datos
sudo mysql -u root -p
CREATE DATABASE liquidpos;
CREATE USER 'liquidpos'@'localhost' IDENTIFIED BY 'password-seguro';
GRANT ALL PRIVILEGES ON liquidpos.* TO 'liquidpos'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 5. Importar SQL
mysql -u liquidpos -p liquidpos < database.sql

# 6. Instalar PM2 (process manager)
sudo npm install -g pm2

# 7. Clonar proyecto y configurar
git clone https://github.com/tu-usuario/liquidpos-unified.git
cd liquidpos-unified
npm install

# 8. Configurar .env.local
nano .env.local
# (pegar las variables de entorno)

# 9. Build
npm run build

# 10. Iniciar con PM2
pm2 start npm --name "liquidpos" -- start
pm2 save
pm2 startup

# 11. Instalar Nginx como reverse proxy
sudo apt install -y nginx

# 12. Configurar Nginx
sudo nano /etc/nginx/sites-available/liquidpos

# Contenido:
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 13. Activar sitio
sudo ln -s /etc/nginx/sites-available/liquidpos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 14. Instalar SSL con Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

---

## 📝 Configuración de Variables de Entorno

### Template Completo

```env
# ============================================
# DATABASE
# ============================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=liquidpos
DB_SSL=false

# ============================================
# AUTHENTICATION
# ============================================
JWT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# ============================================
# APPLICATION
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NODE_ENV=production

# ============================================
# EMAIL (Opcional - para invitaciones)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@liquidpos.com

# ============================================
# FILE STORAGE (Opcional - para imágenes)
# ============================================
# Opción 1: Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Opción 2: AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_BUCKET_NAME=

# Opción 3: Vercel Blob
BLOB_READ_WRITE_TOKEN=

# ============================================
# MONITORING (Opcional)
# ============================================
SENTRY_DSN=
LOGTAIL_TOKEN=

# ============================================
# PAYMENTS (Futuro)
# ============================================
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## 🔧 Troubleshooting de Deployment

### Error: "ER_NOT_SUPPORTED_AUTH_MODE"

**Causa:** MySQL 8 usa caching_sha2_password por defecto, algunos clientes no lo soportan.

**Solución:**
```sql
ALTER USER 'tu-usuario'@'%' IDENTIFIED WITH mysql_native_password BY 'tu-password';
FLUSH PRIVILEGES;
```

### Error: "Too many connections"

**Causa:** Pool de conexiones mal configurado.

**Solución:**
```javascript
// En lib/db.ts
const pool = mysql.createPool({
  connectionLimit: 10, // Reducir si es necesario
  queueLimit: 0,
  waitForConnections: true
});
```

### Error: "ETIMEDOUT" en Vercel

**Causa:** Timeout de 10s en Vercel Hobby plan.

**Solución:**
1. Optimizar queries lentos
2. Agregar índices a la BD
3. Usar caché (Redis/Upstash)
4. Upgrade a Vercel Pro

### Errores de CORS

**Solución:**
```javascript
// En next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: process.env.NEXT_PUBLIC_APP_URL },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ]
      }
    ]
  }
}
```

---

## 📊 Monitoreo y Logs

### Configurar Vercel Analytics

```bash
# 1. Instalar
npm install @vercel/analytics

# 2. Agregar en _app.tsx
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

### Logs en Producción

```bash
# Ver logs en Vercel
vercel logs

# Ver logs en Railway
railway logs

# Ver logs en VPS
pm2 logs liquidpos
```

---

## 🔐 Backup de Base de Datos

### Backup Automático

```bash
# Crear script de backup
nano /home/tu-usuario/backup-db.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u liquidpos -p'password' liquidpos > /backups/liquidpos_$DATE.sql
find /backups -name "liquidpos_*.sql" -mtime +7 -delete

# Dar permisos
chmod +x /home/tu-usuario/backup-db.sh

# Agregar a crontab (diario a las 3am)
crontab -e
0 3 * * * /home/tu-usuario/backup-db.sh
```

### Backup Manual

```bash
# Local
mysqldump -u root -p liquidpos > backup_$(date +%Y%m%d).sql

# Remoto (PlanetScale)
pscale database dump liquidpos main --output backup.sql

# Railway
railway run mysqldump liquidpos > backup.sql
```

---

## ✅ Checklist de Deployment

### Pre-deployment
- [ ] SQL ejecutado en base de datos
- [ ] Variables de entorno configuradas
- [ ] Secrets generados (JWT, NextAuth)
- [ ] Dependencias instaladas
- [ ] Build exitoso localmente
- [ ] Tests pasando (si existen)

### Post-deployment
- [ ] Health check responde: `/api/health`
- [ ] Login funciona correctamente
- [ ] Crear empresa funciona
- [ ] Agregar producto funciona
- [ ] Crear factura funciona
- [ ] Catálogo público accesible
- [ ] Emails se envían (si configurado)
- [ ] Imágenes se suben (si configurado)

### Monitoring
- [ ] Configurar alertas de errores (Sentry)
- [ ] Configurar backup automático
- [ ] Configurar SSL/HTTPS
- [ ] Configurar dominio personalizado
- [ ] Configurar analytics

---

## 🎯 Recomendaciones de Producción

### Performance

1. **Habilitar caché de API**
```javascript
// En endpoints de Next.js
export const config = {
  unstable_cache: {
    revalidate: 60 // 60 segundos
  }
};
```

2. **Comprimir respuestas**
```javascript
// En next.config.js
module.exports = {
  compress: true
};
```

3. **Optimizar imágenes**
```javascript
// Usar Next.js Image
import Image from 'next/image';

<Image 
  src="/product.jpg"
  width={500}
  height={500}
  alt="Producto"
  loading="lazy"
/>
```

### Seguridad

1. **Rate Limiting**
```bash
# Usar Vercel Pro Firewall
# O implementar con Upstash Redis
```

2. **Headers de Seguridad**
```javascript
// En next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  },
}
```

3. **Validación de Input**
```typescript
// Siempre usar Zod en backend
import { z } from 'zod';

const ProductSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(100),
  price: z.number().positive(),
  quantity: z.number().int().min(0)
});
```

---

## 📞 Soporte de Deployment

Si tienes problemas:

1. Revisa los logs: `vercel logs` o `railway logs`
2. Verifica las variables de entorno
3. Prueba la conexión a BD desde local
4. Revisa el archivo CHANGELOG.md
5. Contacta: support@liquidpos.com

---

**¡Listo para producción!** 🚀
