"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserDashboard from '../../components/UserDashboard';
import StallDashboard from '../../components/StallDashboard';
import AdminDashboard from '../../components/AdminDashboard';
import { useAppContext } from '../../context/AppContext';

export default function DashboardPage() {
  const router = useRouter();
  const { session, db, showToast, handleLogout, theme, handleToggleTheme } = useAppContext();

  useEffect(() => {
    if (!session) {
      router.push('/');
    }
  }, [session, router]);

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner">🍴</div>
      </div>
    );
  }

  const onLogoutAction = () => {
    handleLogout();
    router.push('/');
  };

  if (session.role === 'user') {
    return <UserDashboard db={db} session={session} showToast={showToast} onLogout={onLogoutAction} onToggleTheme={handleToggleTheme} theme={theme} />;
  }

  if (session.role === 'stall') {
    return <StallDashboard db={db} session={session} showToast={showToast} onLogout={onLogoutAction} onToggleTheme={handleToggleTheme} theme={theme} />;
  }

  if (session.role === 'admin') {
    return <AdminDashboard db={db} onLogout={onLogoutAction} showToast={showToast} onToggleTheme={handleToggleTheme} theme={theme} />;
  }

  return null;
}
