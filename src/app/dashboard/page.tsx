'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    }
    getUser();
  }, [router]);

  if (!user) return <p>Loading...</p>;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Welcome, {user.email}</h1>
      <button
        className="mt-4 bg-red-600 text-white px-4 py-2"
        onClick={async () => {
          await supabase.auth.signOut();
          router.push('/login');
        }}
      >
        Sign Out
      </button>
    </main>
  );
}
