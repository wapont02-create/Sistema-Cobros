// utils/permissions.js

const PERMISSIONS = {
  admin: [
    'view_pos',            // Usar la caja
    'view_inventory',      // Ver inventario
    'edit_inventory',      // Crear, editar, eliminar productos
    'view_reports',        // Ver reportes y cierre Z
    'view_receivable',     // Cuentas por cobrar (Fiados)
    'manage_roles'         // Gestionar personal
  ],
  cajero: [
    'view_pos'             // Exclusivamente caja y cobros
  ],
  almacenista: [
    'view_inventory',      // Ver inventario
    'edit_inventory'       // Modificar stock y productos
  ]
};

export function hasPermission(role, permission) {
  const allowedPermissions = PERMISSIONS[role] || [];
  return allowedPermissions.includes(permission);
}
