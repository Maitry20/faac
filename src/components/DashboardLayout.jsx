"use client";

import React, { useState } from 'react';

export default function DashboardLayout({ sidebarItems, children, onLogout, userBadge, onToggleTheme, theme }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

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

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 12px))', paddingTop: '8px' }}>
        {sidebarItems.map(item => (
          <button
            key={item.label}
            className={`mobile-nav-item ${item.active ? 'active' : ''}`}
            onClick={item.onClick}
            style={{ padding: '8px 4px', minHeight: '48px' }}
          >
            <span style={{ fontSize: '1.4rem', marginBottom: '2px' }}>{item.icon}</span>
            <span style={{ fontSize: '0.75rem' }}>{item.label}</span>
          </button>
        ))}
        <button className="mobile-nav-item" onClick={onLogout} style={{ padding: '8px 4px', minHeight: '48px' }}>
          <span style={{ fontSize: '1.4rem', marginBottom: '2px' }}>🚪</span>
          <span style={{ fontSize: '0.75rem' }}>Logout</span>
        </button>
      </nav>
    </>
  );
}
