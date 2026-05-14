"use client";

import React from 'react';

export default function NotFound() {
  return (
    <div className="flex-col items-center justify-center text-center p-8 min-h-screen" style={{ background: 'var(--current-bg)' }}>
      <div style={{ fontSize: '5rem', marginBottom: '16px' }}>🍩</div>
      <h2 style={{ fontSize: '3rem', marginBottom: '16px', color: 'var(--current-primary)' }}>
        404 - Page Not Found
      </h2>
      <p style={{ opacity: 0.7, maxWidth: '500px', margin: '0 auto 32px', fontSize: '1.2rem' }}>
        Looks like someone took a bite out of this page! The stall or dish you're looking for doesn't exist.
      </p>
      <button className="primary card" onClick={() => window.location.href = '/'} style={{ padding: '16px 32px', fontSize: '1.2rem' }}>
        Back to Kitchen 🏠
      </button>
    </div>
  );
}
