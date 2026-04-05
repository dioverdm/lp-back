import { query } from './db';

export interface Permission {
  module: string;
  actions: string[];
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  permissions: any;
}

export interface CompanyMember {
  id: number;
  company_id: number;
  user_id: number;
  role_id: number;
  status: 'active' | 'invited' | 'suspended';
}

// Verificar si el usuario tiene permiso en una empresa
export const checkUserCompanyAccess = async (
  userId: number,
  companyId: number
): Promise<boolean> => {
  const result = await query<any[]>(
    `SELECT id FROM company_members 
     WHERE user_id = ? AND company_id = ? AND status = 'active'`,
    [userId, companyId]
  );
  return result.length > 0;
};

// Obtener rol del usuario en una empresa
export const getUserRole = async (
  userId: number,
  companyId: number
): Promise<Role | null> => {
  const result = await query<any[]>(
    `SELECT r.* FROM roles r
     JOIN company_members cm ON cm.role_id = r.id
     WHERE cm.user_id = ? AND cm.company_id = ? AND cm.status = 'active'`,
    [userId, companyId]
  );
  
  if (result.length === 0) return null;
  
  const role = result[0];
  return {
    ...role,
    permissions: JSON.parse(role.permissions || '{}')
  };
};

// Verificar permiso específico
export const hasPermission = (
  role: Role,
  module: string,
  action: string
): boolean => {
  // Owner tiene todos los permisos
  if (role.permissions.all === true) {
    return true;
  }

  const modulePermissions = role.permissions[module];
  if (!modulePermissions) return false;

  return modulePermissions.includes(action);
};

// Middleware de permisos
export const requirePermission = (module: string, action: string) => {
  return async (userId: number, companyId: number): Promise<boolean> => {
    const role = await getUserRole(userId, companyId);
    if (!role) return false;
    return hasPermission(role, module, action);
  };
};

// Verificar si es propietario
export const isCompanyOwner = async (
  userId: number,
  companyId: number
): Promise<boolean> => {
  const result = await query<any[]>(
    'SELECT id FROM companies WHERE id = ? AND owner_id = ?',
    [companyId, userId]
  );
  return result.length > 0;
};

// Obtener todas las empresas del usuario
export const getUserCompanies = async (userId: number) => {
  return query<any[]>(
    `SELECT DISTINCT c.*, cm.role_id,
      (SELECT name FROM roles WHERE id = cm.role_id) as role_name
     FROM companies c
     JOIN company_members cm ON cm.company_id = c.id
     WHERE cm.user_id = ? AND cm.status = 'active' AND c.is_active = TRUE
     ORDER BY c.created_at DESC`,
    [userId]
  );
};

// Verificar límites del plan
export const checkPlanLimits = async (
  userId: number,
  limitType: 'companies' | 'products' | 'users' | 'invoices'
) => {
  const planResult = await query<any[]>(
    `SELECT sp.* FROM subscription_plans sp
     JOIN user_subscriptions us ON us.plan_id = sp.id
     WHERE us.user_id = ? AND us.status = 'active'
     ORDER BY us.created_at DESC LIMIT 1`,
    [userId]
  );

  if (planResult.length === 0) {
    // Plan gratuito por defecto
    return {
      companies: 1,
      products: 50,
      users: 1,
      invoices: 20
    };
  }

  const plan = planResult[0];
  return {
    companies: plan.max_companies,
    products: plan.max_products,
    users: plan.max_users_per_company,
    invoices: plan.max_invoices_per_month
  };
};

// Verificar si se puede crear recurso
export const canCreateResource = async (
  userId: number,
  resourceType: 'companies' | 'products' | 'users' | 'invoices',
  companyId?: number
): Promise<{ allowed: boolean; current: number; max: number }> => {
  const limits = await checkPlanLimits(userId, resourceType);
  const maxLimit = limits[resourceType];

  let current = 0;
  
  switch (resourceType) {
    case 'companies':
      const companies = await query<any[]>(
        'SELECT COUNT(*) as count FROM companies WHERE owner_id = ?',
        [userId]
      );
      current = companies[0].count;
      break;
      
    case 'products':
      if (!companyId) throw new Error('companyId required for products');
      const products = await query<any[]>(
        'SELECT COUNT(*) as count FROM products WHERE company_id = ?',
        [companyId]
      );
      current = products[0].count;
      break;
      
    case 'users':
      if (!companyId) throw new Error('companyId required for users');
      const users = await query<any[]>(
        'SELECT COUNT(*) as count FROM company_members WHERE company_id = ?',
        [companyId]
      );
      current = users[0].count;
      break;
      
    case 'invoices':
      if (!companyId) throw new Error('companyId required for invoices');
      const invoices = await query<any[]>(
        `SELECT COUNT(*) as count FROM invoices 
         WHERE company_id = ? 
         AND MONTH(created_at) = MONTH(CURRENT_DATE())
         AND YEAR(created_at) = YEAR(CURRENT_DATE())`,
        [companyId]
      );
      current = invoices[0].count;
      break;
  }

  return {
    allowed: current < maxLimit,
    current,
    max: maxLimit
  };
};
