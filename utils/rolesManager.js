// utils/rolesManager.js

// Roles y permisos por defecto iniciales
const DEFAULT_ROLES = [
  { id: 'admin', name: 'Administrador', description: 'Acceso total al sistema', permissions: ['view_pos', 'view_inventory', 'edit_inventory', 'view_reports', 'view_receivable', 'manage_roles'] },
  { id: 'cajero', name: 'Cajero / Operador', description: 'Acceso exclusivo al terminal de caja y cobros', permissions: ['view_pos'] },
  { id: 'almacenista', name: 'Almacenista', description: 'Gestión de inventario y stock', permissions: ['view_inventory', 'edit_inventory'] }
];

const DEFAULT_USERS = [
  { id: 1, name: 'Ana Administradora', username: 'admin', role: 'admin' },
  { id: 2, name: 'Carlos Cajero', username: 'cajero1', role: 'cajero' },
  { id: 3, name: 'Luis Almacenista', username: 'almacen1', role: 'almacenista' },
];

export function getRoles() {
  if (typeof window === 'undefined') return DEFAULT_ROLES;
  const saved = localStorage.getItem('pos_custom_roles');
  return saved ? JSON.parse(saved) : DEFAULT_ROLES;
}

export function saveRoles(roles) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pos_custom_roles', JSON.stringify(roles));
}

getRoles() // Inicializar si no existen
export function getUsers() {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  const saved = localStorage.getItem('pos_custom_users');
  return saved ? JSON.parse(saved) : DEFAULT_USERS;
}

export function saveUsers(users) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pos_custom_users', JSON.stringify(users));
}

export function hasPermission(roleId, permission) {
  const roles = getRoles();
  const role = roles.find(r => r.id === roleId);
  if (!role) return false;
  return role.permissions.includes(permission);
}
