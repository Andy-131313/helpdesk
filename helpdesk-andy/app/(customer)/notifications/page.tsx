import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Bell, Check } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { Navbar } from '@/components/navbar';

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  async function markAllRead() {
    'use server';
    const s = await auth();
    if (!s?.user) return;
    await prisma.notification.updateMany({
      where: { userId: s.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    revalidatePath('/notifications');
  }

  async function markRead(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    revalidatePath('/notifications');
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifikace
            {unreadCount > 0 && (
              <span className="text-sm font-normal text-zinc-500">
                ({unreadCount} nepřečtených)
              </span>
            )}
          </h1>
          {unreadCount > 0 && (
            <form action={markAllRead}>
              <button
                type="submit"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                Označit vše jako přečtené
              </button>
            </form>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="text-center py-16 text-zinc-500">Žádné notifikace.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-lg border p-4 ${
                  n.readAt
                    ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                    : 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/tickets/${n.ticketId}`}
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-50 hover:text-blue-600"
                  >
                    {n.message}
                  </Link>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {new Date(n.createdAt).toLocaleString('cs-CZ')}
                  </p>
                </div>
                {!n.readAt && (
                  <form action={markRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <button
                      type="submit"
                      className="p-1 text-zinc-400 hover:text-zinc-600"
                      title="Označit jako přečtené"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
