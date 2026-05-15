"use client";

import React from 'react';

export const STATUSES = ['Order Received', 'Cooking', 'Cooked', 'Ready to Eat', 'Picked Up'];

export default function StatusStepper({ currentStatus, interactive = false, onStatusClick }) {
  const currentIndex = STATUSES.indexOf(currentStatus);
  const progressPercent = currentIndex === -1 ? 0 : (currentIndex / (STATUSES.length - 1)) * 100;

  const ICONS = ['📥', '👨‍🍳', '✅', '🎉', '🛍️'];

  return (
    <div className="stepper hide-scrollbar" style={{ 
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'nowrap', 
      overflowX: 'visible', 
      padding: '20px 10px 50px 10px',
      width: '100%',
      position: 'relative'
    }}>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .stepper { scroll-behavior: smooth; }
        .step-icon {
          width: 38px;
          height: 38px;
          display: flex !important;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 1.2rem;
          background: #eee;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }
        .step.active .step-icon {
          background: #fff;
          border-color: var(--current-primary);
          box-shadow: 0 0 15px rgba(255, 77, 77, 0.3);
        }
        .step.completed .step-icon {
          background: var(--current-primary);
          color: white;
        }
        .step-line, .step-line-progress {
          position: absolute;
          left: 5%;
          right: 5%;
          height: 3px;
          background: #eee;
          top: 39px;
          z-index: 1;
        }
        .step-line-progress {
          background: var(--current-primary);
          z-index: 2;
          transition: width 0.8s ease;
        }
      `}</style>
      
      <div className="step-line"></div>
      <div className="step-line-progress" style={{ width: `calc(${progressPercent}% * 0.9)` }}></div>
      
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
            style={{ 
              flexShrink: 0, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              position: 'relative',
              zIndex: 3
            }}
          >
            <div className={`step-icon ${animClass}`}>{ICONS[idx]}</div>
            <span className="step-label" style={{ 
              position: 'absolute',
              top: '45px',
              whiteSpace: 'nowrap', 
              textAlign: 'center', 
              fontSize: '0.7rem', 
              lineHeight: '1.2', 
              fontWeight: isActive ? '800' : '500',
              color: isActive ? 'var(--current-primary)' : 'rgba(0,0,0,0.5)',
              opacity: isActive || isCompleted ? 1 : 0.6
            }}>
              {status === 'Ready to Eat' ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>Ready to</span>
                  <span>Eat</span>
                </div>
              ) : status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
