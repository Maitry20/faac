"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import AuthView from '../../../components/AuthView';
import { useAppContext } from '../../../context/AppContext';

export default function AuthPage() {
  const params = useParams();
  const router = useRouter();
  const { db, showToast, handleAdminLogin, setSession, theme, handleToggleTheme } = useAppContext();

  const role = params?.role || 'user';

  return (
    <AuthView 
      role={role}
      onBack={() => router.push('/')}
      db={db}
      showToast={showToast}
      handleAdminLogin={(email, pwd) => {
        const success = handleAdminLogin(email, pwd);
        if (success) {
          router.push('/dashboard');
        }
      }}
      setSession={(sess) => {
        setSession(sess);
        router.push('/dashboard');
      }}
      onToggleTheme={handleToggleTheme}
      theme={theme}
    />
  );
}
