'use client';

import {
  useEffect,
  useState,
  ChangeEvent,
} from 'react';

import {
  User,
  getUsers,
} from '../utils/rolesManager';

interface RoleSelectorProps {
  onUserChange?: (user: User) => void;
}

export default function RoleSelector({
  onUserChange,
}: RoleSelectorProps) {
  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  useEffect(() => {
    try {
      const users = getUsers();

      const savedUser = localStorage.getItem(
        'pos_current_user'
      );

      if (savedUser) {
        const parsedUser = JSON.parse(
          savedUser
        ) as User;

        const validUser = users.find(
          (user) =>
            user.id === parsedUser.id
        );

        if (validUser) {
          setCurrentUser(validUser);

          if (onUserChange) {
            onUserChange(validUser);
          }

          return;
        }
      }

      const defaultUser =
        users.find(
          (user) => user.role === 'admin'
        ) ||
        users[0];

      if (defaultUser) {
        setCurrentUser(defaultUser);

        localStorage.setItem(
          'pos_current_user',
          JSON.stringify(defaultUser)
        );

        if (onUserChange) {
          onUserChange(defaultUser);
        }
      }
    } catch (error) {
      console.error(
        'Error cargando usuario actual:',
        error
      );
    }
  }, [onUserChange]);

  const handleChange = (
    e: ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedId = Number(
      e.target.value
    );

    const users = getUsers();

    const found = users.find(
      (user) =>
        user.id === selectedId
    );

    if (!found) {
      return;
    }

    setCurrentUser(found);

    localStorage.setItem(
      'pos_current_user',
      JSON.stringify(found)
    );

    if (onUserChange) {
      onUserChange(found);
    }

    window.location.reload();
  };

  if (!currentUser) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-white">
        <span className="text-sm text-slate-400">
          Cargando usuario...
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-white shadow-lg">

      <div className="flex items-center gap-3">

        <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg border border-cyan-500/30">
          {currentUser.name
            .charAt(0)
            .toUpperCase()}
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
          {getUsers().map((user) => (
            <option
              key={user.id}
              value={user.id}
            >
              {user.name} ({user.role})
            </option>
          ))}
        </select>

      </div>

    </div>
  );
}
