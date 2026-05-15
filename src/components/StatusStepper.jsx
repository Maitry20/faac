"use client";

import React from 'react';

export const STATUSES = ['Order Received', 'Cooking', 'Cooked', 'Ready to Eat', 'Picked Up'];

export default function StatusStepper({ currentStatus, onStatusClick }) {
  const currentIdx = STATUSES.indexOf(currentStatus);

  return (
    <div className="stepper-container" style={{ position: 'relative', margin: '30px 0', padding: '0 10px' }}>
      <style>{`
        .status-step-item {
          transition: all 0.3s ease;
        }
        .status-step-item:hover .step-circle {
          transform: translateY(-5px) ${currentIdx !== -1 ? 'scale(1.1)' : 'scale(1.1)'} !important;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
        .status-step-item:hover span {
          color: var(--current-primary) !important;
          opacity: 1 !important;
        }
      `}</style>
      {/* Progress Track Background */}
      <div style={{ 
        position: 'absolute', 
        top: '19px', 
        left: '40px', 
        right: '40px', 
        height: '4px', 
        background: 'rgba(128,128,128,0.1)', 
        zIndex: 0, 
        borderRadius: '2px' 
      }} />
      
      {/* Active Progress Fill */}
      <div style={{ 
        position: 'absolute', 
        top: '19px', 
        left: '40px', 
        width: `${(currentIdx / (STATUSES.length - 1)) * (100 - (80 / 550 * 100))}%`, 
        height: '4px', 
        background: 'var(--current-primary)', 
        zIndex: 1, 
        borderRadius: '2px', 
        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        maxWidth: 'calc(100% - 80px)'
      }} />
      
      <div className="flex justify-between items-center" style={{ position: 'relative', zIndex: 2 }}>
        {STATUSES.map((status, index) => {
          const isActive = index <= currentIdx;
          const isCurrent = index === currentIdx;
          const icons = { 
            'Order Received': '📥', 
            'Cooking': '👨‍🍳', 
            'Cooked': '✅', 
            'Ready to Eat': '🎉', 
            'Picked Up': '🛍️' 
          };
          
          return (
            <div 
              key={status} 
              className="flex-col items-center status-step-item" 
              style={{ 
                flex: 1, 
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onClick={() => onStatusClick && onStatusClick(status)}
            >
              <div 
                className={`step-circle ${isCurrent ? 'current' : ''}`}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: isCurrent ? 'var(--current-primary)' : (isActive ? 'var(--current-primary)' : '#eee'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  color: isActive ? 'white' : 'rgba(0,0,0,0.3)',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  boxShadow: isCurrent ? '0 0 20px rgba(255, 107, 107, 0.4)' : 'none',
                  border: isCurrent ? '3px solid white' : 'none',
                  zIndex: 3,
                  transform: isCurrent ? 'scale(1.15)' : 'scale(1)'
                }}
              >
                {icons[status]}
              </div>
              <span style={{ 
                fontSize: '0.65rem', 
                marginTop: '12px', 
                fontWeight: isCurrent ? '900' : '700',
                color: isCurrent ? 'var(--current-primary)' : 'rgba(0,0,0,0.4)',
                textAlign: 'center',
                maxWidth: '65px',
                lineHeight: 1.2,
                opacity: isActive ? 1 : 0.6
              }}>
                {status === 'Ready to Eat' ? 'Ready to Eat' : status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
