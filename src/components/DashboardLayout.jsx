"use client";
import React, { useState } from 'react';

export default function DashboardLayout({
  sidebarItems,
  children,
  onLogout,
  userBadge,
  onToggleTheme,
  theme,
  userName = "Nandhini",
  userRole = "Student"
}) {
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
        {/* Desktop Sidebar exactly like in the reference photo */}
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} style={{
          background: 'var(--current-card)',
          borderRight: '1px solid rgba(128, 128, 128, 0.08)'
        }}>
          {/* Sizable Sidebar Toggle aligned on border */}
          <div className="sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? '▶' : '◀'}
          </div>

          {/* Logo Title Section */}
          <div className="sidebar-logo" style={{ marginBottom: '20px' }}>
            <div className="logo-text-wrapper" style={{
              color: 'var(--current-primary)',
              fontSize: '1.65rem',
              lineHeight: '1.25',
              fontFamily: "'Fredoka One', cursive",
              fontWeight: 'bold'
            }}>
              Food at<br/>a Click
            </div>

            {/* Lavender Plate Icon Circle */}
            {!isCollapsed ? (
              <div className="logo-icon-circle" style={{
                background: theme === 'light' ? '#F0ECFC' : '#2D224E',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                marginTop: '12px',
                boxShadow: theme === 'light' ? '0 4px 12px rgba(143, 114, 241, 0.12)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                🍽️
              </div>
            ) : (
              <div className="logo-icon-circle" style={{
                background: theme === 'light' ? '#F0ECFC' : '#2D224E',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                boxShadow: theme === 'light' ? '0 4px 10px rgba(143, 114, 241, 0.12)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                🍽️
              </div>
            )}
          </div>

          {/* Role Pill Badge */}
          <div className="sidebar-badge-container" style={{
            marginBottom: '24px',
            display: 'flex',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            transition: 'all 0.3s ease'
          }}>
            <span style={{
              background: 'var(--current-primary)',
              color: 'white',
              padding: '6px 14px',
              borderRadius: '20px',
              fontWeight: '800',
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 10px rgba(255, 107, 107, 0.2)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: isCollapsed ? '32px' : 'none'
            }}>
              {isCollapsed ? userBadge.split(' ')[0] || '😋' : userBadge}
            </span>
          </div>

          {/* Navigation Items List */}
          <div className="flex-col gap-1" style={{ flex: 1, alignItems: isCollapsed ? 'center' : 'stretch' }}>
            {sidebarItems.map(item => {
              const active = item.active;
              return (
                <div
                  key={item.label}
                  className={`sidebar-item ${active ? 'active' : ''}`}
                  onClick={item.onClick}
                  title={isCollapsed ? item.label : ''}
                  style={{
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    padding: isCollapsed ? '10px 0' : '10px 14px',
                    width: isCollapsed ? '44px' : 'auto',
                    borderRadius: '16px',
                    marginBottom: '4px',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.25s',
                    fontSize: '1.4rem'
                  }} className={isCollapsed ? 'scale-up' : ''}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="sidebar-label" style={{
                      marginLeft: '12px',
                      color: active ? 'var(--current-primary)' : 'var(--current-text)',
                      fontWeight: active ? '900' : '700',
                      fontSize: '0.96rem'
                    }}>{item.label}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Light separator line */}
          <div style={{
            height: '1px',
            background: theme === 'light' ? 'rgba(128, 128, 128, 0.08)' : 'rgba(255, 255, 255, 0.06)',
            margin: '12px 0',
            width: '100%'
          }} />

          {/* Logout button */}
          <div
            className="sidebar-item"
            style={{
              color: 'var(--current-primary)',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              padding: isCollapsed ? '10px 0' : '10px 14px',
              width: isCollapsed ? '44px' : 'auto',
              borderRadius: '16px',
              transition: 'all 0.25s ease'
            }}
            onClick={onLogout}
            title={isCollapsed ? 'Logout' : ''}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              🚪
            </span>
            {!isCollapsed && (
              <span className="sidebar-label" style={{
                marginLeft: '12px',
                fontWeight: '900',
                color: 'var(--current-primary)',
                fontSize: '0.96rem'
              }}>Logout</span>
            )}
          </div>

          {/* Bottom user profile card exactly like in the reference photo */}
          {isCollapsed ? (
            <div style={{
              width: '38px',
              height: '38px',
              background: '#2D2D2D',
              color: '#FFFFFF',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '1rem',
              marginTop: '20px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }} title={userName}>
              {userName.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="sidebar-profile-card" style={{
              display: 'flex',
              alignItems: 'center',
              background: theme === 'light' ? 'rgba(128, 128, 128, 0.05)' : 'rgba(255, 255, 255, 0.03)',
              padding: '10px 14px',
              borderRadius: '24px',
              marginTop: '20px',
              gap: '12px',
              border: '1px solid rgba(128, 128, 128, 0.04)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.01)'
            }}>
              {/* Avatar */}
              <div style={{
                width: '38px',
                height: '38px',
                background: '#2D2D2D',
                color: '#FFFFFF',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '1rem',
                flexShrink: 0
              }}>
                {userName.charAt(0).toUpperCase()}
              </div>

              {/* Dynamic Name and Role info */}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{
                  fontWeight: '800',
                  fontSize: '0.92rem',
                  color: 'var(--current-text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{userName}</span>
                <span style={{
                  fontSize: '0.72rem',
                  color: theme === 'light' ? '#7A7A7A' : '#A0A0A0',
                  fontWeight: '600',
                  marginTop: '1px'
                }}>{userRole}</span>
              </div>

              {/* Dropdown chevron indicator */}
              <div style={{
                marginLeft: 'auto',
                fontSize: '0.62rem',
                color: theme === 'light' ? '#888888' : '#A0A0A0',
                fontWeight: '800',
                opacity: 0.7
              }}>
                ▼
              </div>
            </div>
          )}
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
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '1.4rem' }}>
                {item.icon}
              </span>
              <span style={{ marginLeft: '12px' }}>{item.label}</span>
            </button>
          ))}
          <button
            className="mobile-floating-menu-item"
            onClick={() => {
              setIsMobileNavOpen(false);
              onLogout();
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '1.4rem' }}>
              🚪
            </span>
            <span style={{ marginLeft: '12px', color: 'var(--current-primary)' }}>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
