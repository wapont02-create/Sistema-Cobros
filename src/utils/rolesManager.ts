export type Permission =
  | 'view_pos'
  | 'view_inventory'
  | 'edit_inventory'
  | 'view_receivable'
  | 'view_reports'
  | 'manage_roles';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface User {
  id: number;
  name: string;
  username: string;
  role: string;
}

export const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acceso total al sistema',
    permissions: [
      'view_pos',
      'view_inventory',
      'edit_inventory',
      'view_reports',
      'view_receivable',
      'manage_roles',
    ],
  },
  {
    id: 'cajero',
    name: 'Cajero / Operador',
    description:
      'Acceso exclusivo al terminal de caja y cobros',
    permissions: ['view_pos'],
  },
  {
    id: 'almacenista',
    name: 'Almacenista',
    description: 'Gestión de inventario y stock',
    permissions: [
      'view_inventory',
      'edit_inventory',
    ],
  },
];

export const DEFAULT_USERS: User[] = [
  {
    id: 1,
    name: 'Ana Administradora',
    username: 'admin',
    role: 'admin',
  },
  {
    id: 2,
    name: 'Carlos Cajero',
    username: 'cajero1',
    role: 'cajero',
  },
  {
    id: 3,
    name: 'Luis Almacenista',
    username: 'almacen1',
    role: 'almacenista',
  },
];

export function getRoles(): Role[] {
  if (typeof window === 'undefined') {
    return DEFAULT_ROLES;
  }

  try {
    const saved = localStorage.getItem(
      'pos_custom_roles'
    );

    if (!saved) {
      return DEFAULT_ROLES;
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return DEFAULT_ROLES;
    }

    return parsed as Role[];
  } catch (error) {
    console.error('Error cargando roles:', error);
    return DEFAULT_ROLES;
  }
}

export function saveRoles(roles: Role[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(
      'pos_custom_roles',
      JSON.stringify(roles)
    );
  } catch (error) {
    console.error('Error guardando roles:', error);
  }
}

export function getUsers(): User[] {
  if (typeof window === 'undefined') {
    return DEFAULT_USERS;
  }

  try {
    const saved = localStorage.getItem(
      'pos_custom_users'
    );

    if (!saved) {
      return DEFAULT_USERS;
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return DEFAULT_USERS;
    }

    return parsed as User[];
  } catch (error) {
    console.error('Error cargando usuarios:', error);
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(
      'pos_custom_users',
      JSON.stringify(users)
    );
  } catch (error) {
    console.error('Error guardando usuarios:', error);
  }
}

export function hasPermission(
  roleId: string,
  permission: Permission
): boolean {
  const roles = getRoles();

  const role = roles.find(
    (r) => r.id === roleId
  );

  if (!role) {
    return false;
  }

  return role.permissions.includes(permission);
}
