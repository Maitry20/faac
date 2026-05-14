"use client";

import React, { useState } from 'react';

export default function DashboardLayout({ sidebarItems, children, onLogout, userBadge, onToggleTheme, theme }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const themeBtn = (
    <button
      className="theme-toggle card"
      onClick={onToggleTheme}
      style={{ position: 'static', width: 36, height: 36, fontSize: '1rem', boxShadow: 'none' }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="mobile-topbar">
        <h2>Food at a Click 🍽️</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>{userBadge}</span>
          {themeBtn}
        </div>
      </div>

      <div className="app-layout">
        {/* Desktop Sidebar */}
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? '▶' : '◀'}
          </div>

          <div className="sidebar-logo">
            <div className="logo-text-wrapper">
              Food at<br/>a Click
            </div>
            <div className="logo-icon-wrapper">
              🍽️
            </div>
          </div>
          
          <div className="sidebar-badge-container" style={{ marginBottom: '32px' }}>
            <span className="badge" style={{ fontSize: '1rem', padding: '8px 16px' }}>{userBadge}</span>
          </div>

          <div className="flex-col gap-2" style={{ flex: 1, alignItems: isCollapsed ? 'center' : 'stretch' }}>
            {sidebarItems.map(item => (
              <div 
                key={item.label} 
                className={`sidebar-item ${item.active ? 'active' : ''}`} 
                onClick={item.onClick}
                title={isCollapsed ? item.label : ''}
                style={{ 
                  justifyContent: isCollapsed ? 'center' : 'flex-start', 
                  padding: isCollapsed ? '14px 0' : '14px 16px', 
                  width: isCollapsed ? '56px' : 'auto' 
                }}
              >
                <span style={{ fontSize: '1.5rem', transition: 'transform 0.3s' }} className={isCollapsed ? 'scale-up' : ''}>{item.icon}</span> 
                <span className="sidebar-label" style={{ marginLeft: isCollapsed ? '0' : '12px', display: isCollapsed ? 'none' : 'inline' }}>{item.label}</span>
              </div>
            ))}
          </div>

          <div 
            className="sidebar-item" 
            style={{ 
              color: 'var(--current-primary)', 
              marginTop: 'auto', 
              justifyContent: isCollapsed ? 'center' : 'flex-start', 
              padding: isCollapsed ? '14px 0' : '14px 16px', 
              width: isCollapsed ? '56px' : 'auto' 
            }}
            onClick={onLogout}
            title={isCollapsed ? 'Logout' : ''}
          >
            <span style={{ fontSize: '1.5rem' }}>🚪</span> 
            <span className="sidebar-label" style={{ marginLeft: isCollapsed ? '0' : '12px', display: isCollapsed ? 'none' : 'inline' }}>Logout</span>
          </div>
        </div>

        <div className="main-content">
          {children}
        </div>
      </div>

      {/* Mobile Floating Menu Button & Popup */}
      <div className="md:hidden">
        <button 
          className="mobile-floating-menu-btn"
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          title="Toggle Navigation Menu"
        >
          <span style={{ fontSize: '1.6rem' }}>{isMobileNavOpen ? '✕' : '🧭'}</span>
        </button>

        <div className={`mobile-floating-menu ${isMobileNavOpen ? 'open' : ''}`}>
          {sidebarItems.map(item => (
            <button
              key={item.label}
              className={`mobile-floating-menu-item ${item.active ? 'active' : ''}`}
              onClick={() => {
                setIsMobileNavOpen(false);
                item.onClick();
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <button 
            className="mobile-floating-menu-item" 
            onClick={() => {
              setIsMobileNavOpen(false);
              onLogout();
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
