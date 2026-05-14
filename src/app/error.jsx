"use client";

import React from 'react';

export default function GlobalError({ error, reset }) {
  return (
    <div className="flex-col items-center justify-center text-center p-8 min-h-screen" style={{ background: 'var(--current-bg)' }}>
      <div style={{ fontSize: '4rem', marginBottom: '16px' }}>⚠️</div>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '16px', color: 'var(--current-primary)' }}>
        Oops! Something went wrong
      </h2>
      <p style={{ opacity: 0.7, maxWidth: '500px', margin: '0 auto 32px' }}>
        {error?.message || "An unexpected error occurred while loading this view. Don't worry, your food order state is safe!"}
      </p>
      <button className="primary card" onClick={() => reset()} style={{ padding: '16px 32px', fontSize: '1.2rem' }}>
        Try Again 🔄
      </button>
    </div>
  );
}
