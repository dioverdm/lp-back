# 🚀 LiquidPOS 2.0 - Sistema de Gestión Empresarial

> Plataforma completa multi-empresa con inventario, facturación, catálogo público y sistema de permisos granulares.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.17.0-brightgreen)

---

## 📋 Tabla de Contenidos

- [Características](#-características-principales)
- [Requisitos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Deployment](#-deployment-en-vercel)
- [Uso](#-guía-de-uso)
- [API](#-documentación-api)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Características Principales

### 🏢 Sistema Multi-Empresa
- ✅ Un usuario puede gestionar múltiples empresas
- ✅ Alternar entre empresas con un clic
- ✅ Slug único para cada empresa (`/@empresa-slug`)
- ✅ Configuración independiente por empresa

### 👥 Roles y Permisos
- ✅ 7 roles predefinidos (Propietario, Admin, Gerente, Vendedor, ATC, Contador, Bodeguero)
- ✅ Permisos granulares por módulo
- ✅ Invitación de usuarios por email
- ✅ Control de acceso basado en roles (RBAC)

### 💰 Facturación Completa
- ✅ Facturas, cotizaciones y órdenes
- ✅ Múltiples métodos de pago
- ✅ Sistema de descuentos (% o fijo)
- ✅ Cálculo automático de impuestos
- ✅ Gestión de clientes
- ✅ Impresión fiscal (térmica, red, USB)

### 📦 Gestión de Inventario
- ✅ Escáner de códigos de barras
- ✅ Multi-ubicación (bodegas/sucursales)
- ✅ Alertas de stock bajo
- ✅ Transferencias entre ubicaciones
- ✅ Historial completo de movimientos
- ✅ Valorización de inventario

### 🌐 Catálogo Público
- ✅ Catálogo en tiempo real en `/@empresa-slug`
- ✅ Actualización automática de precios/stock
- ✅ Búsqueda y filtros
- ✅ SEO optimizado
- ✅ Responsive design

### 💳 Planes Premium
- ✅ 4 planes (Free, Básico, Pro, Enterprise)
- ✅ Limitaciones por plan
- ✅ Control de uso en tiempo real
- ✅ Upgrade sugerido al alcanzar límites

### 📊 Reportes y Analytics
- ✅ Dashboard con KPIs en tiempo real
- ✅ Gráficas de ventas
- ✅ Reportes de inventario
- ✅ Exportación a PDF/Excel
- ✅ Filtros por período

---

## 📦 Requisitos Previos

### Software Necesario

- **Node.js** >= 18.17.0 ([Descargar](https://nodejs.org/))
- **MySQL** >= 8.0 ([Descargar](https://dev.mysql.com/downloads/))
- **npm** >= 9.0.0 (viene con Node.js)
- **Git** (opcional)

### Servicios Externos

- Cuenta en **Vercel** (para deployment) - [Registro gratis](https://vercel.com)
- Servidor **MySQL** (puede ser local o remoto)

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
# Si tienes el código en Git
git clone https://github.com/tu-usuario/liquidpos-unified.git
cd liquidpos-unified

# O si lo tienes localmente, solo navega a la carpeta
cd liquidpos-unified
```

### 2. Instalar Dependencias

```bash
npm install
```

Esto instalará todos los paquetes necesarios:
- Next.js 14
- React 18
- MySQL2
- NextAuth
- Zod, React Hook Form
- Y más...

### 3. Configurar Base de Datos

#### Opción A: Base de Datos Local (Desarrollo)

```bash
# 1. Iniciar MySQL
mysql -u root -p

# 2. Crear la base de datos y tablas
mysql -u root -p < database.sql
```

#### Opción B: Base de Datos Remota (Producción)

Si usas un servicio como **PlanetScale**, **Railway**, **Aiven**, etc.:

1. Crea una nueva base de datos MySQL
2. Obtén las credenciales de conexión
3. Ejecuta el script SQL:

```bash
mysql -h tu-host.com -u tu-usuario -p tu-database < database.sql
```

### 4. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:

```env
# ============================================
# DATABASE
# ============================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu-password
DB_NAME=liquidpos

# ============================================
# AUTHENTICATION
# ============================================
JWT_SECRET=tu-super-secreto-jwt-key-cambiar-en-produccion
NEXTAUTH_SECRET=tu-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3000

# ============================================
# APP
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# ============================================
# OPTIONAL: Email (para invitaciones)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-password-de-aplicacion

# ============================================
# OPTIONAL: Storage (para imágenes)
# ============================================
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
# O usa S3, Vercel Blob, etc.
```

> **⚠️ IMPORTANTE:** 
> - Nunca subas el archivo `.env.local` a Git
> - Cambia `JWT_SECRET` y `NEXTAUTH_SECRET` en producción
> - Usa contraseñas seguras

### 5. Verificar Instalación

```bash
# Verificar que todo esté correcto
npm run type-check
```

---

## ⚙️ Configuración

### Generar Secrets Seguros

Para producción, genera secrets criptográficamente seguros:

```bash
# En Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Usa la salida como valor para `JWT_SECRET` y `NEXTAUTH_SECRET`.

### Configurar Planes de Suscripción

Los planes vienen preconfigurados en el SQL. Para modificarlos:

```sql
-- Editar límites de un plan
UPDATE subscription_plans 
SET max_products = 1000, max_invoices_per_month = 200
WHERE slug = 'basic';

-- Crear un plan personalizado
INSERT INTO subscription_plans (name, slug, price_monthly, max_companies, max_products)
VALUES ('Custom', 'custom', 49.99, 3, 2000);
```

---

## 🏃 Ejecutar en Desarrollo

```bash
# Modo desarrollo (con hot-reload)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### URLs Importantes

- **Dashboard:** `http://localhost:3000/dashboard`
- **Login:** `http://localhost:3000/login`
- **API Health:** `http://localhost:3000/api/health`
- **Catálogo ejemplo:** `http://localhost:3000/@empresa-demo`

---

## 🚀 Deployment en Vercel

### Opción 1: Desde CLI

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

### Opción 2: Desde GitHub

1. Sube tu código a GitHub
2. Ve a [vercel.com/new](https://vercel.com/new)
3. Importa tu repositorio
4. Configura las variables de entorno
5. Deploy

### Variables de Entorno en Vercel

En el dashboard de Vercel, agrega:

```
DB_HOST=tu-mysql-host.com
DB_PORT=3306
DB_USER=tu-usuario
DB_PASSWORD=tu-password
DB_NAME=liquidpos
JWT_SECRET=tu-jwt-secret
NEXTAUTH_SECRET=tu-nextauth-secret
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

> **💡 Tip:** Usa los "Environment Variables" de Vercel para manejar secrets de forma segura.

---

## 📖 Guía de Uso

### 1. Registro de Usuario

```bash
# Método 1: Desde la UI
1. Ve a /register
2. Completa email, nombre y contraseña
3. Clic en "Registrarse"
```

```bash
# Método 2: API directa
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "password": "contraseña123",
    "name": "Admin Principal"
  }'
```

### 2. Crear Primera Empresa

Al registrarte, se crea automáticamente una empresa. Para crear más:

```typescript
// Desde el dashboard
1. Clic en "Crear Nueva Empresa"
2. Completa:
   - Nombre de la empresa
   - Slug (URL única): @mi-empresa
   - Datos fiscales (opcional)
3. Guardar
```

### 3. Configurar Catálogo Público

```typescript
// En Configuración de Empresa
1. Ve a Configuración > General
2. Activa "Habilitar Catálogo"
3. Activa "Catálogo Público"
4. Tu catálogo estará en: /@tu-empresa-slug
```

### 4. Agregar Productos

```typescript
// Opción A: Manual
1. Ve a Inventario > Productos
2. Clic en "+ Nuevo Producto"
3. Completa:
   - Nombre
   - SKU
   - Código de barras (opcional)
   - Precio
   - Stock inicial
   - Categoría
4. Guardar

// Opción B: Importar desde Excel
1. Ve a Inventario > Importar
2. Descarga plantilla
3. Llena la plantilla
4. Sube el archivo
5. Mapea las columnas
6. Importar
```

### 5. Invitar Usuarios a la Empresa

```typescript
1. Ve a Configuración > Miembros
2. Clic en "Invitar Usuario"
3. Ingresa email del usuario
4. Selecciona rol:
   - Administrador (todo excepto eliminar empresa)
   - Gerente (inventario + reportes)
   - Vendedor (solo facturación)
   - Contador (reportes financieros)
   - Bodeguero (solo inventario)
5. Enviar invitación
```

### 6. Crear Factura

```typescript
// Flujo de facturación
1. Ve a Facturación > Nueva Factura
2. Selecciona o crea cliente
3. Agrega productos:
   - Escáner de código de barras
   - O búsqueda manual
4. Ajusta cantidades
5. Aplica descuentos (si es necesario)
6. Selecciona método de pago
7. Ingresa monto recibido (si es efectivo)
8. Finalizar Venta
9. Imprimir ticket (opcional)
```

### 7. Ver Reportes

```typescript
// Tipos de reportes disponibles
1. Dashboard:
   - KPIs en tiempo real
   - Gráficas de ventas
   - Actividad reciente

2. Inventario:
   - Valorización
   - Movimientos
   - Stock bajo

3. Ventas:
   - Por período
   - Por producto
   - Por vendedor
   - Por método de pago

4. Financiero:
   - Flujo de caja
   - Cuentas por cobrar
   - Utilidad bruta
```

---

## 🔌 Documentación API

### Autenticación

Todas las rutas protegidas requieren un token JWT en el header:

```bash
Authorization: Bearer <tu-token-jwt>
```

### Endpoints Principales

#### Auth

```bash
# Registro
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Respuesta
{
  "user": { "id": 1, "email": "...", "name": "..." },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Empresas

```bash
# Listar empresas del usuario
GET /api/companies
Authorization: Bearer <token>

# Crear empresa
POST /api/companies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Mi Empresa",
  "slug": "mi-empresa",
  "tax_id": "123456789",
  "email": "info@miempresa.com"
}
```

#### Productos

```bash
# Listar productos de una empresa
GET /api/companies/:companyId/products
Authorization: Bearer <token>

# Crear producto
POST /api/companies/:companyId/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "sku": "PROD001",
  "name": "Producto Ejemplo",
  "sale_price": 25000,
  "quantity": 100,
  "category_id": 1
}
```

#### Facturas

```bash
# Crear factura
POST /api/companies/:companyId/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_id": 1,
  "payment_method": "cash",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 25000
    }
  ]
}
```

### Catálogo Público (sin auth)

```bash
# Ver catálogo de una empresa
GET /api/catalog/:slug

# Ver productos del catálogo
GET /api/catalog/:slug/products

# Ver producto específico
GET /api/catalog/:slug/products/:sku
```

---

## 🔧 Troubleshooting

### Error: "Cannot connect to database"

**Causa:** Credenciales incorrectas o MySQL no está corriendo

**Solución:**
```bash
# 1. Verifica que MySQL esté corriendo
sudo service mysql status

# 2. Verifica las credenciales en .env.local
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu-password

# 3. Prueba la conexión
mysql -h localhost -u root -p
```

### Error: "Module not found"

**Causa:** Dependencias no instaladas

**Solución:**
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 3000 is already in use"

**Causa:** Otro proceso está usando el puerto

**Solución:**
```bash
# Opción 1: Usar otro puerto
PORT=3001 npm run dev

# Opción 2: Matar el proceso que usa el puerto
lsof -ti:3000 | xargs kill -9
```

### Error: "JWT malformed" o "Invalid token"

**Causa:** Token expirado o inválido

**Solución:**
```bash
# Hacer logout y login nuevamente
# O renovar el token usando el endpoint /api/auth/refresh
```

### Las imágenes no se cargan

**Causa:** No hay configuración de almacenamiento

**Solución:**
```bash
# 1. Configura Cloudinary o S3 en .env.local
CLOUDINARY_URL=cloudinary://...

# 2. O usa la carpeta public (solo desarrollo)
# Sube las imágenes a /public/uploads/
```

### Error al importar Excel

**Causa:** Formato de archivo incorrecto

**Solución:**
```bash
# 1. Descarga la plantilla oficial desde el sistema
# 2. No modifiques las cabeceras
# 3. Verifica que el archivo sea .xlsx (no .xls)
```

---

## 📊 Performance Tips

### Optimización de Base de Datos

```sql
-- Agregar índices faltantes (si es necesario)
CREATE INDEX idx_products_company_active ON products(company_id, is_active);
CREATE INDEX idx_invoices_company_status ON invoices(company_id, status);

-- Limpiar sesiones expiradas (ejecutar periódicamente)
DELETE FROM sessions WHERE expires < UNIX_TIMESTAMP() * 1000;

-- Limpiar logs antiguos (6 meses)
DELETE FROM activity_logs 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
```

### Caché en Frontend

El sistema usa **SWR** para caché automático. Configuración:

```typescript
// lib/swr-config.ts
export const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  focusThrottleInterval: 5000
};
```

---

## 🔐 Seguridad

### Checklist de Seguridad

- [ ] Cambiar `JWT_SECRET` y `NEXTAUTH_SECRET` en producción
- [ ] Habilitar HTTPS en producción
- [ ] Configurar CORS correctamente
- [ ] Implementar rate limiting (opcional)
- [ ] Habilitar backup automático de BD
- [ ] Configurar firewall en el servidor MySQL
- [ ] Usar variables de entorno para secrets (nunca hardcodear)
- [ ] Habilitar 2FA para cuentas admin (roadmap)

### Buenas Prácticas

```typescript
// ✅ CORRECTO
const password = await bcrypt.hash(plainPassword, 10);

// ❌ INCORRECTO
const password = plainPassword; // Nunca guardar contraseñas en texto plano
```

---

## 📞 Soporte

### Recursos

- 📖 [Documentación completa](./CHANGELOG.md)
- 🎥 [Video tutoriales](#) (próximamente)
- 💬 [Discord Community](#) (próximamente)
- 📧 [Email: support@liquidpos.com](#)

### Reportar Bugs

Abre un issue en GitHub con:
- Descripción del problema
- Pasos para reproducir
- Screenshots
- Versión del sistema

---

## 📝 Licencia

MIT License - Ver [LICENSE](./LICENSE) para más detalles.

---

## 🙏 Créditos

Desarrollado con ❤️ por el equipo de LiquidPOS

**Stack Tecnológico:**
- Next.js 14
- React 18
- MySQL 8
- TypeScript
- Tailwind CSS (sin usar en el sistema actual - puro CSS)
- NextAuth
- SWR
- Zod

---

## 🎯 Próximos Pasos

Después de la instalación:

1. ✅ Registrar usuario principal
2. ✅ Crear primera empresa
3. ✅ Configurar datos fiscales
4. ✅ Agregar categorías de productos
5. ✅ Importar inventario inicial
6. ✅ Configurar impresora (si aplica)
7. ✅ Invitar miembros del equipo
8. ✅ Activar catálogo público
9. ✅ Crear primera factura de prueba
10. ✅ Revisar reportes del dashboard

---

**¿Listo para empezar?** 🚀

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) y comienza a gestionar tu empresa.

---

*Última actualización: Abril 2026*
