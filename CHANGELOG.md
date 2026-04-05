# 📊 LIQUIDPOS 2.0 - REGISTRO COMPLETO DE CAMBIOS Y MEJORAS

## 🎯 RESUMEN EJECUTIVO

Se ha transformado completamente el sistema LiquidPOS de un gestor de inventario básico a una **plataforma empresarial completa multi-empresa** con facturación, catálogo público, sistema de permisos y arquitectura escalable.

---

## 📋 ÍNDICE DE CAMBIOS

### 1. ARQUITECTURA Y ESTRUCTURA

#### ✅ Antes
- Backend y Frontend separados
- Sesiones en memoria (no persistentes)
- Un usuario = una ubicación
- Sin sistema de roles
- Sin multi-empresa

#### ✨ AHORA
- **Sistema unificado Next.js 14** (API Routes + Frontend)
- **Arquitectura multi-empresa** completa
- **Sistema de roles y permisos** granular (7 roles predefinidos)
- **Suscripciones/Planes Premium** (Free, Básico, Pro, Enterprise)
- **JWT + NextAuth** para autenticación robusta
- **Base de datos normalizada** con 18 tablas + vistas + triggers
- **Deployment unificado en Vercel**

---

### 2. SISTEMA DE EMPRESAS (MULTITENANCY)

#### 🏢 Características Nuevas

**Gestión Multi-Empresa:**
- ✅ Un usuario puede crear múltiples empresas (según plan)
- ✅ Slug único por empresa para URLs: `/@empresa-slug`
- ✅ Alternar entre empresas con selector visual
- ✅ Cada empresa tiene configuración independiente:
  - Logo, datos fiscales, dirección
  - Moneda y zona horaria
  - Configuración de catálogo público
  - Impresoras fiscales

**Perfiles de Empresa:**
```typescript
interface Company {
  id: number;
  slug: string; // URL amigable
  name: string;
  legal_name: string;
  tax_id: string;
  logo_url: string;
  catalog_enabled: boolean;
  catalog_public: boolean;
  // ... 15+ campos más
}
```

---

### 3. SISTEMA DE ROLES Y PERMISOS

#### 👥 Roles Implementados

| Rol | Slug | Permisos Principales |
|-----|------|---------------------|
| **Propietario** | `owner` | Control total sobre la empresa |
| **Administrador** | `admin` | Gestión completa excepto eliminación |
| **Gerente** | `manager` | Inventario, reportes, productos |
| **Vendedor** | `seller` | Facturación + consulta inventario |
| **Atención al Cliente** | `support` | Solo facturación |
| **Contador** | `accountant` | Facturación y reportes (solo lectura) |
| **Bodeguero** | `warehouse` | Solo gestión de inventario |

#### 🔐 Sistema de Permisos

```typescript
interface Permission {
  products: ["create", "read", "update", "delete"];
  inventory: ["create", "read", "update", "delete"];
  billing: ["create", "read", "update", "delete"];
  reports: ["read"];
  users: ["create", "read", "update", "delete"];
  settings: ["read", "update"];
}
```

**Invitaciones de Usuarios:**
- ✅ Invitar usuarios por email
- ✅ Asignar roles específicos
- ✅ Estados: invited, active, suspended
- ✅ Control de última actividad

---

### 4. SISTEMA DE FACTURACIÓN COMPLETO

#### 💰 Características de Facturación

**Tipos de Documentos:**
- ✅ Facturas de venta
- ✅ Cotizaciones
- ✅ Órdenes de compra

**Estados de Factura:**
- `draft` - Borrador
- `pending` - Pendiente de pago
- `paid` - Pagada completamente
- `partial` - Pago parcial
- `canceled` - Cancelada
- `refunded` - Reembolsada

**Métodos de Pago:**
- ✅ Efectivo
- ✅ Tarjeta
- ✅ Transferencia
- ✅ Crédito
- ✅ Otros

**Funcionalidades Avanzadas:**
- ✅ Sistema de descuentos (porcentaje o fijo)
- ✅ Cálculo automático de impuestos
- ✅ Gestión de clientes
- ✅ Pagos parciales
- ✅ Cálculo de vuelto
- ✅ Numeración automática de facturas
- ✅ Integración con inventario en tiempo real

