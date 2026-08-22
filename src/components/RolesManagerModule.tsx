'use client';

import {
  useState,
  useEffect,
  type FormEvent,
  type ChangeEvent,
} from 'react';

import {
  getRoles,
  getUsers,
  saveUsers,
  type Role,
  type User,
  type Permission,
} from '../utils/rolesManager';

// ==========================================
// PERMISOS DISPONIBLES
// ==========================================

const ALL_PERMISSIONS: {
  key: Permission;
  label: string;
}[] = [
  {
    key: 'view_pos',
    label: '🛒 Acceso a Caja POS',
  },
  {
    key: 'view_inventory',
    label: '📦 Ver Inventario',
  },
  {
    key: 'edit_inventory',
    label: '✏️ Modificar / Crear Inventario',
  },
  {
    key: 'view_receivable',
    label: '📋 Ver Cuentas por Cobrar',
  },
  {
    key: 'view_reports',
    label: '📊 Ver Reportes y Cierre Z',
  },
  {
    key: 'manage_roles',
    label: '🛡️ Gestionar Roles y Personal',
  },
];

// ==========================================
// COMPONENTE
// ==========================================

export default function RolesManagerModule() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [newUserName, setNewUserName] =
    useState<string>('');

  const [newUserUsername, setNewUserUsername] =
    useState<string>('');

  const [newUserRole, setNewUserRole] =
    useState<string>('cajero');

  // ========================================
  // CARGAR DATOS
  // ========================================

  useEffect(() => {
    const loadedRoles = getRoles();
    const loadedUsers = getUsers();

    setRoles(loadedRoles);
    setUsers(loadedUsers);

    // Si existe el rol cajero lo seleccionamos.
    if (loadedRoles.length > 0) {
      const cajeroExists = loadedRoles.some(
        (role: Role) => role.id === 'cajero'
      );

      if (!cajeroExists) {
        setNewUserRole(loadedRoles[0].id);
      }
    }
  }, []);

  // ========================================
  // AGREGAR USUARIO
  // ========================================

  const handleAddUser = (
    e: FormEvent<HTMLFormElement>
  ): void => {
    e.preventDefault();

    const name = newUserName.trim();
    const username = newUserUsername.trim();

    if (!name || !username) {
      alert(
        'Por favor completa el nombre y el usuario.'
      );
      return;
    }

    // Verificar usuario duplicado
    const usernameExists = users.some(
      (user: User) =>
        user.username.toLowerCase() ===
        username.toLowerCase()
    );

    if (usernameExists) {
      alert(
        'Ya existe un usuario con ese nombre de acceso.'
      );
      return;
    }

    // Verificar que el rol exista
    const roleExists = roles.some(
      (role: Role) =>
        role.id === newUserRole
    );

    if (!roleExists) {
      alert(
        'El rol seleccionado no existe.'
      );
      return;
    }

    // ======================================
    // NUEVO USUARIO
    // ======================================

    const newUser: User = {
      id: Date.now(),
      name,
      username,
      role: newUserRole,
    };

    const updatedUsers: User[] = [
      ...users,
      newUser,
    ];

    setUsers(updatedUsers);

    saveUsers(updatedUsers);

    // Limpiar formulario
    setNewUserName('');
    setNewUserUsername('');

    alert(
      '¡Personal registrado exitosamente!'
    );
  };

  // ========================================
  // ELIMINAR USUARIO
  // ========================================

  const handleDeleteUser = (
    id: number
  ): void => {
    const user = users.find(
      (u: User) => u.id === id
    );

    if (!user) {
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de eliminar al usuario "${user.name}"?`
    );

    if (!confirmed) {
      return;
    }

    const updatedUsers: User[] =
      users.filter(
        (u: User) => u.id !== id
      );

    setUsers(updatedUsers);

    saveUsers(updatedUsers);
  };

  // ========================================
  // CAMBIAR ROL
  // ========================================

  const handleRoleChange = (
    e: ChangeEvent<HTMLSelectElement>
  ): void => {
    setNewUserRole(e.target.value);
  };

  // ========================================
  // CAMBIAR NOMBRE
  // ========================================

  const handleNameChange = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    setNewUserName(e.target.value);
  };

  // ========================================
  // CAMBIAR USERNAME
  // ========================================

  const handleUsernameChange = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    setNewUserUsername(e.target.value);
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-6">

      {/* ====================================
          ENCABEZADO
      ==================================== */}

      <div>
        <h2 className="text-xl font-bold mb-1">
          Módulo de Configuración de Roles y
          Personal
        </h2>

        <p className="text-sm text-slate-400">
          Define los niveles de acceso corporativo
          y administra el personal autorizado.
        </p>
      </div>

      {/* ====================================
          ROLES Y PERMISOS
      ==================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {roles.length === 0 ? (
          <div className="md:col-span-3 bg-slate-950/60 border border-slate-800 p-6 rounded-xl text-center">
            <p className="text-sm text-slate-400">
              No hay roles configurados.
            </p>
          </div>
        ) : (
          roles.map((role: Role) => (
            <div
              key={role.id}
              className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3"
            >

              {/* Nombre del rol */}

              <div className="flex justify-between items-center">

                <h3 className="font-bold text-white text-base">
                  {role.name}
                </h3>

                <span className="text-xs uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                  {role.id}
                </span>

              </div>

              {/* Descripción */}

              <p className="text-xs text-slate-400">
                {role.description}
              </p>

              {/* Permisos */}

              <div className="border-t border-slate-800 pt-2 space-y-1">

                <p className="text-xs font-semibold text-slate-300">
                  Permisos asignados:
                </p>

                <ul className="text-xs text-slate-400 space-y-1">

                  {role.permissions.map(
                    (permission: Permission) => {

                      const permissionObject =
                        ALL_PERMISSIONS.find(
                          (permissionItem) =>
                            permissionItem.key ===
                            permission
                        );

                      return (
                        <li
                          key={permission}
                        >
                          •{' '}
                          {permissionObject
                            ? permissionObject.label
                            : permission}
                        </li>
                      );
                    }
                  )}

                </ul>

              </div>

            </div>
          ))
        )}

      </div>

      {/* ====================================
          REGISTRAR PERSONAL
      ==================================== */}

      <div className="border-t border-slate-800 pt-6 mt-6">

        <h3 className="text-lg font-bold mb-3">
          Registrar Nuevo Empleado / Usuario
        </h3>

        <form
          onSubmit={handleAddUser}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800"
        >

          {/* Nombre */}

          <div>

            <label className="text-xs text-slate-400 block mb-1">
              Nombre Completo
            </label>

            <input
              type="text"
              placeholder="Ej. María Gómez"
              value={newUserName}
              onChange={handleNameChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              required
            />

          </div>

          {/* Usuario */}

          <div>

            <label className="text-xs text-slate-400 block mb-1">
              Usuario (Login)
            </label>

            <input
              type="text"
              placeholder="Ej. mgomez"
              value={newUserUsername}
              onChange={handleUsernameChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              required
            />

          </div>

          {/* Rol */}

          <div>

            <label className="text-xs text-slate-400 block mb-1">
              Rol Asignado
            </label>

            <select
              value={newUserRole}
              onChange={handleRoleChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            >

              {roles.map((role: Role) => (
                <option
                  key={role.id}
                  value={role.id}
                >
                  {role.name} ({role.id})
                </option>
              ))}

            </select>

          </div>

          {/* Botón */}

          <div className="flex items-end">

            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 px-4 rounded-lg transition-all text-sm shadow-lg shadow-cyan-500/20"
            >
              + Agregar Personal
            </button>

          </div>

        </form>

      </div>

      {/* ====================================
          PERSONAL REGISTRADO
      ==================================== */}

      <div className="border-t border-slate-800 pt-6">

        <h3 className="text-lg font-bold mb-3">
          Personal Autorizado en el Sistema
        </h3>

        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm text-slate-300">

            <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">

              <tr>

                <th className="p-3">
                  Nombre
                </th>

                <th className="p-3">
                  Usuario
                </th>

                <th className="p-3">
                  Rol
                </th>

                <th className="p-3 text-right">
                  Acciones
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-800">

              {users.length === 0 ? (

                <tr>

                  <td
                    colSpan={4}
                    className="p-6 text-center text-slate-500"
                  >
                    No hay personal registrado.
                  </td>

                </tr>

              ) : (

                users.map((user: User) => (

                  <tr
                    key={user.id}
                    className="hover:bg-slate-800/40"
                  >

                    {/* Nombre */}

                    <td className="p-3 font-medium text-white">
                      {user.name}
                    </td>

                    {/* Usuario */}

                    <td className="p-3 font-mono text-cyan-400">
                      @{user.username}
                    </td>

                    {/* Rol */}

                    <td className="p-3 uppercase text-xs font-semibold">

                      <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200">
                        {user.role}
                      </span>

                    </td>

                    {/* Acciones */}

                    <td className="p-3 text-right">

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteUser(
                            user.id
                          )
                        }
                        className="text-red-400 hover:text-red-300 text-xs font-semibold px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20"
                      >
                        Eliminar
                      </button>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}
