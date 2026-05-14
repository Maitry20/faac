"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import LandingView from '../components/LandingView';
import { useAppContext } from '../context/AppContext';

export default function HomePage() {
  const router = useRouter();
  const { theme, handleToggleTheme } = useAppContext();

  return (
    <LandingView 
      onSelectRole={(role) => router.push(`/auth/${role}`)}
      onToggleTheme={handleToggleTheme}
      theme={theme}
    />
  );
}
