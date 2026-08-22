export type Permission =
  | 'view_payables'
  | 'manage_roles'
  | 'view_users'
  | 'view_credits'
  | 'manage_payables'
  | 'view_dashboard';

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
}

// Datos de ejemplo para los roles del sistema
const mockRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrador',
    permissions: [
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
    name: 'Visualizador',
    permissions: [
      'view_payables',
      'view_credits',
      'view_dashboard',
    ],
  },
];

// Datos de ejemplo para los usuarios
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Administrador General',
    email: 'admin@example.com',
    roleId: 'admin',
  },
];

/**
 * Retorna la lista de roles disponibles en el sistema con sus permisos.
 */
export function getRoles(): Role[] {
  return mockRoles;
}

/**
 * Retorna la lista de usuarios del sistema.
 */
export function getUsers(): User[] {
  return mockUsers;
}

/**
 * Valida si un rol específico cuenta con un permiso determinado.
 */
export function hasPermission(roleId: string, permission: Permission): boolean {
  const role = mockRoles.find((r) => r.id === roleId);
  if (!role) return false;
  return role.permissions.includes(permission);
}
