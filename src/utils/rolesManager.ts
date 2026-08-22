// src/utils/rolesManager.ts

/**
 * Permisos disponibles en el sistema.
 *
 * IMPORTANTE:
 * Los permisos deben coincidir exactamente con los utilizados
 * en el Dashboard y en los demás módulos.
 */
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

/**
 * Estructura de un rol.
 */
export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

/**
 * Estructura de un usuario.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  roleId?: string;
  role?: string;
}

/**
 * Datos de ejemplo para los roles del sistema.
 *
 * Administrador:
 * Tiene acceso completo al sistema.
 */
const mockRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrador',
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

  /**
   * Visualizador:
   * Puede consultar información, pero no administrar
   * roles ni cuentas por pagar.
   */
  {
    id: 'viewer',
    name: 'Visualizador',
    permissions: [
      'view_pos',
      'view_inventory',
      'view_reports',
      'view_payables',
      'view_credits',
      'view_dashboard',
    ],
  },
];

/**
 * Datos de ejemplo para los usuarios.
 */
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Administrador General',
    email: 'admin@example.com',
    roleId: 'admin',
    role: 'admin',
  },
];

/**
 * Retorna la lista de roles disponibles
 * en el sistema.
 */
export function getRoles(): Role[] {
  return mockRoles;
}

/**
 * Retorna la lista de usuarios disponibles
 * en el sistema.
 */
export function getUsers(): User[] {
  return mockUsers;
}

/**
 * Valida si un rol específico cuenta
 * con un permiso determinado.
 */
export function hasPermission(
  roleId: string,
  permission: Permission
): boolean {
  const role = mockRoles.find((r) => r.id === roleId);

  if (!role) {
    return false;
  }

  return role.permissions.includes(permission);
}
