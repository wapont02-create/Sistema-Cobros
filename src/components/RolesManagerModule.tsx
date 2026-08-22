'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  getRoles,
  getUsers,
  saveUsers,
} from '../utils/rolesManager';

/* =========================================================
   TIPOS
========================================================= */

interface Permission {
  key: string;
  label: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface User {
  id: number | string;
  name: string;
  username: string;
  role: string;
}

/* =========================================================
   PERMISOS DISPONIBLES
========================================================= */

const ALL_PERMISSIONS: Permission[] = [
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

/* =========================================================
   COMPONENTE
========================================================= */

export default function RolesManagerModule() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserUsername, setNewUserUsername] =
    useState<string>('');
  const [newUserRole, setNewUserRole] =
    useState<string>('cajero');

  const [loading, setLoading] = useState<boolean>(true);

  /* =======================================================
     CARGAR ROLES Y USUARIOS
  ======================================================= */

  useEffect(() => {
    try {
      const loadedRoles = getRoles();
      const loadedUsers = getUsers();

      setRoles(
        Array.isArray(loadedRoles)
          ? (loadedRoles as Role[])
          : []
      );

      setUsers(
        Array.isArray(loadedUsers)
          ? (loadedUsers as User[])
          : []
      );
    } catch (error) {
      console.error(
        'Error al cargar roles y usuarios:',
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* =======================================================
     AGREGAR USUARIO
  ======================================================= */

  const handleAddUser = (
    e: FormEvent<HTMLFormElement>
  ): void => {
    e.preventDefault();

    const name = newUserName.trim();
    const username = newUserUsername.trim();

    if (!name || !username) {
      alert(
        'Por favor, completa el nombre y el usuario.'
      );
      return;
    }

    /* Evitar usuarios duplicados */

    const usernameExists = users.some(
      (user) =>
        user.username.toLowerCase() ===
        username.toLowerCase()
    );

    if (usernameExists) {
      alert(
        'Ya existe un usuario con ese nombre de acceso.'
      );
      return;
    }

    /* Crear nuevo usuario */

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

    /* Limpiar formulario */

    setNewUserName('');
    setNewUserUsername('');

    if (roles.length > 0) {
      setNewUserRole(roles[0].id);
    }

    alert(
      '¡Personal registrado exitosamente!'
    );
  };

  /* =======================================================
     ELIMINAR USUARIO
  ======================================================= */

  const handleDeleteUser = (
    id: number | string
  ): void => {
    const user = users.find(
      (u) => u.id === id
    );

    if (!user) {
      return;
    }

    /*
     * Evitar eliminar al administrador principal
     */

    if (
      user.username === 'admin' ||
      user.id === 1
    ) {
      alert(
        'El administrador principal no puede ser eliminado.'
      );
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de eliminar a ${user.name}?`
    );

    if (!confirmed) {
      return;
    }

    const updatedUsers = users.filter(
      (u) => u.id !== id
    );

    setUsers(updatedUsers);
    saveUsers(updatedUsers);
  };

  /* =======================================================
     CARGANDO
  ======================================================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-400">
          Cargando configuración...
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6">

      {/* ===================================================
          ENCABEZADO
      =================================================== */}

      <div>
        <h2 className="text-xl font-bold mb-1 text-white">
          Módulo de Configuración de Roles y Personal
        </h2>

        <p className="text-sm text-slate-400">
          Define los niveles de acceso corporativo y
          administra el personal autorizado.
        </p>
      </div>

      {/* ===================================================
          ROLES Y PERMISOS
      =================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {roles.length === 0 ? (
          <div className="md:col-span-3 bg-slate-950/60 border border-slate-800 p-6 rounded-xl text-center">
            <p className="text-sm text-slate-400">
              No hay roles configurados.
            </p>
          </div>
        ) : (
          roles.map((role) => (
            <div
              key={role.id}
              className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3"
            >

              {/* CABECERA DEL ROL */}

              <div className="flex justify-between items-center gap-3">

                <h3 className="font-bold text-white text-base">
                  {role.name}
                </h3>

                <span className="text-xs uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                  {role.id}
                </span>

              </div>

              {/* DESCRIPCIÓN */}

              <p className="text-xs text-slate-400">
                {role.description}
              </p>

              {/* PERMISOS */}

              <div className="border-t border-slate-800 pt-2 space-y-1">

                <p className="text-xs font-semibold text-slate-300">
                  Permisos asignados:
                </p>

                {role.permissions &&
                role.permissions.length > 0 ? (
                  <ul className="text-xs text-slate-400 space-y-1">

                    {role.permissions.map(
                      (permKey: string) => {
                        const permission =
                          ALL_PERMISSIONS.find(
                            (permissionItem) =>
                              permissionItem.key ===
                              permKey
                          );

                        return (
                          <li
                            key={permKey}
                          >
                            •{' '}
                            {permission
                              ? permission.label
                              : permKey}
                          </li>
                        );
                      }
                    )}

                  </ul>
                ) : (
                  <p className="text-xs text-slate-600">
                    Sin permisos asignados.
                  </p>
                )}

              </div>

            </div>
          ))
        )}

      </div>

      {/* ===================================================
          REGISTRAR NUEVO PERSONAL
      =================================================== */}

      <div className="border-t border-slate-800 pt-6 mt-6">

        <h3 className="text-lg font-bold mb-3 text-white">
          Registrar Nuevo Empleado / Usuario
        </h3>

        <form
          onSubmit={handleAddUser}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800"
        >

          {/* NOMBRE */}

          <div>

            <label className="text-xs text-slate-400 block mb-1">
              Nombre Completo
            </label>

            <input
              type="text"
              placeholder="Ej. María Gómez"
              value={newUserName}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement>
              ) =>
                setNewUserName(e.target.value)
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              required
            />

          </div>

          {/* USUARIO */}

          <div>

            <label className="text-xs text-slate-400 block mb-1">
              Usuario (Login)
            </label>

            <input
              type="text"
              placeholder="Ej. mgomez"
              value={newUserUsername}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement>
              ) =>
                setNewUserUsername(e.target.value)
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              required
            />

          </div>

          {/* ROL */}

          <div>

            <label className="text-xs text-slate-400 block mb-1">
              Rol Asignado
            </label>

            <select
              value={newUserRole}
              onChange={(
                e: React.ChangeEvent<HTMLSelectElement>
              ) =>
                setNewUserRole(
                  e.target.value
                )
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            >

              {roles.map((role) => (
                <option
                  key={role.id}
                  value={role.id}
                >
                  {role.name} ({role.id})
                </option>
              ))}

            </select>

          </div>

          {/* BOTÓN */}

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

      {/* ===================================================
          LISTA DE PERSONAL
      =================================================== */}

      <div className="border-t border-slate-800 pt-6">

        <h3 className="text-lg font-bold mb-3 text-white">
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
                    className="p-8 text-center text-slate-500"
                  >
                    No hay personal registrado.
                  </td>

                </tr>

              ) : (

                users.map((user) => (

                  <tr
                    key={user.id}
                    className="hover:bg-slate-800/40"
                  >

                    {/* NOMBRE */}

                    <td className="p-3 font-medium text-white">
                      {user.name}
                    </td>

                    {/* USUARIO */}

                    <td className="p-3 font-mono text-cyan-400">
                      @{user.username}
                    </td>

                    {/* ROL */}

                    <td className="p-3 uppercase text-xs font-semibold">

                      <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200">
                        {user.role}
                      </span>

                    </td>

                    {/* ACCIONES */}

                    <td className="p-3 text-right">

                      {user.username === 'admin' ||
                      user.id === 1 ? (

                        <span className="text-xs text-slate-600">
                          Administrador principal
                        </span>

                      ) : (

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

                      )}

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
