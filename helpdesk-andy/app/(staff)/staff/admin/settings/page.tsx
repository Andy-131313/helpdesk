import { requireRole } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

export default async function AdminSettingsPage() {
  await requireRole('ADMIN');

  const statuses = await prisma.ticketStatus.findMany({
    orderBy: { order: 'asc' },
  });
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  async function createStatus(formData: FormData) {
    'use server';
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return;

    const name = formData.get('name') as string;
    const color = formData.get('color') as string;
    const isClosedState = formData.get('isClosedState') === 'true';

    if (!name) return;

    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const maxOrder = await prisma.ticketStatus.aggregate({
      _max: { order: true },
    });

    await prisma.ticketStatus.create({
      data: {
        name,
        slug,
        color: color || '#6b7280',
        order: (maxOrder._max.order || 0) + 1,
        isSystem: false,
        isClosedState,
      },
    });
    revalidatePath('/staff/admin/settings');
  }

  async function deleteStatus(formData: FormData) {
    'use server';
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return;

    const id = formData.get('id') as string;
    const status = await prisma.ticketStatus.findUnique({ where: { id } });
    if (!status || status.isSystem) return;

    // Check if any tickets use this status
    const count = await prisma.ticket.count({ where: { statusId: id } });
    if (count > 0) return;

    await prisma.ticketStatus.delete({ where: { id } });
    revalidatePath('/staff/admin/settings');
  }

  async function createCategory(formData: FormData) {
    'use server';
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return;

    const name = formData.get('name') as string;
    const color = formData.get('color') as string;

    if (!name) return;

    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    await prisma.category.create({
      data: { name, slug, color: color || '#6b7280' },
    });
    revalidatePath('/staff/admin/settings');
  }

  async function deleteCategory(formData: FormData) {
    'use server';
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return;

    const id = formData.get('id') as string;
    const count = await prisma.ticket.count({ where: { categoryId: id } });
    if (count > 0) return;

    await prisma.category.delete({ where: { id } });
    revalidatePath('/staff/admin/settings');
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">
        Nastavení
      </h1>

      {/* Statuses */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
          Stavy ticketů
        </h2>

        <div className="space-y-2 mb-4">
          {statuses.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {s.name}
                </span>
                {s.isSystem && (
                  <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
                    Systémový
                  </span>
                )}
                {s.isClosedState && (
                  <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
                    Uzavřený
                  </span>
                )}
              </div>
              {!s.isSystem && (
                <form action={deleteStatus}>
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    className="text-xs text-red-600 hover:text-red-500"
                  >
                    Smazat
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>

        <form action={createStatus} className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Název
            </label>
            <input
              name="name"
              required
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
              placeholder="Eskalováno"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Barva
            </label>
            <input
              name="color"
              type="color"
              defaultValue="#6b7280"
              className="h-8 w-14 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer"
            />
          </div>
          <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              name="isClosedState"
              value="true"
              className="rounded"
            />
            Uzavřený stav
          </label>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Přidat stav
          </button>
        </form>
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
          Kategorie
        </h2>

        <div className="space-y-2 mb-4">
          {categories.length === 0 ? (
            <p className="text-sm text-zinc-500 py-2">Zatím žádné kategorie.</p>
          ) : (
            categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {c.name}
                  </span>
                </div>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    className="text-xs text-red-600 hover:text-red-500"
                  >
                    Smazat
                  </button>
                </form>
              </div>
            ))
          )}
        </div>

        <form action={createCategory} className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Název
            </label>
            <input
              name="name"
              required
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
              placeholder="Technická podpora"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Barva
            </label>
            <input
              name="color"
              type="color"
              defaultValue="#6b7280"
              className="h-8 w-14 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Přidat kategorii
          </button>
        </form>
      </section>
    </div>
  );
}
