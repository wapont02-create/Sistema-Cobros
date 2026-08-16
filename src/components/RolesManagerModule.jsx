// components/RolesManagerModule.jsx
'use client';
import { useState, useEffect } from 'react';
import { getRoles, getUsers, saveUsers } from '@/utils/rolesManager';

const ALL_PERMISSIONS = [
  { key: 'view_pos', label: '🛒 Acceso a Caja POS' },
  { key: 'view_inventory', label: '📦 Ver Inventario' },
  { key: 'edit_inventory', label: '✏️ Modificar / Crear Inventario' },
  { key: 'view_receivable', label: '📋 Ver Cuentas por Cobrar' },
  { key: 'view_reports', label: '📊 Ver Reportes y Cierre Z' },
  { key: 'manage_roles', label: '🛡️ Gestionar Roles y Personal' },
];

export default function RolesManagerModule() {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState('cajero');

  useEffect(() => {
    setRoles(getRoles());
    setUsers(getUsers());
  }, []);

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUserName || !newUserUsername) return;

    const newUser = {
      id: Date.now(),
      name: newUserName,
      username: newUserUsername,
      role: newUserRole
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    saveUsers(updatedUsers);

    setNewUserName('');
    setNewUserUsername('');
    alert('¡Personal registrado exitosamente!');
  };

  const handleDeleteUser = (id) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      const updatedUsers = users.filter(u => u.id !== id);
      setUsers(updatedUsers);
      saveUsers(updatedUsers);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Módulo de Configuración de Roles y Personal</h2>
        <p className="text-sm text-slate-400">Define los niveles de acceso corporativo y administra el personal autorizado.</p>
      </div>

      {/* Grid de Roles y sus Permisos actuales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">{role.name}</h3>
              <span className="text-xs uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                {role.id}
              </span>
            </div>
            <p className="text-xs text-slate-400">{role.description}</p>
            
            <div className="border-t border-slate-800 pt-2 space-y-1">
              <p className="text-xs font-semibold text-slate-300">Permisos asignados:</p>
              <ul className="text-xs text-slate-400 space-y-1">
                {role.permissions.map(permKey => {
                  const pObj = ALL_PERMISSIONS.find(p => p.key === permKey);
                  return <li key={permKey}>• {pObj ? pObj.label : permKey}</li>;
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Sección para Registrar Nuevo Personal */}
      <div className="border-t border-slate-800 pt-6 mt-6">
        <h3 className="text-lg font-bold mb-3">Registrar Nuevo Empleado / Usuario</h3>
        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Nombre Completo</label>
            <input 
              type="text" 
              placeholder="Ej. María Gómez"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Usuario (Login)</label>
            <input 
              type="text" 
              placeholder="Ej. mgomez"
              value={newUserUsername}
              onChange={(e) => setNewUserUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Rol Asignado</label>
            <select 
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
              ))}
            </select>
          </div>
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

      {/* Lista de Personal Registrado */}
      <div className="border-t border-slate-800 pt-6">
        <h3 className="text-lg font-bold mb-3">Personal Autorizado en el Sistema</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Usuario</th>
                <th className="p-3">Rol</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-medium text-white">{u.name}</td>
                  <td className="p-3 font-mono text-cyan-400">@{u.username}</td>
                  <td className="p-3 uppercase text-xs font-semibold">
                    <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-red-400 hover:text-red-300 text-xs font-semibold px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