#### 🖨️ Impresión Fiscal

**Configuración de Impresoras:**
```typescript
interface PrinterSettings {
  name: string;
  printer_type: 'thermal' | 'fiscal' | 'standard';
  connection_type: 'usb' | 'network' | 'bluetooth';
  ip_address?: string;
  port?: number;
  paper_width: number; // 58mm, 80mm
  settings: {
    auto_cut: boolean;
    beep: boolean;
    logo: boolean;
  };
}
```

**Soporte para:**
- ✅ Impresoras térmicas (58mm, 80mm)
- ✅ Impresoras fiscales
- ✅ Conexión USB, Red, Bluetooth
- ✅ Comandos ESC/POS
- ✅ Logo de empresa en tickets

---

### 5. CATÁLOGO PÚBLICO EN TIEMPO REAL

#### 🌐 Sistema de Catálogo

**URLs Públicas:**
- `/@empresa-slug` - Catálogo completo
- `/@empresa-slug/categoria/nombre` - Por categoría
- `/@empresa-slug/producto/sku` - Detalle de producto

**Características:**
- ✅ Actualización en tiempo real (SWR)
- ✅ Precios con descuentos activos
- ✅ Imágenes de productos
- ✅ Búsqueda y filtros
- ✅ Categorización
- ✅ Responsivo (mobile-first)
- ✅ SEO optimizado
- ✅ Control de visibilidad por producto
- ✅ Activar/desactivar catálogo completo

**Configuración:**
```typescript
company.catalog_enabled = true; // Habilitar catálogo
company.catalog_public = true; // Hacer público
product.show_in_catalog = true; // Mostrar producto
```

---

### 6. SISTEMA DE PLANES Y LIMITACIONES

#### 💳 Planes de Suscripción

| Característica | Free | Básico | Pro | Enterprise |
|----------------|------|--------|-----|-----------|
| **Precio/mes** | $0 | $9.99 | $24.99 | $99.99 |
| **Empresas** | 1 | 2 | 5 | Ilimitadas |
| **Productos** | 50 | 500 | 5,000 | Ilimitados |
| **Usuarios/empresa** | 1 | 3 | 10 | 100 |
| **Facturas/mes** | 20 | 100 | 500 | Ilimitadas |
| **Catálogo público** | ❌ | ✅ | ✅ | ✅ |
| **Multi-ubicación** | ❌ | ✅ | ✅ | ✅ |
| **Reportes avanzados** | ❌ | ✅ | ✅ | ✅ |
| **Descuentos** | ❌ | ✅ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ | ✅ |
| **Soporte prioritario** | ❌ | ❌ | ❌ | ✅ |
| **Marca personalizada** | ❌ | ❌ | ❌ | ✅ |

**Control de Límites:**
- ✅ Validación en backend antes de crear recursos
- ✅ UI muestra límites y uso actual
- ✅ Mensajes claros cuando se alcanza un límite
- ✅ Sugerencias de upgrade

---

### 7. GESTIÓN DE PRODUCTOS MEJORADA

#### 📦 Características Nuevas

**Campos Ampliados:**
- ✅ **Código de barras** escaneable (EAN-13, UPC, QR)
- ✅ **Precio de costo** y precio de venta
- ✅ **Stock mínimo y máximo**
- ✅ **Unidad de medida** personalizable
- ✅ **Peso y dimensiones**
- ✅ **Tasa de impuesto** por producto
- ✅ **Sistema de descuentos** (activo/inactivo)
- ✅ **Imágenes de productos** (URL o upload)
- ✅ **Categorización jerárquica**
- ✅ **Multi-ubicación** (bodegas, sucursales)

**Gestión de Stock:**
```typescript
enum TransactionType {
  IN = 'Entrada',
  OUT = 'Salida',
  ADJUSTMENT = 'Ajuste',
  TRANSFER = 'Transferencia',
  RETURN = 'Devolución',
  DAMAGED = 'Dañado'
}
```

