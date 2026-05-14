import React from 'react';

export default function Loading() {
  return (
    <div className="flex-col items-center justify-center min-h-screen text-center p-8">
      <div className="spinner" style={{ fontSize: '4rem', marginBottom: '16px' }}>🍽️</div>
      <h3 style={{ fontSize: '1.5rem', color: 'var(--current-primary)', opacity: 0.8 }}>Whipping up something delicious...</h3>
    </div>
  );
}
