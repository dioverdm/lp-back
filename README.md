# LiquidPOS 🟢
**Sistema POS SaaS multiempresa — Stack: React + Node.js + MySQL**

---

## 🚀 Setup rápido (desarrollo)

### 1. Base de datos MySQL
```bash
mysql -u root -p < backend/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edita .env con tus credenciales de DB
npm install
npm run dev
# → http://localhost:3001
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 🔑 Credenciales demo
| Campo | Valor |
|-------|-------|
| Email | admin@demo.com |
| Password | Admin123! |
| Empresa | Demo Store |

---

## 🐳 Docker (producción)
```bash
# Copiar y editar variables
cp backend/.env.example backend/.env

# Build frontend
cd frontend && npm install && npm run build && cd ..

# Levantar todo
docker-compose up -d
```

---

## 📁 Estructura
```
liquidpos/
├── backend/
│   ├── src/
│   │   ├── app.js              # Entry point Express + Socket.io
│   │   ├── config/db.js        # Pool MySQL
│   │   ├── middlewares/auth.js # JWT + tenant + RBAC
│   │   └── modules/
│   │       ├── auth/           # Login, register, companies
│   │       ├── catalog/        # Productos, categorías
│   │       ├── pos/            # Pedidos, pagos, caja
│   │       ├── inventory/      # Stock, movimientos
│   │       ├── stats/          # Dashboard, reportes
│   │       ├── users/          # Miembros, invitaciones
│   │       ├── ai/             # Predicción, sugerencias
│   │       └── public/         # Vitrina pública
│   └── schema.sql              # Schema completo + seed
│
└── frontend/
    └── src/
        ├── context/AppContext.jsx  # Auth, Theme, Toast, Cart
        ├── layouts/                # AppLayout (sidebar), POSLayout
        └── pages/
            ├── auth/               # Login, Register, Onboard
            ├── dashboard/          # Stats + gráficos
            ├── pos/                # POS completo con carrito
            ├── catalog/            # CRUD productos
            ├── inventory/          # Stock + movimientos
            ├── orders/             # Historial de pedidos
            ├── settings/           # Team + Settings
            └── public/             # Vitrina @empresa
```

---

## 🔗 Rutas principales
| URL | Descripción |
|-----|-------------|
| `/login` | Inicio de sesión |
| `/register` | Registro |
| `/onboard` | Crear empresa |
| `/dashboard` | Panel principal |
| `/pos` | Punto de venta (pantalla completa) |
| `/catalog` | Gestión de productos |
| `/inventory` | Control de stock |
| `/orders` | Historial de pedidos |
| `/team` | Gestión de equipo |
| `/settings` | Configuración |
| `/@:slug` | Vitrina pública de la empresa |

---

## 🛒 Funcionalidades
- ✅ Autenticación JWT + refresh tokens
- ✅ Multiempresa (shared DB con company_id)
- ✅ RBAC: owner / manager / cashier / waiter / warehouse / accountant
- ✅ Invitaciones por email con token
- ✅ Catálogo de productos con categorías
- ✅ POS con carrito, búsqueda en tiempo real
- ✅ Lector de código de barras USB (laser)
- ✅ Múltiples métodos de pago
- ✅ Control de inventario con movimientos trazables
- ✅ Alertas de stock bajo en tiempo real (WebSocket)
- ✅ Dashboard con gráficos interactivos (Recharts)
- ✅ IA: predicción de demanda, precio sugerido, basket analysis
- ✅ Vitrina pública @empresa con integración WhatsApp
- ✅ Modo claro / oscuro
- ✅ Diseño responsive (mobile first)

---

## 🌐 Variables de entorno (.env)
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
JWT_SECRET=tu-secret-aqui
DB_HOST=localhost
DB_NAME=liquidpos
DB_USER=root
DB_PASS=
```

---

*LiquidPOS © 2026 — Arquitectura SaaS POS multiinquilino*
