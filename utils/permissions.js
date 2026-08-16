// utils/permissions.js
const PERMISSIONS = {
  admin: ['view_pos', 'view_inventory', 'edit_inventory', 'view_reports', 'view_receivable', 'manage_roles'],
  cajero: ['view_pos'],
  almacenista: ['view_inventory', 'edit_inventory']
};

export function hasPermission(role, permission) {
  const allowedPermissions = PERMISSIONS[role] || [];
  return allowedPermissions.includes(permission);
}