**Registro de Transacciones:**
- ✅ Historial completo por producto
- ✅ Cantidad antes/después
- ✅ Usuario responsable
- ✅ Notas y referencias
- ✅ Relación con facturas

---

### 8. DASHBOARD Y ESTADÍSTICAS

#### 📊 Métricas Principales

**KPIs en Tiempo Real:**
- ✅ Total de productos en inventario
- ✅ Valor total del inventario (costo y venta)
- ✅ Productos con bajo stock
- ✅ Productos agotados
- ✅ Ventas del día/semana/mes
- ✅ Ingresos totales
- ✅ Facturas pendientes
- ✅ Top 10 productos más vendidos

**Gráficas y Visualizaciones:**
- ✅ Ventas diarias (últimos 30 días)
- ✅ Entradas vs Salidas
- ✅ Distribución por categorías
- ✅ Métodos de pago más usados
- ✅ Rendimiento por ubicación

**Actividad Reciente:**
- ✅ Últimas 10 transacciones
- ✅ Últimas facturas creadas
- ✅ Alertas de stock bajo
- ✅ Cambios en productos

---

### 9. SISTEMA DE CLIENTES

#### 👤 Gestión de Clientes

**Tipos de Cliente:**
- Individual (persona natural)
- Empresa (persona jurídica)

**Información Capturada:**
- ✅ Nombre completo / Razón social
- ✅ Email y teléfono
- ✅ NIT / Documento de identidad
- ✅ Dirección completa
- ✅ Límite de crédito
- ✅ Notas internas
- ✅ Historial de compras

**Características:**
- ✅ Búsqueda rápida en facturación
- ✅ Autocompletado
- ✅ Estadísticas por cliente
- ✅ Estado activo/inactivo

---

### 10. REPORTES AVANZADOS

#### 📈 Tipos de Reportes

**Reportes de Inventario:**
- ✅ Valorización de inventario
- ✅ Movimientos por período
- ✅ Productos sin movimiento
- ✅ Rotación de inventario
- ✅ Mermas y ajustes

**Reportes de Ventas:**
- ✅ Ventas por período
- ✅ Ventas por categoría
- ✅ Ventas por producto
- ✅ Ventas por vendedor
- ✅ Ventas por método de pago

**Reportes Financieros:**
- ✅ Flujo de caja
- ✅ Cuentas por cobrar
- ✅ Utilidad bruta
- ✅ Margen de ganancia

**Exportación:**
- ✅ PDF con gráficas
- ✅ Excel (.xlsx)
- ✅ CSV
- ✅ Filtros por fecha

---

### 11. UI/UX RESPONSIVO

#### 📱 Diseño Adaptativo

**Breakpoints:**
```css
mobile: 320px - 640px
tablet: 641px - 1024px
desktop: 1025px+
```

**Características Mobile:**
- ✅ Bottom navigation bar
- ✅ Gestos de deslizamiento
- ✅ Menús tipo drawer
- ✅ Botones grandes para touch
- ✅ Escáner de código de barras (cámara)

**Características Desktop:**
- ✅ Sidebar navigation
- ✅ Multi-columna
- ✅ Atajos de teclado
- ✅ Tablas expandidas
- ✅ Modales amplios

**Mejoras Visuales:**
- ✅ Diseño moderno 2026 (glassmorphism)
- ✅ Modo oscuro/claro
- ✅ Animaciones fluidas
- ✅ Feedback visual inmediato
- ✅ Loading states
- ✅ Estados vacíos informativos

---

### 12. SEGURIDAD Y PERFORMANCE

#### 🔒 Seguridad

**Autenticación:**
- ✅ JWT tokens con refresh
- ✅ NextAuth para OAuth (Google, etc.)
- ✅ Bcrypt para passwords (10 rounds)
- ✅ Rate limiting por IP
- ✅ CSRF protection

**Autorización:**
- ✅ Middleware de permisos
- ✅ Validación en cada endpoint
- ✅ Validación de propiedad de recursos
- ✅ Logs de auditoría completos

**Validación:**
- ✅ Zod schemas en backend
- ✅ React Hook Form en frontend
- ✅ Sanitización de inputs
- ✅ Protección XSS

