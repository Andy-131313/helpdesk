import { Navbar } from '@/components/navbar';

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {children}
      </main>
    </>
  );
}
