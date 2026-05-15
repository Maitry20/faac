"use client";

import React from 'react';

export const STATUSES = ['Order Received', 'Cooking', 'Cooked', 'Ready to Eat', 'Picked Up'];

export default function StatusStepper({ currentStatus, interactive = false, onStatusClick }) {
  const currentIndex = STATUSES.indexOf(currentStatus);
  const progressPercent = currentIndex === -1 ? 0 : (currentIndex / (STATUSES.length - 1)) * 100;

  const ICONS = ['📥', '👨‍🍳', '✅', '🎉', '🛍️'];

  return (
    <div className="stepper" style={{ flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '40px' }}>
      <div className="step-line-progress" style={{ width: `${progressPercent}%` }}></div>
      {STATUSES.map((status, idx) => {
        const isCompleted = idx < currentIndex;
        const isActive = idx === currentIndex;
        const isClickable = interactive && idx > currentIndex;

        let animClass = '';
        if (isActive && status === 'Cooking') animClass = 'anim-cooking';
        if (isActive && status === 'Ready to Eat') animClass = 'anim-ready';

        return (
          <div 
            key={status} 
            className={`step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (isClickable && onStatusClick) {
                onStatusClick(status);
              }
            }}
            style={{ flexShrink: 0 }}
          >
            <div className={`step-icon ${animClass}`} style={{ display: 'inline-block' }}>{ICONS[idx]}</div>
            <span className="step-label" style={{ whiteSpace: 'normal', textAlign: 'center', width: '65px', fontSize: '0.68rem', lineHeight: '1.1', top: '38px' }}>{status}</span>
          </div>
        );
      })}
    </div>
  );
}
