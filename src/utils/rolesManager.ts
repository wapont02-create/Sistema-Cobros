/**
 * src/utils/rolesManager.ts
 *
 * Sistema centralizado de roles, usuarios y permisos.
 */

export type Permission =
  | 'view_pos'
  | 'view_inventory'
  | 'edit_inventory'
  | 'view_reports'
  | 'view_payables'
  | 'manage_payables'
  | 'view_credits'
  | 'manage_roles'
  | 'view_users'
  | 'view_dashboard';

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  roleId?: string;
  role: string;
}

/**
 * ============================================================
 * ROLES INICIALES
 * ============================================================
 */

const defaultRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrador',
    description:
      'Acceso completo al sistema y administración de usuarios.',
    permissions: [
      'view_pos',
      'view_inventory',
      'edit_inventory',
      'view_reports',
      'view_payables',
      'manage_payables',
      'view_credits',
      'manage_roles',
      'view_users',
      'view_dashboard',
    ],
  },

  {
    id: 'cajero',
    name: 'Cajero',
    description:
      'Puede operar la caja y consultar clientes.',
    permissions: [
      'view_pos',
      'view_dashboard',
    ],
  },

  {
    id: 'inventario',
    name: 'Encargado de Inventario',
    description:
      'Puede consultar y modificar el inventario.',
    permissions: [
      'view_pos',
      'view_inventory',
      'edit_inventory',
      'view_dashboard',
    ],
  },

  {
    id: 'supervisor',
    name: 'Supervisor',
    description:
      'Puede consultar ventas, inventario, créditos y reportes.',
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
    id: 'viewer',
    name: 'Visualizador',
    description:
      'Puede consultar información sin modificar configuraciones.',
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
 * ============================================================
 * USUARIO ADMINISTRADOR INICIAL
 * ============================================================
 */

const defaultUsers: User[] = [
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
 * ============================================================
 * STORAGE
 * ============================================================
 */

const ROLES_STORAGE_KEY = 'pos_roles';
const USERS_STORAGE_KEY = 'pos_users';

/**
 * Obtiene roles.
 */
export function getRoles(): Role[] {
  if (typeof window === 'undefined') {
    return defaultRoles;
  }

  try {
    const stored = localStorage.getItem(ROLES_STORAGE_KEY);

    if (!stored) {
      localStorage.setItem(
        ROLES_STORAGE_KEY,
        JSON.stringify(defaultRoles)
      );

      return defaultRoles;
    }

    const parsed = JSON.parse(stored);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return defaultRoles;
  } catch (error) {
    console.error(
      'Error leyendo roles:',
      error
    );

    return defaultRoles;
  }
}

/**
 * Guarda roles.
 */
export function saveRoles(
  roles: Role[]
): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(
      ROLES_STORAGE_KEY,
      JSON.stringify(roles)
    );
  } catch (error) {
    console.error(
      'Error guardando roles:',
      error
    );
  }
}

/**
 * Obtiene usuarios.
 */
export function getUsers(): User[] {
  if (typeof window === 'undefined') {
    return defaultUsers;
  }

  try {
    const stored = localStorage.getItem(
      USERS_STORAGE_KEY
    );

    if (!stored) {
      localStorage.setItem(
        USERS_STORAGE_KEY,
        JSON.stringify(defaultUsers)
      );

      return defaultUsers;
    }

    const parsed = JSON.parse(stored);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return defaultUsers;
  } catch (error) {
    console.error(
      'Error leyendo usuarios:',
      error
    );

    return defaultUsers;
  }
}

/**
 * Guarda usuarios.
 */
export function saveUsers(
  users: User[]
): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(
      USERS_STORAGE_KEY,
      JSON.stringify(users)
    );
  } catch (error) {
    console.error(
      'Error guardando usuarios:',
      error
    );
  }
}

/**
 * Busca un rol por ID.
 */
export function getRoleById(
  roleId: string
): Role | undefined {
  return getRoles().find(
    (role) => role.id === roleId
  );
}

/**
 * Busca un usuario por username.
 */
export function getUserByUsername(
  username: string
): User | undefined {
  return getUsers().find(
    (user) =>
      user.username.toLowerCase() ===
      username.toLowerCase()
  );
}

/**
 * Verifica si un rol tiene un permiso.
 */
export function hasPermission(
  roleId: string,
  permission: Permission
): boolean {
  const role = getRoleById(roleId);

  if (!role) {
    return false;
  }

  return role.permissions.includes(
    permission
  );
}

/**
 * Verifica permisos de un usuario.
 */
export function userHasPermission(
  username: string,
  permission: Permission
): boolean {
  const user =
    getUserByUsername(username);

  if (!user) {
    return false;
  }

  const roleId =
    user.roleId || user.role;

  return hasPermission(
    roleId,
    permission
  );
}
