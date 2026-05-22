import { requireRole } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

export default async function AdminUsersPage() {
  await requireRole('ADMIN');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { tickets: true } },
    },
  });

  async function changeRole(formData: FormData) {
    'use server';
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return;

    const userId = formData.get('userId') as string;
    const newRole = formData.get('role') as 'CUSTOMER' | 'AGENT' | 'ADMIN';

    // Don't allow changing own role
    if (userId === session.user.id) return;

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    revalidatePath('/staff/admin/users');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
        Správa uživatelů
      </h1>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                Jméno
              </th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                E-mail
              </th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                Role
              </th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                Tickety
              </th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                Registrace
              </th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                Akce
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
              >
                <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                  {user.name || '—'}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : user.role === 'AGENT'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {user._count.tickets}
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {new Date(user.createdAt).toLocaleDateString('cs-CZ')}
                </td>
                <td className="px-4 py-3">
                  <form action={changeRole} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs"
                    >
                      <option value="CUSTOMER">Customer</option>
                      <option value="AGENT">Agent</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded bg-zinc-200 dark:bg-zinc-800 px-2 py-1 text-xs font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700"
                    >
                      Uložit
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
