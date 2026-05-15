"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAppContext } from '../../context/AppContext';

// Lazy load dashboards to drastically reduce initial bundle size!
const UserDashboard = dynamic(() => import('../../components/UserDashboard'), {
  loading: () => <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner">🍴</div></div>,
});
const StallDashboard = dynamic(() => import('../../components/StallDashboard'), {
  loading: () => <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner">🍴</div></div>,
});
const AdminDashboard = dynamic(() => import('../../components/AdminDashboard'), {
  loading: () => <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner">🍴</div></div>,
});

export default function DashboardPage() {
  const router = useRouter();
  const { session, db, showToast, handleLogout, theme, handleToggleTheme } = useAppContext();

  // Middlewares protects the route now, so we only need a brief fallback state before hydration
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
