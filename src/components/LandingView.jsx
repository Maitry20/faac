"use client";

import React from 'react';
import FloatingEmojis from './FloatingEmojis';

export default function LandingView({ onSelectRole, onToggleTheme, theme }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Mobile header with theme toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px' }}>
        <button
          className="theme-toggle card"
          onClick={onToggleTheme}
          style={{ position: 'static', width: 40, height: 40, fontSize: '1rem', boxShadow: 'none' }}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
      <div className="container flex-col items-center justify-center" style={{ flex: 1, textAlign: 'center', paddingBottom: '32px' }}>
        <FloatingEmojis />
        <div className="animated-list" style={{ maxWidth: '500px', width: '100%' }}>
          <h1 className="landing-title" style={{ fontSize: '4rem', marginBottom: '16px', color: 'var(--current-primary)' }}>
            Food at a Click
          </h1>
          <h2 className="landing-subtitle" style={{ opacity: 0.8, marginBottom: '48px', fontSize: '1.2rem' }}>Skip the queue, not the flavor 🍜</h2>
          
          <div className="flex-col gap-4" style={{ alignItems: 'center' }}>
            <button 
              className="primary card shimmer landing-btn" 
              style={{ width: '80%', maxWidth: '350px', fontSize: '1.5rem', padding: '24px' }}
              onClick={() => onSelectRole('user')}
            >
              🍴 Want to Eat
            </button>
            
            <button 
              className="accent card shimmer landing-btn" 
              style={{ width: '80%', maxWidth: '350px', fontSize: '1.5rem', padding: '24px' }}
              onClick={() => onSelectRole('stall')}
            >
              🏪 Want to Serve
            </button>
          </div>

          <button 
            className="ghost" 
            style={{ marginTop: '48px', fontSize: '0.9rem', padding: '8px 16px', border: 'none', opacity: 0.5 }}
            onClick={() => onSelectRole('admin')}
          >
            🤫 Admin Access
          </button>
        </div>
      </div>
    </div>
  );
}
