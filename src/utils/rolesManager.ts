// Definición estricta de todos los permisos disponibles en el sistema POS y Dashboard
export type Permission =
  | 'view_pos'
  | 'view_inventory'
  | 'view_reports'
  | 'view_payables'
  | 'manage_roles'
  | 'view_users'
  | 'view_credits'
  | 'manage_payables'
  | 'view_dashboard';

// Interfaz para la estructura de un Rol
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

// Configuración predeterminada de roles del sistema
export const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acceso total a todas las módulos, configuración y gestión del sistema.',
    permissions: [
      'view_pos',
      'view_inventory',
      'view_reports',
      'view_payables',
      'manage_roles',
      'view_users',
      'view_credits',
      'manage_payables',
      'view_dashboard',
    ],
  },
  {
    id: 'viewer',
    name: 'Visualizador / Auditor',
    description: 'Acceso de consulta a operaciones, inventario, reportes y finanzas básicas.',
    permissions: [
      'view_pos',
      'view_inventory',
      'view_reports',
      'view_payables',
      'view_credits',
      'view_dashboard',
    ],
  },
  {
    id: 'cashier',
    name: 'Cajero',
    description: 'Acceso operativo al punto de venta, inventario de consulta y control de créditos.',
    permissions: [
      'view_pos',
      'view_inventory',
      'view_credits',
      'view_dashboard',
    ],
  },
];

/**
 * Verifica si un conjunto de permisos de usuario incluye un permiso específico.
 */
export function hasPermission(userPermissions: string[], permission: Permission): boolean {
  return userPermissions.includes(permission);
}

/**
 * Obtiene los permisos predeterminados de un rol por su ID.
 */
export function getPermissionsByRoleId(roleId: string): Permission[] {
  const role = DEFAULT_ROLES.find((r) => r.id === roleId);
  return role ? role.permissions : [];
}
