import { auth, signOut } from '@/lib/auth';
import Link from 'next/link';
import {
  Bell,
  LogOut,
  Ticket,
  LayoutDashboard,
  Users,
  Settings,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { isStaff } from '@/lib/permissions';

export async function Navbar() {
  const session = await auth();
  if (!session?.user) return null;

  const { user } = session;
  const staff = isStaff(user.role);

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-lg font-bold text-zinc-900 dark:text-zinc-50"
            >
              Helpdesk
            </Link>
            <nav className="hidden sm:flex items-center gap-4 text-sm">
              {staff ? (
                <>
                  <Link
                    href="/staff/tickets"
                    className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    <Ticket className="h-4 w-4" />
                    Tickety
                  </Link>
                  <Link
                    href="/tickets/new"
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    + Nový požadavek
                  </Link>
                  <Link
                    href="/staff/dashboard"
                    className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  {user.role === 'ADMIN' && (
                    <>
                      <Link
                        href="/staff/admin/users"
                        className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
                        <Users className="h-4 w-4" />
                        Uživatelé
                      </Link>
                      <Link
                        href="/staff/admin/settings"
                        className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
                        <Settings className="h-4 w-4" />
                        Nastavení
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/tickets"
                    className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    <Ticket className="h-4 w-4" />
                    Moje tickety
                  </Link>
                  <Link
                    href="/tickets/new"
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    + Nový požadavek
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right: Notifications + User */}
          <div className="flex items-center gap-3">
            <Link
              href="/notifications"
              className="relative p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            <div className="flex items-center gap-2 text-sm">
              <span className="hidden sm:inline text-zinc-600 dark:text-zinc-400">
                {user.name || user.email}
              </span>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {user.role}
              </span>
            </div>

            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button
                type="submit"
                className="p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                title="Odhlásit se"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