**Base de Datos:**
- ✅ Prepared statements (SQL injection)
- ✅ Transacciones para operaciones críticas
- ✅ Índices optimizados
- ✅ Foreign keys con CASCADE

#### ⚡ Performance

**Backend:**
- ✅ Connection pooling (MySQL2)
- ✅ Caché de queries frecuentes
- ✅ Paginación en listados
- ✅ Lazy loading de relaciones

**Frontend:**
- ✅ SWR para caché y revalidación
- ✅ Code splitting por ruta
- ✅ Image optimization (Next.js)
- ✅ Debounce en búsquedas
- ✅ Virtual scrolling en listas grandes

---

### 13. SCANNER DE CÓDIGO DE BARRAS

#### 📷 Funcionalidades

**Tipos Soportados:**
- ✅ EAN-13 / EAN-8
- ✅ UPC-A / UPC-E
- ✅ Code 128
- ✅ QR Code
- ✅ Code 39

**Características:**
- ✅ Escaneo con cámara (mobile/desktop)
- ✅ Lector USB (teclado emulado)
- ✅ Búsqueda automática del producto
- ✅ Agregar a factura directamente
- ✅ Sonido de confirmación
- ✅ Fallback a búsqueda manual

---

### 14. NOTIFICACIONES Y ALERTAS

#### 🔔 Sistema de Notificaciones

**Tipos de Alertas:**
- ✅ Stock bajo (cuando qty <= min_stock)
- ✅ Stock agotado (qty = 0)
- ✅ Facturas vencidas
- ✅ Nuevas invitaciones a empresa
- ✅ Límite de plan alcanzado

**Canales:**
- ✅ In-app (campana con contador)
- ✅ Email (opcional)
- ✅ Push notifications (PWA)

**Gestión:**
- ✅ Marcar como leída
- ✅ Eliminar
- ✅ Agrupar por tipo
- ✅ Filtrar por empresa

---

### 15. LOGS Y AUDITORÍA

#### 📝 Activity Logs

**Acciones Registradas:**
- ✅ Login/Logout de usuarios
- ✅ Creación/edición/eliminación de productos
- ✅ Transacciones de inventario
- ✅ Facturas creadas/canceladas
- ✅ Cambios en configuración
- ✅ Invitaciones enviadas
- ✅ Cambios de roles

**Información Capturada:**
```typescript
interface ActivityLog {
  company_id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  description: string;
  ip_address: string;
  user_agent: string;
  metadata: object;
  created_at: timestamp;
}
```

---

### 16. VISTAS Y TRIGGERS SQL

#### 📊 Vistas Creadas

**v_inventory_value:**
- Calcula valor total del inventario
- Por costo y por precio de venta
- Con información de categoría y ubicación

**v_low_stock_products:**
- Productos con stock bajo
- Alertas automáticas

**v_daily_sales:**
- Ventas diarias agregadas
- Total de facturas, ventas, impuestos

#### ⚙️ Triggers Automáticos

**after_company_insert:**
- Crea ubicación principal automática
- Asigna rol de propietario

**after_invoice_item_insert:**
- Descuenta stock automáticamente
- Crea transacción de inventario
- Valida stock disponible

**after_invoice_insert_log:**
- Registra en activity_logs
- Auditoría de facturas

---

### 17. API ENDPOINTS

#### 🔌 Rutas Principales

