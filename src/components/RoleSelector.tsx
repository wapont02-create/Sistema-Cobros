'use client';

import {
  ChangeEvent,
  useEffect,
  useState,
} from 'react';

import {
  User,
  getUsers,
} from '../utils/rolesManager';

interface RoleSelectorProps {
  selectedId?: string | number;
  onSelect?: (user: User | null) => void;
  value?: string | number;
  onChange?: (user: User | null) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function RoleSelector({
  selectedId,
  onSelect,
  value,
  onChange,
  label = 'Usuario',
  disabled = false,
  className = '',
}: RoleSelectorProps) {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsers = () => {
      const loadedUsers = getUsers();
      setUsers(loadedUsers);
    };

    loadUsers();

    const interval = setInterval(
      loadUsers,
      1000
    );

    return () => clearInterval(interval);
  }, []);

  const currentValue =
    value !== undefined
      ? String(value)
      : selectedId !== undefined
      ? String(selectedId)
      : '';

  const handleChange = (
    e: ChangeEvent<HTMLSelectElement>
  ) => {
    const newId = e.target.value;

    const found = users.find(
      (user) =>
        String(user.id) === String(newId)
    );

    if (onSelect) {
      onSelect(found || null);
    }

    if (onChange) {
      onChange(found || null);
    }
  };

  return (
    <div
      className={`space-y-1 ${className}`}
    >
      <label className="block text-xs font-bold text-slate-600">
        {label}
      </label>

      <select
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 disabled:opacity-50"
      >
        <option value="">
          Seleccionar usuario
        </option>

        {users.map((user) => (
          <option
            key={String(user.id)}
            value={String(user.id)}
          >
            {user.name} (@
            {user.username})
          </option>
        ))}
      </select>
    </div>
  );
}
