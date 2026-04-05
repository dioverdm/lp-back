# 🚀 INICIO RÁPIDO - LIQUIDPOS 2.0

## ⚡ Instalación Express (5 minutos)

### 1️⃣ Configurar Base de Datos

```bash
# Ejecutar el SQL en tu MySQL
mysql -u root -p < database.sql
```

### 2️⃣ Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env.local

# Editar .env.local con tus datos
nano .env.local
```

**Mínimo requerido:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu-password
DB_NAME=liquidpos
JWT_SECRET=genera-un-secret-seguro
NEXTAUTH_SECRET=genera-otro-secret-seguro
NEXTAUTH_URL=http://localhost:3000
```

### 3️⃣ Instalar y Ejecutar

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## ✅ Verificación

1. Ve a `http://localhost:3000/api/health`
2. Debes ver: `{"status":"OK","database":"Connected"}`

---

## 📝 Primeros Pasos

### Crear tu primer usuario

1. Ve a `/register`
2. Completa el formulario
3. Automáticamente:
   - Se crea tu usuario
   - Se asigna plan gratuito
   - Se crea empresa por defecto

### Dashboard

1. Login en `/login`
2. Accede al dashboard
3. Explora las funciones

---

## 📂 Estructura del Proyecto

```
liquidpos-unified/
├── database.sql           # ✅ SQL completo (ejecutar primero)
├── pages/
│   ├── api/              # Backend (API Routes)
│   │   ├── auth/         # ✅ Autenticación
│   │   ├── companies/    # 🔨 CRUD empresas (pendiente)
│   │   ├── catalog/      # 🔨 Catálogo público (pendiente)
│   │   └── health.ts     # ✅ Health check
│   ├── index.tsx         # ✅ Página principal
│   └── _app.tsx          # ✅ App Next.js
├── lib/
│   ├── db.ts             # ✅ Conexión MySQL
│   ├── auth.ts           # ✅ Sistema JWT
│   └── permissions.ts    # ✅ Roles y permisos
├── types/
│   └── index.ts          # ✅ Tipos TypeScript
├── styles/
│   └── globals.css       # ✅ Estilos CSS
└── package.json          # ✅ Dependencias
```

**Leyenda:**
- ✅ Archivo completado y funcional
- 🔨 Archivo pendiente de implementación

---

## 🔨 Archivos Pendientes de Crear

El proyecto base está funcional pero necesitas completar:

### API Endpoints (pages/api/)

1. **Empresas**
   - `companies/index.ts` - Listar/crear empresas
   - `companies/[id]/index.ts` - Ver/editar/eliminar empresa
   - `companies/[id]/products/index.ts` - CRUD productos
   - `companies/[id]/invoices/index.ts` - Sistema facturación
   - `companies/[id]/customers/index.ts` - Gestión clientes
   - `companies/[id]/dashboard.ts` - Estadísticas

2. **Catálogo Público**
   - `catalog/[slug].ts` - Ver catálogo de empresa

### Frontend Pages (pages/)

1. **Autenticación**
   - `login.tsx` - Página de login
   - `register.tsx` - Página de registro

2. **Dashboard**
   - `dashboard/index.tsx` - Dashboard principal

3. **Gestión**
   - `inventory/index.tsx` - Gestión de inventario
   - `billing/index.tsx` - Sistema de facturación
   - `settings/index.tsx` - Configuración

4. **Catálogo**
   - `catalog/[slug].tsx` - Vista pública del catálogo

### Componentes (components/)

1. **Comunes**
   - `common/Layout.tsx` - Layout principal
   - `common/Sidebar.tsx` - Menu lateral
   - `common/Header.tsx` - Header con usuario
   - `common/CompanySelector.tsx` - Selector de empresas

2. **Dashboard**
   - `dashboard/StatsCard.tsx` - Tarjetas de estadísticas
   - `dashboard/SalesChart.tsx` - Gráfica de ventas
   - `dashboard/ActivityFeed.tsx` - Feed de actividad

3. **Inventario**
   - `inventory/ProductList.tsx` - Lista de productos
   - `inventory/ProductForm.tsx` - Formulario producto
   - `inventory/BarcodeScanner.tsx` - Escáner de códigos

4. **Facturación**
   - `billing/InvoiceForm.tsx` - Formulario factura
   - `billing/InvoiceList.tsx` - Lista de facturas
   - `billing/CustomerSelector.tsx` - Selector de clientes

---

## 💡 Guía de Implementación

### Ejemplo: Crear endpoint de empresas

```typescript
// pages/api/companies/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '../../../lib/auth';
import { query } from '../../../lib/db';
import { getUserCompanies } from '../../../lib/permissions';

export default authMiddleware(async (req, res) => {
  const { userId } = req.user;
  
  if (req.method === 'GET') {
    // Listar empresas del usuario
    const companies = await getUserCompanies(userId);
    return res.status(200).json({ success: true, data: companies });
  }
  
  if (req.method === 'POST') {
    // Crear nueva empresa
    const { name, slug } = req.body;
    // ... lógica de creación
  }
  
  res.status(405).json({ error: 'Method not allowed' });
});
```

---

## 🎯 Prioridades de Desarrollo

1. **ALTA PRIORIDAD**
   - ✅ Base de datos (HECHO)
   - ✅ Autenticación (HECHO)
   - 🔨 CRUD de empresas
   - 🔨 CRUD de productos
   - 🔨 Sistema de facturación

2. **MEDIA PRIORIDAD**
   - 🔨 Dashboard con estadísticas
   - 🔨 Catálogo público
   - 🔨 Gestión de clientes

3. **BAJA PRIORIDAD**
   - 🔨 Reportes avanzados
   - 🔨 Invitaciones de usuarios
   - 🔨 Sistema de roles granulares

---

## 📚 Recursos

- **SQL:** `database.sql` (ejecutar primero)
- **Documentación completa:** `README.md`
- **Registro de cambios:** `CHANGELOG.md`
- **Guía de deployment:** `DEPLOYMENT.md`

---

## 🆘 Solución de Problemas

### Error: Cannot connect to database

```bash
# Verifica que MySQL esté corriendo
sudo service mysql status

# Verifica credenciales en .env.local
```

### Error: Module not found

```bash
# Reinstala dependencias
rm -rf node_modules
npm install
```

### Puerto 3000 en uso

```bash
# Usa otro puerto
PORT=3001 npm run dev
```

---

## ✨ Características Implementadas

- ✅ Base de datos completa (18 tablas)
- ✅ Sistema de autenticación JWT
- ✅ Roles y permisos
- ✅ Pool de conexiones MySQL
- ✅ Middleware de autenticación
- ✅ Tipos TypeScript completos
- ✅ Health check endpoint

---

## 🚀 Deployment

Ver `DEPLOYMENT.md` para instrucciones completas de deployment en:
- Vercel + PlanetScale
- Railway
- VPS propio

---

**¿Necesitas ayuda?** Revisa el `README.md` completo o el `CHANGELOG.md` para más detalles.