**Autenticación:**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh
```

**Empresas:**
```
GET    /api/companies
POST   /api/companies
GET    /api/companies/:id
PUT    /api/companies/:id
DELETE /api/companies/:id
POST   /api/companies/:id/switch
```

**Usuarios y Permisos:**
```
GET    /api/companies/:id/members
POST   /api/companies/:id/invite
PUT    /api/companies/:id/members/:userId
DELETE /api/companies/:id/members/:userId
GET    /api/roles
```

**Productos:**
```
GET    /api/companies/:id/products
POST   /api/companies/:id/products
GET    /api/companies/:id/products/:productId
PUT    /api/companies/:id/products/:productId
DELETE /api/companies/:id/products/:productId
GET    /api/companies/:id/products/search?q=...
GET    /api/companies/:id/products/barcode/:code
```

**Inventario:**
```
GET    /api/companies/:id/inventory/transactions
POST   /api/companies/:id/inventory/adjust
POST   /api/companies/:id/inventory/transfer
GET    /api/companies/:id/inventory/value
```

**Facturación:**
```
GET    /api/companies/:id/invoices
POST   /api/companies/:id/invoices
GET    /api/companies/:id/invoices/:invoiceId
PUT    /api/companies/:id/invoices/:invoiceId
DELETE /api/companies/:id/invoices/:invoiceId
POST   /api/companies/:id/invoices/:invoiceId/pay
POST   /api/companies/:id/invoices/:invoiceId/print
```

**Clientes:**
```
GET    /api/companies/:id/customers
POST   /api/companies/:id/customers
GET    /api/companies/:id/customers/:customerId
PUT    /api/companies/:id/customers/:customerId
DELETE /api/companies/:id/customers/:customerId
```

**Reportes:**
```
GET    /api/companies/:id/reports/sales
GET    /api/companies/:id/reports/inventory
GET    /api/companies/:id/reports/financial
GET    /api/companies/:id/reports/export?type=pdf|excel
```

**Catálogo Público:**
```
GET    /api/catalog/:slug
GET    /api/catalog/:slug/categories
GET    /api/catalog/:slug/products
GET    /api/catalog/:slug/products/:sku
```

**Dashboard:**
```
GET    /api/companies/:id/dashboard/stats
GET    /api/companies/:id/dashboard/charts
GET    /api/companies/:id/dashboard/activities
```

---

### 18. ESTRUCTURA DE ARCHIVOS

```
liquidpos-unified/
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register.ts
│   │   │   ├── login.ts
│   │   │   └── [...nextauth].ts
│   │   ├── companies/
│   │   │   ├── index.ts
│   │   │   ├── [id]/
│   │   │   │   ├── index.ts
│   │   │   │   ├── products/
│   │   │   │   ├── invoices/
│   │   │   │   ├── customers/
│   │   │   │   ├── reports/
│   │   │   │   └── dashboard/
│   │   │   └── create.ts
│   │   └── catalog/
│   │       └── [slug]/
│   ├── dashboard/
│   ├── inventory/
│   ├── billing/
│   ├── reports/
│   ├── settings/
│   ├── [@slug]/  (catálogo público)
│   ├── _app.tsx
│   └── index.tsx
├── components/
│   ├── common/
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── CompanySelector.tsx
│   │   └── Notifications.tsx
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   ├── SalesChart.tsx
│   │   └── ActivityFeed.tsx
│   ├── inventory/
│   │   ├── ProductList.tsx
│   │   ├── ProductForm.tsx
│   │   ├── BarcodeScanner.tsx
│   │   └── StockAdjustment.tsx
│   ├── billing/
│   │   ├── InvoiceList.tsx
│   │   ├── InvoiceForm.tsx
│   │   ├── CustomerSelector.tsx
│   │   └── PaymentModal.tsx
│   └── catalog/
│       ├── ProductGrid.tsx
│       ├── CategoryFilter.tsx
│       └── ProductDetail.tsx
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── permissions.ts
│   └── validators.ts
├── utils/
│   ├── formatters.ts
│   ├── calculations.ts
│   └── constants.ts
├── types/
│   ├── database.ts
│   ├── api.ts
│   └── components.ts
├── styles/
│   └── globals.css
├── database.sql
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

---

### 19. MEJORAS UX ESPECÍFICAS

#### ✨ Experiencia del Usuario

**Facturación Rápida:**
- ✅ Escáner de código de barras integrado
- ✅ Agregar productos con Enter
- ✅ Autocompletado de clientes
- ✅ Cálculo automático de totales
- ✅ Vista previa del ticket
- ✅ Impresión con un clic
- ✅ Atajos de teclado (F1-F12)

**Gestión de Inventario:**
- ✅ Búsqueda instantánea
- ✅ Filtros múltiples (categoría, stock, ubicación)
- ✅ Vista de lista y cuadrícula
- ✅ Edición inline
- ✅ Acciones en lote
- ✅ Importar desde Excel
- ✅ Exportar inventario

