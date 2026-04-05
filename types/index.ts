// Database types
export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  email_verified: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Company {
  id: number;
  owner_id: number;
  slug: string;
  name: string;
  legal_name?: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  logo_url?: string;
  website?: string;
  description?: string;
  currency: string;
  timezone: string;
  is_active: boolean;
  catalog_enabled: boolean;
  catalog_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: number;
  company_id: number;
  category_id?: number;
  location_id?: number;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  image_url?: string;
  cost_price: number;
  sale_price: number;
  quantity: number;
  min_stock: number;
  max_stock?: number;
  unit: string;
  weight?: number;
  weight_unit: string;
  tax_rate: number;
  discount_enabled: boolean;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  show_in_catalog: boolean;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Invoice {
  id: number;
  company_id: number;
  customer_id?: number;
  created_by: number;
  invoice_number: string;
  invoice_type: 'sale' | 'quote' | 'order';
  status: 'draft' | 'pending' | 'paid' | 'partial' | 'canceled' | 'refunded';
  payment_method: 'cash' | 'card' | 'transfer' | 'credit' | 'other';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  notes?: string;
  customer_name?: string;
  customer_tax_id?: string;
  customer_email?: string;
  customer_phone?: string;
  issued_at: Date;
  due_date?: Date;
  paid_at?: Date;
  canceled_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id?: number;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  discount_type?: 'percentage' | 'fixed';
  discount_value: number;
  tax_rate: number;
  subtotal: number;
  total: number;
  created_at: Date;
}

export interface Customer {
  id: number;
  company_id: number;
  customer_type: 'individual' | 'business';
  name: string;
  email?: string;
  phone?: string;
  tax_id?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  notes?: string;
  credit_limit: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: number;
  company_id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  image_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Location {
  id: number;
  company_id: number;
  name: string;
  code?: string;
  description?: string;
  address?: string;
  is_main: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface InventoryTransaction {
  id: number;
  company_id: number;
  product_id: number;
  user_id: number;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN' | 'DAMAGED';
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  from_location_id?: number;
  to_location_id?: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  created_at: Date;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  permissions: any;
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CompanyMember {
  id: number;
  company_id: number;
  user_id: number;
  role_id: number;
  status: 'active' | 'invited' | 'suspended';
  invited_by?: number;
  invited_at: Date;
  joined_at?: Date;
  last_activity?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  max_companies: number;
  max_products: number;
  max_users_per_company: number;
  max_invoices_per_month: number;
  features: any;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard types
export interface DashboardStats {
  totalProducts: number;
  totalValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  todaySales: number;
  todayInvoices: number;
  pendingInvoices: number;
  monthRevenue: number;
}

export interface SalesChartData {
  date: string;
  sales: number;
  invoices: number;
}

export interface TopProduct {
  id: number;
  name: string;
  sku: string;
  total_sold: number;
  revenue: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  name: string;
}

export interface CompanyForm {
  name: string;
  slug: string;
  legal_name?: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface ProductForm {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: number;
  location_id?: number;
  cost_price: number;
  sale_price: number;
  quantity: number;
  min_stock: number;
  max_stock?: number;
  unit?: string;
  tax_rate?: number;
}

export interface InvoiceForm {
  customer_id?: number;
  customer_name?: string;
  customer_tax_id?: string;
  customer_email?: string;
  customer_phone?: string;
  payment_method: 'cash' | 'card' | 'transfer' | 'credit' | 'other';
  items: InvoiceItemForm[];
  notes?: string;
}

export interface InvoiceItemForm {
  product_id?: number;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  discount_value?: number;
  tax_rate?: number;
}
