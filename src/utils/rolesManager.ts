// src/utils/rolesManager.ts

/**
 * Permisos disponibles en el sistema.
 *
 * IMPORTANTE:
 * Estos permisos deben coincidir exactamente
 * con los utilizados en Dashboard y módulos.
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
  username: string;
  email: string;
  roleId?: string;
  role?: string;
}

/**
 * Roles iniciales del sistema.
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
 * Usuarios iniciales.
 */
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Administrador General',
    username: 'admin',
    email: 'admin@example.com',
    roleId: 'admin',
    role: 'admin',
  },
];

/**
 * Obtener todos los roles.
 */
export function getRoles(): Role[] {
  return mockRoles;
}

/**
 * Obtener todos los usuarios.
 */
export function getUsers(): User[] {
  return mockUsers;
}

/**
 * Guardar usuarios.
 *
 * Esta función mantiene la misma referencia
 * del arreglo interno para que los módulos
 * que utilizan getUsers() sigan funcionando.
 */
export function saveUsers(users: User[]): void {
  mockUsers.splice(0, mockUsers.length, ...users);
}

/**
 * Guardar roles.
 */
export function saveRoles(roles: Role[]): void {
  mockRoles.splice(0, mockRoles.length, ...roles);
}

/**
 * Verificar si un rol tiene un permiso.
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