**Dashboard Inteligente:**
- ✅ Widgets personalizables
- ✅ Período seleccionable
- ✅ Comparación con período anterior
- ✅ Alertas visuales
- ✅ Acciones rápidas

---

### 20. DEPLOYMENT EN VERCEL

#### 🚀 Configuración

**vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "DB_HOST": "@db-host",
    "DB_USER": "@db-user",
    "DB_PASSWORD": "@db-password",
    "DB_NAME": "@db-name",
    "JWT_SECRET": "@jwt-secret",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "NEXTAUTH_URL": "@nextauth-url"
  }
}
```

**Variables de Entorno Requeridas:**
```env
# Database
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=liquidpos

# Auth
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.vercel.app

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

## 🎨 CAMBIOS VISUALES Y DE DISEÑO

### Paleta de Colores 2026
```css
:root {
  /* Primary */
  --color-primary: #6366f1;
  --color-primary-dark: #4f46e5;
  --color-primary-light: #818cf8;
  
  /* Success */
  --color-success: #10b981;
  --color-success-light: #34d399;
  
  /* Warning */
  --color-warning: #f59e0b;
  --color-warning-light: #fbbf24;
  
  /* Error */
  --color-error: #ef4444;
  --color-error-light: #f87171;
  
  /* Neutral */
  --color-gray-50: #f9fafb;
  --color-gray-900: #111827;
  
  /* Glassmorphism */
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Componentes Modernos
- ✅ Cards con glassmorphism
- ✅ Botones con estados hover/active
- ✅ Inputs con floating labels
- ✅ Modales con backdrop blur
- ✅ Toasts animados
- ✅ Skeleton loaders
- ✅ Progress bars
- ✅ Badges y chips

---

## 📊 COMPARATIVA ANTES/DESPUÉS

| Característica | Antes | Después |
|----------------|-------|---------|
| **Usuarios** | 1 usuario = 1 ubicación | Multi-empresa + multi-usuario |
| **Roles** | Sin roles | 7 roles con permisos granulares |
| **Productos** | Campos básicos | 20+ campos + descuentos + impuestos |
| **Facturación** | ❌ No existía | Sistema completo + impresión |
| **Catálogo** | ❌ No existía | Catálogo público en tiempo real |
| **Planes** | Gratuito único | 4 planes con limitaciones |
| **Reportes** | Básicos | Avanzados + exportación |
| **UI Responsive** | Solo mobile | Mobile + Tablet + Desktop |
| **Deployment** | Separado | Unificado en Vercel |
| **Seguridad** | Sesiones en memoria | JWT + NextAuth + Permisos |
| **Base de Datos** | 5 tablas | 18 tablas + vistas + triggers |

---

## 🔄 PROCESO DE MIGRACIÓN

### Pasos para Migrar desde la Versión Anterior

1. **Backup de Datos:**
```sql
mysqldump -u root -p liquidpos > backup_old_liquidpos.sql
```

2. **Crear Nueva Base de Datos:**
```sql
mysql -u root -p < database.sql
```

3. **Migrar Datos (Script SQL):**
```sql
-- Migrar usuarios
INSERT INTO users (id, email, password, name, created_at, updated_at)
SELECT id, email, password, name, created_at, updated_at
FROM old_database.users;

-- Crear empresa por defecto para cada usuario
INSERT INTO companies (owner_id, slug, name, is_active)
SELECT u.id, LOWER(REPLACE(u.name, ' ', '-')), CONCAT(u.name, ' - Empresa'), TRUE
FROM users u;

-- Migrar items a products
INSERT INTO products (
  company_id, sku, name, description, image_url, 
  sale_price, quantity, min_stock, category_id, location_id, created_at
)
SELECT 
  (SELECT id FROM companies WHERE owner_id = i.user_id LIMIT 1),
  i.sku, i.name, i.description, i.image_url,
  15.00, i.quantity, i.min_stock,
  NULL, NULL, i.created_at
