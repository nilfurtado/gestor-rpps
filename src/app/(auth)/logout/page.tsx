'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function LogoutPage() {
  useEffect(() => {
    signOut({
      redirect: true,
      callbackUrl: '/login',
    });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Saindo...</h1>
        <p className="text-gray-600">Redirecionando para login...</p>
      </div>
    </div>
  );
}
