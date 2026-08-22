'use client';

import { useState, useEffect, ChangeEvent } from 'react';

const USERS_LIST = [
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

type User = (typeof USERS_LIST)[number];

interface RoleSelectorProps {
  onUserChange?: (user: User) => void;
}

export default function RoleSelector({
  onUserChange,
}: RoleSelectorProps) {
  const [currentUser, setCurrentUser] = useState<User>(USERS_LIST[0]);

  useEffect(() => {
    const savedUser = localStorage.getItem('pos_current_user');

    if (savedUser) {
      try {
        const parsed: User = JSON.parse(savedUser);

        setCurrentUser(parsed);

        if (onUserChange) {
          onUserChange(parsed);
        }
      } catch (error) {
        console.error(
          'Error al recuperar el usuario guardado:',
          error
        );

        localStorage.setItem(
          'pos_current_user',
          JSON.stringify(USERS_LIST[0])
        );

        if (onUserChange) {
          onUserChange(USERS_LIST[0]);
        }
      }
    } else {
      localStorage.setItem(
        'pos_current_user',
        JSON.stringify(USERS_LIST[0])
      );

      if (onUserChange) {
        onUserChange(USERS_LIST[0]);
      }
    }
  }, [onUserChange]);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedId = Number(e.target.value);

    const found = USERS_LIST.find(
      (u) => u.id === selectedId
    );

    if (found) {
      setCurrentUser(found);

      localStorage.setItem(
        'pos_current_user',
        JSON.stringify(found)
      );

      if (onUserChange) {
        onUserChange(found);
      }

      // Recarga para aplicar los permisos inmediatamente
      window.location.reload();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-white shadow-lg">
      
      <div className="flex items-center gap-3">
        
        <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg border border-cyan-500/30">
          {currentUser.name.charAt(0)}
        </div>

        <div>
          <p className="text-sm font-semibold">
            {currentUser.name}
          </p>

          <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 font-mono">
            Rol: {currentUser.role}
          </span>
        </div>

      </div>

      <div className="flex items-center gap-2">
        
        <label className="text-xs text-slate-400 font-medium hidden sm:inline">
          Cambiar Perfil:
        </label>

        <select
          value={currentUser.id}
          onChange={handleChange}
          className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
        >
          {USERS_LIST.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>

      </div>
    </div>
  );
}