FROM old_database.items i;
```

4. **Instalar Dependencias:**
```bash
npm install
```

5. **Configurar Variables de Entorno:**
```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales
```

6. **Build y Deploy:**
```bash
npm run build
vercel --prod
```

---

## 🎯 FEATURES DESTACADAS

### 1. Sistema Inteligente de Descuentos
```typescript
// Descuento por producto
product.discount_enabled = true;
product.discount_type = 'percentage'; // o 'fixed'
product.discount_value = 15; // 15% o $15

// Cálculo automático en factura
const finalPrice = calculateFinalPrice(product);
// Precio original: $100
// Con 15% descuento: $85
```

### 2. Transferencias entre Ubicaciones
```typescript
// Transferir stock entre bodegas
await transferStock({
  productId: 123,
  fromLocationId: 1,
  toLocationId: 2,
  quantity: 50,
  notes: 'Transferencia a sucursal norte'
});
// Crea 2 transacciones automáticamente (OUT en origen, IN en destino)
```

### 3. Alertas Inteligentes
```typescript
// Sistema de notificaciones automáticas
- Stock bajo: cuando quantity <= min_stock
- Stock crítico: cuando quantity <= min_stock * 0.5
- Stock agotado: cuando quantity = 0
- Vencimiento de plan: 7 días antes
- Límite alcanzado: cuando se alcanza límite del plan
```

### 4. Búsqueda Avanzada
```sql
-- Búsqueda full-text en productos
SELECT * FROM products 
WHERE MATCH(name, description) AGAINST('laptop' IN NATURAL LANGUAGE MODE)
  AND company_id = 1
  AND is_active = TRUE;
```

---

## 📱 PWA (Progressive Web App)

**manifest.json:**
```json
{
  "name": "LiquidPOS",
  "short_name": "LiquidPOS",
  "description": "Sistema de gestión empresarial",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Características PWA:**
- ✅ Instalable en móvil y desktop
- ✅ Funciona offline (caché de datos)
- ✅ Push notifications
- ✅ Actualizaciones automáticas
- ✅ Modo standalone

---

## 🔮 ROADMAP FUTURO

### Fase 1 (Actual) ✅
- [x] Sistema multi-empresa
- [x] Roles y permisos
- [x] Facturación completa
- [x] Catálogo público
- [x] Planes premium

### Fase 2 (Próximo)
- [ ] App móvil nativa (React Native)
- [ ] Sincronización offline
- [ ] Integraciones de pago (Stripe, PayPal)
- [ ] API pública con webhooks
- [ ] Módulo de compras/proveedores

### Fase 3 (Futuro)
- [ ] Business Intelligence con IA
- [ ] Predicción de demanda
- [ ] Recomendaciones automáticas
- [ ] Marketplace de plugins
- [ ] White-label solution

---

## 📞 SOPORTE Y CONTACTO

**Documentación:**
- README.md completo
- Guía de instalación paso a paso
- API documentation (OpenAPI/Swagger)
- Video tutoriales

**Canales de Soporte:**
- Email: support@liquidpos.com
- Chat en vivo (para planes Pro+)
- Centro de ayuda (FAQ)
- Comunidad Discord

---

## 📄 LICENCIA

MIT License - Uso libre con atribución

---

## 🙏 CONCLUSIÓN

El sistema ha sido **completamente transformado** de un simple gestor de inventario a una **plataforma empresarial robusta y escalable** que puede ser utilizada por pequeñas, medianas y grandes empresas.

**Principales Logros:**
✅ Arquitectura multi-empresa
✅ 18 tablas normalizadas con vistas y triggers
✅ Sistema completo de facturación
✅ Catálogo público en tiempo real
✅ 7 roles con permisos granulares
✅ 4 planes de suscripción
✅ UI responsive (mobile, tablet, desktop)
✅ Deployment unificado en Vercel
✅ Seguridad robusta (JWT + NextAuth)
✅ Performance optimizado
✅ Código limpio y mantenible

**El sistema está listo para:**
- Escalar a miles de empresas
- Procesar miles de transacciones diarias
- Soportar múltiples usuarios concurrentes
- Crecer con nuevas funcionalidades
- Integrarse con servicios externos

---

*Documento generado el 2 de Abril de 2026*
*LiquidPOS v2.0 - Sistema de Gestión Empresarial*
