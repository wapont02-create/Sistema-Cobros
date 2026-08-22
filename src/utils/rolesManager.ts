'use client';

// ==========================================
// TIPOS
// ==========================================

export type Permission =
  | 'view_pos'
  | 'view_inventory'
  | 'edit_inventory'
  | 'view_reports'
  | 'view_receivable'
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

// ==========================================
// ROLES POR DEFECTO
// ==========================================

const DEFAULT_ROLES: Role[] = [
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
    permissions: [
      'view_pos',
    ],
  },

  {
    id: 'almacenista',
    name: 'Almacenista',
    description:
      'Gestión de inventario y stock',
    permissions: [
      'view_inventory',
      'edit_inventory',
    ],
  },
];

// ==========================================
// USUARIOS POR DEFECTO
// ==========================================

const DEFAULT_USERS: User[] = [
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

// ==========================================
// UTILIDAD
// ==========================================

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// ==========================================
// ROLES
// ==========================================

export function getRoles(): Role[] {
  if (!isBrowser()) {
    return DEFAULT_ROLES;
  }

  try {
    const saved = localStorage.getItem(
      'pos_custom_roles'
    );

    if (!saved) {
      localStorage.setItem(
        'pos_custom_roles',
        JSON.stringify(DEFAULT_ROLES)
      );

      return DEFAULT_ROLES;
    }

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return DEFAULT_ROLES;
    }

    return parsed as Role[];
  } catch (error) {
    console.error(
      'Error al cargar los roles:',
      error
    );

    return DEFAULT_ROLES;
  }
}

// ==========================================
// GUARDAR ROLES
// ==========================================

export function saveRoles(
  roles: Role[]
): void {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.setItem(
      'pos_custom_roles',
      JSON.stringify(roles)
    );
  } catch (error) {
    console.error(
      'Error al guardar los roles:',
      error
    );
  }
}

// ==========================================
// USUARIOS
// ==========================================

export function getUsers(): User[] {
  if (!isBrowser()) {
    return DEFAULT_USERS;
  }

  try {
    const saved = localStorage.getItem(
      'pos_custom_users'
    );

    if (!saved) {
      localStorage.setItem(
        'pos_custom_users',
        JSON.stringify(DEFAULT_USERS)
      );

      return DEFAULT_USERS;
    }

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return DEFAULT_USERS;
    }

    return parsed as User[];
  } catch (error) {
    console.error(
      'Error al cargar los usuarios:',
      error
    );

    return DEFAULT_USERS;
  }
}

// ==========================================
// GUARDAR USUARIOS
// ==========================================

export function saveUsers(
  users: User[]
): void {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.setItem(
      'pos_custom_users',
      JSON.stringify(users)
    );
  } catch (error) {
    console.error(
      'Error al guardar los usuarios:',
      error
    );
  }
}

// ==========================================
// BUSCAR ROL
// ==========================================

export function getRoleById(
  roleId: string
): Role | undefined {
  const roles = getRoles();

  return roles.find(
    (role: Role) => role.id === roleId
  );
}

// ==========================================
// BUSCAR USUARIO
// ==========================================

export function getUserById(
  userId: number
): User | undefined {
  const users = getUsers();

  return users.find(
    (user: User) => user.id === userId
  );
}

// ==========================================
// BUSCAR USUARIO POR USERNAME
// ==========================================

export function getUserByUsername(
  username: string
): User | undefined {
  const users = getUsers();

  return users.find(
    (user: User) =>
      user.username.toLowerCase() ===
      username.toLowerCase()
  );
}

// ==========================================
// VERIFICAR PERMISO
// ==========================================

export function hasPermission(
  roleId: string,
  permission: Permission
): boolean {
  const roles = getRoles();

  const role = roles.find(
    (r: Role) => r.id === roleId
  );

  if (!role) {
    return false;
  }

  return role.permissions.includes(permission);
}

// ==========================================
// VERIFICAR PERMISO DE USUARIO
// ==========================================

export function userHasPermission(
  user: User,
  permission: Permission
): boolean {
  return hasPermission(
    user.role,
    permission
  );
}

// ==========================================
// AGREGAR USUARIO
// ==========================================

export function addUser(
  user: User
): User[] {
  const users = getUsers();

  const exists = users.some(
    (existingUser: User) =>
      existingUser.username.toLowerCase() ===
      user.username.toLowerCase()
  );

  if (exists) {
    return users;
  }

  const updatedUsers = [
    ...users,
    user,
  ];

  saveUsers(updatedUsers);

  return updatedUsers;
}

// ==========================================
// ACTUALIZAR USUARIO
// ==========================================

export function updateUser(
  user: User
): User[] {
  const users = getUsers();

  const updatedUsers = users.map(
    (existingUser: User) =>
      existingUser.id === user.id
        ? user
        : existingUser
  );

  saveUsers(updatedUsers);

  return updatedUsers;
}

// ==========================================
// ELIMINAR USUARIO
// ==========================================

export function deleteUser(
  userId: number
): User[] {
  const users = getUsers();

  const updatedUsers = users.filter(
    (user: User) =>
      user.id !== userId
  );

  saveUsers(updatedUsers);

  return updatedUsers;
}

// ==========================================
// AGREGAR ROL
// ==========================================

export function addRole(
  role: Role
): Role[] {
  const roles = getRoles();

  const exists = roles.some(
    (existingRole: Role) =>
      existingRole.id === role.id
  );

  if (exists) {
    return roles;
  }

  const updatedRoles = [
    ...roles,
    role,
  ];

  saveRoles(updatedRoles);

  return updatedRoles;
}

// ==========================================
// ACTUALIZAR ROL
// ==========================================

export function updateRole(
  role: Role
): Role[] {
  const roles = getRoles();

  const updatedRoles = roles.map(
    (existingRole: Role) =>
      existingRole.id === role.id
        ? role
        : existingRole
  );

  saveRoles(updatedRoles);

  return updatedRoles;
}

// ==========================================
// ELIMINAR ROL
// ==========================================

export function deleteRole(
  roleId: string
): Role[] {
  const roles = getRoles();

  const updatedRoles = roles.filter(
    (role: Role) =>
      role.id !== roleId
  );

  saveRoles(updatedRoles);

  return updatedRoles;
}

// ==========================================
// RESTABLECER ROLES
// ==========================================

export function resetRoles(): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(
    'pos_custom_roles',
    JSON.stringify(DEFAULT_ROLES)
  );
}

// ==========================================
// RESTABLECER USUARIOS
// ==========================================

export function resetUsers(): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(
    'pos_custom_users',
    JSON.stringify(DEFAULT_USERS)
  );
}
