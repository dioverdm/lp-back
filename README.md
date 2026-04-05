# ⚡ LiquidPOS v2.0

Sistema completo de gestión de inventario, facturación y catálogo público para pequeñas, medianas y grandes empresas.

---

## 🗂 Estructura del proyecto

```
liquidpos-v2/
├── backend/          → API Node.js + Express (JWT)
├── frontend/         → React + Vite (JavaScript)
└── liquidpos_v2.sql  → Base de datos MySQL completa
```

---

## 🚀 Instalación rápida

### 1. Base de datos

1. Abre **phpMyAdmin** → pestaña **SQL**
2. Crea la base de datos: `CREATE DATABASE liquidpos CHARACTER SET utf8mb4;`
3. Selecciónala y ejecuta el contenido de `liquidpos_v2.sql`

---

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edita .env con tus credenciales de MySQL y JWT_SECRET
npm install
npm start         # Producción
npm run dev       # Desarrollo con hot-reload
```

El servidor corre en `http://localhost:3001`

**Variables `.env` requeridas:**
| Variable | Descripción |
|---|---|
| `DB_HOST` | Host MySQL (ej: localhost) |
| `DB_PORT` | Puerto MySQL (default: 3306) |
| `DB_USER` | Usuario MySQL |
| `DB_PASSWORD` | Contraseña MySQL |
| `DB_NAME` | Nombre de la BD (liquidpos) |
| `JWT_SECRET` | Secreto seguro para JWT — cámbialo |
| `ALLOWED_ORIGINS` | URL del frontend, separadas por coma |

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev       # Desarrollo → http://localhost:5173
npm run build     # Build de producción → dist/
```

**Variable opcional `.env`:**
```
VITE_API_URL=https://tu-backend.vercel.app/api
```
Si no se define, usa el proxy de Vite (`/api` → `localhost:3001`).

---

## ☁️ Despliegue en Vercel

### Backend
1. Sube la carpeta `backend/` a un repositorio
2. Conecta en Vercel → Framework: **Other**
3. Agrega todas las variables de entorno
4. El archivo `vercel.json` ya está configurado

### Frontend
1. Sube la carpeta `frontend/` a un repositorio
2. Conecta en Vercel → Framework: **Vite**
3. Agrega `VITE_API_URL=https://tu-backend.vercel.app/api`
4. El archivo `vercel.json` maneja el routing SPA

---

## ✨ Funcionalidades

| Módulo | Descripción |
|---|---|
| 🔐 Auth | Registro, login con JWT. Token en localStorage |
| 🏢 Multi-empresa | Crea múltiples empresas, alterna entre ellas |
| 👥 Roles | owner · admin · moderator · atc · viewer con permisos automáticos |
| 📦 Productos | CRUD completo con código de barras, precio, costo, imagen |
| 🏷 Categorías | Gestión con colores personalizados |
| 🏭 Bodegas | Múltiples ubicaciones de inventario |
| 📊 Inventario | Vista grid/tabla, escaneo de código, ajuste de stock |
| 🧾 Facturación POS | Carrito interactivo, búsqueda de cliente, método de pago |
| 📄 Facturas | Lista, detalle, cambio de estado, impresión |
| 👤 Clientes | CRM básico con datos fiscales |
| 💸 Descuentos | Porcentaje o monto fijo, con código promocional |
| 📈 Reportes | Ventas diarias, por categoría, KPIs |
| 🌐 Catálogo público | Ruta `/@slug` accesible sin login |
| 🔔 Notificaciones | Alertas de stock bajo y agotado |
| 👑 Planes | free · starter · pro · enterprise con límites reales |

---

## 🔑 Credenciales de demo

```
Email:    demo@liquidpos.app
Password: demo123
```

---

## 📡 Endpoints API principales

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile

GET    /api/businesses
POST   /api/businesses
GET    /api/businesses/:id/members
POST   /api/businesses/:id/members

GET    /api/products?search=&category=&lowStock=
GET    /api/products/barcode/:code
POST   /api/products
PUT    /api/products/:id
PATCH  /api/products/:id/stock
DELETE /api/products/:id

GET    /api/invoices
POST   /api/invoices
PATCH  /api/invoices/:id/status

GET    /api/stats/dashboard
GET    /api/stats/reports?from=&to=

GET    /api/warehouses
GET    /api/categories
GET    /api/discounts
GET    /api/customers
GET    /api/notifications
GET    /api/catalog/:slug      ← Público, sin auth
```

Todos los endpoints protegidos requieren:
- Header `Authorization: Bearer <token>`
- Header `X-Business-Id: <businessId>`

---

## 🗄 Tablas de la base de datos

| Tabla | Descripción |
|---|---|
| `users` | Cuentas de usuario con plan |
| `businesses` | Empresas con slug público |
| `business_members` | Miembros con rol y permisos |
| `products` | Productos con código de barras |
| `categories` | Categorías por empresa |
| `warehouses` | Bodegas / ubicaciones |
| `discounts` | Descuentos configurables |
| `customers` | Clientes con datos fiscales |
| `invoices` | Facturas completas |
| `invoice_items` | Líneas de cada factura |
| `transactions` | Movimientos de inventario |
| `invoice_sequences` | Numeración automática de facturas |
| `plan_limits` | Límites por plan |

---

## 🆚 Cambios respecto a v1

| Antes (v1) | Ahora (v2) |
|---|---|
| Solo mobile (max 480px) | **Totalmente responsive** (mobile / tablet / desktop) |
| Sesiones en memoria | **JWT stateless** — compatible con Vercel serverless |
| Un solo usuario/negocio | **Multi-empresa** con cambio de contexto |
| Sin precios reales | **Precio + costo por producto** |
| Sin facturación | **POS completo** con carrito y recibo |
| Sin roles | **5 roles** con permisos granulares RBAC |
| Sin catálogo | **Catálogo público** en `/@slug` |
| Sin descuentos reales | **Descuentos** por producto o globales en factura |
| Stats hardcoded ($15) | **Valores reales** de precio y costo |
| Sin clientes | **CRM de clientes** con datos fiscales |
| Sin bodegas múltiples | **Bodegas** gestionables por empresa |
| Sin planes reales | **Sistema premium** con límites reales |
