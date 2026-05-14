"use client";

import React from 'react';

export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div 
          key={t.id} 
          className="toast animate-slide-in" 
          onClick={() => onDismiss && onDismiss(t.id)}
          style={{ 
            borderColor: t.type === 'error' ? '#FF4B4B' : 'var(--current-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            userSelect: 'none'
          }}
          title="Click to dismiss"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{t.type === 'error' ? '❌' : '✨'}</span>
            <span>{t.msg}</span>
          </div>
          <span style={{ fontSize: '0.8rem', opacity: 0.4, fontWeight: 'bold', marginLeft: 'auto' }}>✖</span>
        </div>
      ))}
    </div>
  );
}
