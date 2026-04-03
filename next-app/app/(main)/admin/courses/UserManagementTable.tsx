"use client";

import { useState, useEffect, useCallback } from "react";

type UserRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "new_hire", label: "New Hire" },
  { value: "employee", label: "Employee" },
] as const;

export function UserManagementTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data?.error ?? "Failed to load users");
      }
      const data = (await res.json()) as UserRow[];
      setUsers(data);
      setEditingRole({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const getDisplayRole = (userId: string) =>
    editingRole[userId] ?? users.find((u) => u.id === userId)?.role ?? "";

  const isDirty = (userId: string) => {
    const original = users.find((u) => u.id === userId)?.role ?? "";
    return getDisplayRole(userId) !== original;
  };

  const handleRoleChange = (userId: string, value: string) => {
    setEditingRole((prev) => ({ ...prev, [userId]: value }));
  };

  const handleSave = async (userId: string) => {
    const role = getDisplayRole(userId);
    if (!role || !isDirty(userId)) return;
    setSavingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data?.error ?? "Failed to update role");
      }
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-8 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Loading users…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-4">
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-zinc-500">No users yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <th className="px-4 py-2">First Name</th>
            <th className="px-4 py-2">Last Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Role</th>
            <th className="px-4 py-2 w-24" />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-zinc-100 hover:bg-zinc-50/80"
            >
              <td className="px-4 py-2 text-zinc-900">
                {user.firstName ?? "—"}
              </td>
              <td className="px-4 py-2 text-zinc-900">
                {user.lastName ?? "—"}
              </td>
              <td className="px-4 py-2 text-zinc-900">{user.email}</td>
              <td className="px-4 py-2">
                <select
                  value={getDisplayRole(user.id)}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  aria-label={`Role for ${user.email}`}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-2">
                {isDirty(user.id) && (
                  <button
                    type="button"
                    onClick={() => handleSave(user.id)}
                    disabled={savingId === user.id}
                    className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {savingId === user.id ? "Saving…" : "Save"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
