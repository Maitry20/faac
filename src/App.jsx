import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// ==========================================
// AWS INTEGRATION CONFIGURATION
// ==========================================
export const API_URL = "https://3pdy6omb24.execute-api.eu-west-2.amazonaws.com"; // AUTOMATICALLY SET BY DEPLOYMENT SCRIPT

// ==========================================
// 1. GLOBAL STYLES & THEME
// ==========================================
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;800&display=swap');
    
    :root {
      --bg-light: #FFF8F0;
      --primary-light: #FF6B6B;
      --accent-light: #FFD93D;
      --card-light: #FFFFFF;
      --text-light: #2D2D2D;
      
      --bg-dark: #1A1A2E;
      --primary-dark: #FF6B6B;
      --accent-dark: #FFD93D;
      --card-dark: #16213E;
      --text-dark: #E0E0E0;
    }
    
    body {
      margin: 0;
      font-family: 'Nunito', sans-serif;
      transition: background-color 0.3s, color 0.3s;
      min-height: 100vh;
      overflow-x: hidden;
    }
    
    body.light {
      background-color: var(--bg-light);
      color: var(--text-light);
      --current-card: var(--card-light);
      --current-primary: var(--primary-light);
      --current-accent: var(--accent-light);
      --current-bg: var(--bg-light);
    }
    
    body.dark {
      background-color: var(--bg-dark);
      color: var(--text-dark);
      --current-card: var(--card-dark);
      --current-primary: var(--primary-dark);
      --current-accent: var(--accent-dark);
      --current-bg: var(--bg-dark);
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Fredoka One', cursive;
      margin-top: 0;
      letter-spacing: 0.5px;
    }
    
    /* Layout Utilities */
    .app-layout {
      display: flex;
      min-height: 100vh;
      width: 100vw;
    }
    .sidebar {
      width: 250px;
      min-width: 250px;
      background: var(--current-card);
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      border-right: 2px solid rgba(128,128,128,0.05);
      z-index: 100;
      box-shadow: 4px 0 24px rgba(0,0,0,0.02);
    }
    .sidebar-item {
      padding: 14px 16px;
      border-radius: 16px;
      font-weight: 800;
      font-size: 1.1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .sidebar-item:hover {
      background: rgba(128,128,128,0.1);
      transform: translateX(4px);
    }
    .sidebar-item.active {
      background: var(--current-primary);
      color: white;
    }
    .main-content {
      flex: 1;
      padding: 40px;
      height: 100vh;
      overflow-y: auto;
      box-sizing: border-box;
      max-width: 1200px;
      margin: 0 auto;
      min-width: 0;
    }
    .top-banner {
      width: 100%;
      height: 250px;
      object-fit: cover;
      border-radius: 24px;
      margin-bottom: 32px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.08);
      border: 4px solid white;
    }

    /* ── Mobile Nav Bar ── */
    .mobile-topbar {
      display: none;
    }
    .mobile-nav {
      display: none;
    }

    /* ── Mobile breakpoint ── */
    @media (max-width: 768px) {
      .app-layout {
        flex-direction: column;
      }
      .sidebar {
        display: none !important;
      }
      .main-content {
        padding: 16px 16px 90px;
        height: auto;
        min-height: 100vh;
        overflow-y: visible;
        max-width: 100%;
        width: 100%;
      }
      /* Top bar with logo + theme toggle */
      .mobile-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: sticky;
        top: 0;
        z-index: 200;
        background: var(--current-card);
        padding: 12px 16px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      }
      .mobile-topbar h2 {
        font-size: 1.3rem;
        margin: 0;
        color: var(--current-primary);
        line-height: 1;
      }
      /* Bottom nav bar */
      .mobile-nav {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 200;
        background: var(--current-card);
        border-top: 2px solid rgba(128,128,128,0.1);
        box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
        justify-content: space-around;
        align-items: center;
        padding: 6px 0 env(safe-area-inset-bottom, 6px);
      }
      .mobile-nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 8px 12px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 0.68rem;
        font-weight: 800;
        flex: 1;
        transition: all 0.2s;
        border: none;
        background: none;
        color: inherit;
        opacity: 0.6;
      }
      .mobile-nav-item.active {
        color: var(--current-primary);
        opacity: 1;
      }
      .mobile-nav-item span:first-child {
        font-size: 1.4rem;
      }
      /* Landing page responsive */
      .landing-title {
        font-size: 2.6rem !important;
      }
      .landing-subtitle {
        font-size: 1rem !important;
        margin-bottom: 32px !important;
      }
      .landing-btn {
        width: 100% !important;
        max-width: 100% !important;
        font-size: 1.2rem !important;
        padding: 18px !important;
      }
      /* Theme toggle on mobile goes inside topbar, hide fixed one */
      .theme-toggle {
        position: static !important;
        box-shadow: none !important;
        width: 40px !important;
        height: 40px !important;
        font-size: 1rem !important;
      }
      /* Stepper label wrapping */
      .step-label {
        font-size: 0.62rem !important;
        white-space: normal !important;
        text-align: center;
        width: 60px;
        top: 40px !important;
        line-height: 1.2;
      }
      .stepper {
        padding: 0 4px;
        margin: 24px 0 56px;
      }
      /* Toast stays inside viewport */
      .toast-container {
        top: auto !important;
        bottom: 90px;
        right: 12px !important;
        left: 12px;
        align-items: stretch;
      }
      .toast {
        font-size: 0.9rem;
        padding: 12px 16px;
      }
      /* Top banner smaller */
      .top-banner {
        height: 160px !important;
        border-radius: 16px !important;
        margin-bottom: 20px !important;
      }
      /* Cards grid single col on very small */
      .grid-cards {
        grid-template-columns: 1fr !important;
        gap: 16px !important;
      }
      /* Auth card full width */
      .auth-card {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        border-radius: 16px;
      }
      /* floating cart btn above bottom nav */
      .floating-cart-btn {
        bottom: 80px !important;
        right: 16px !important;
        width: 56px !important;
        height: 56px !important;
      }
      /* orders flex wrapping */
      .order-header {
        flex-wrap: wrap;
        gap: 8px;
      }
      /* Admin recent orders flex */
      .admin-order-row {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 4px;
      }
      h2.section-title {
        font-size: 1.6rem !important;
      }
    }

    @media (max-width: 400px) {
      .main-content {
        padding: 12px 10px 90px;
      }
      .landing-title {
        font-size: 2.1rem !important;
      }
      .mobile-nav-item {
        font-size: 0.6rem;
      }
    }

    .card {
      background-color: var(--current-card);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.06);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      position: relative;
    }
    
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 32px rgba(0,0,0,0.12);
    }
    
    .card.dark {
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    }
    
    .card.dark:hover {
      box-shadow: 0 16px 32px rgba(0,0,0,0.5);
    }
    
    button {
      font-family: 'Nunito', sans-serif;
      font-weight: 800;
      font-size: 1rem;
      border: none;
      border-radius: 16px;
      padding: 12px 24px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    button.primary {
      background-color: var(--current-primary);
      color: white;
    }
    
    button.accent {
      background-color: var(--current-accent);
      color: #2D2D2D;
    }

    button.ghost {
      background-color: transparent;
      color: inherit;
      border: 2px solid var(--current-primary);
    }
    
    button:hover:not(:disabled) {
      transform: scale(1.05);
      filter: brightness(1.1);
    }
    
    button:active:not(:disabled) {
      transform: scale(0.95);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    input, select, textarea {
      font-family: 'Nunito', sans-serif;
      font-size: 1rem;
      padding: 14px 16px;
      border-radius: 12px;
      border: 2px solid transparent;
      background-color: rgba(128,128,128,0.1);
      color: inherit;
      width: 100%;
      box-sizing: border-box;
      margin-bottom: 16px;
      transition: border-color 0.2s;
    }
    
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--current-primary);
    }
    
    /* Animations */
    @keyframes floatUp {
      0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
    }
    
    @keyframes fadeInSlide {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .animated-list > * {
      animation: fadeInSlide 0.5s ease forwards;
      opacity: 0;
    }
    .animated-list > *:nth-child(1) { animation-delay: 0.1s; }
    .animated-list > *:nth-child(2) { animation-delay: 0.2s; }
    .animated-list > *:nth-child(3) { animation-delay: 0.3s; }
    .animated-list > *:nth-child(4) { animation-delay: 0.4s; }
    .animated-list > *:nth-child(5) { animation-delay: 0.5s; }
    .animated-list > *:nth-child(n+6) { animation-delay: 0.6s; }
    
    .floating-emojis {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none;
      z-index: -1;
      overflow: hidden;
    }
    
    .floating-emoji {
      position: absolute;
      font-size: 2.5rem;
      animation: floatUp 15s linear infinite;
    }
    
    /* Stepper */
    .stepper {
      display: flex;
      justify-content: space-between;
      position: relative;
      margin: 30px 0 60px;
      padding: 0 10px;
    }
    .stepper::before {
      content: '';
      position: absolute;
      top: 15px; left: 20px; right: 20px;
      height: 4px;
      background: rgba(128,128,128,0.2);
      z-index: 0;
      border-radius: 2px;
    }
    .step-line-progress {
      position: absolute;
      top: 15px; left: 20px;
      height: 4px;
      background: var(--current-primary);
      z-index: 1;
      border-radius: 2px;
      transition: width 0.5s ease;
    }
    .step {
      z-index: 2;
      background: var(--current-card);
      padding: 6px;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      border: 3px solid rgba(128,128,128,0.2);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      position: relative;
    }
    .step-label {
      position: absolute;
      top: 45px;
      white-space: nowrap;
      font-size: 0.8rem;
      font-weight: 600;
      opacity: 0.7;
    }
    .step.active {
      border-color: var(--current-primary);
      box-shadow: 0 0 15px var(--current-primary);
      transform: scale(1.2);
    }
    .step.active .step-label {
      opacity: 1;
      color: var(--current-primary);
      font-weight: 800;
    }
    .step.completed {
      background: var(--current-primary);
      color: white;
      border-color: var(--current-primary);
    }
    .step.completed .step-label {
      opacity: 1;
    }

    .step.clickable {
      cursor: pointer;
    }
    .step.clickable:hover {
      transform: scale(1.3);
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 24px;
    }
    .flex { display: flex; }
    .flex-col { display: flex; flex-direction: column; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .justify-center { justify-content: center; }
    .gap-4 { gap: 16px; }
    .gap-2 { gap: 8px; }
    .grid-cards { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
      gap: 24px; 
    }
    
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .toast {
      background: var(--current-card);
      color: inherit;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      animation: fadeInSlide 0.3s ease;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 12px;
      border-left: 4px solid var(--current-primary);
    }

    .shimmer {
      position: relative;
      overflow: hidden;
    }
    .shimmer::after {
      content: '';
      position: absolute;
      top: 0; left: -100%; width: 50%; height: 100%;
      background: linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent);
      transform: skewX(-20deg);
    }
    .shimmer:hover::after {
      animation: shimmer 1s;
    }
    @keyframes shimmer {
      100% { left: 200%; }
    }

    .badge {
      background: var(--current-primary);
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: bold;
      display: inline-block;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      opacity: 0.7;
    }
    .empty-state h2 {
      font-size: 2rem;
      margin-bottom: 8px;
    }

    /* Modal / Drawer */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeInSlide 0.2s ease;
    }
    .modal-content {
      background: var(--current-card);
      padding: 32px;
      border-radius: 24px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 24px 48px rgba(0,0,0,0.2);
    }
    .cart-drawer {
      position: fixed;
      top: 0; right: 0; bottom: 0;
      width: 100%;
      max-width: 400px;
      background: var(--current-bg);
      box-shadow: -8px 0 32px rgba(0,0,0,0.1);
      z-index: 1001;
      padding: 24px;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: flex;
      flex-direction: column;
    }
    .cart-drawer.open {
      transform: translateX(0);
    }
    
    .floating-cart-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 64px; height: 64px;
      border-radius: 32px;
      font-size: 1.5rem;
      box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4);
      z-index: 900;
      padding: 0;
    }
    .cart-badge {
      position: absolute;
      top: -5px; right: -5px;
      background: var(--current-accent);
      color: #2D2D2D;
      width: 24px; height: 24px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }

    .spinner {
      animation: spin 1s linear infinite;
      display: inline-block;
      font-size: 2rem;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .theme-toggle {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999;
      width: 48px; height: 48px;
      border-radius: 24px;
      padding: 0;
      font-size: 1.2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    @media (max-width: 768px) {
      .desktop-only-theme {
        display: none !important;
      }
    }

    .banner-img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 16px;
      margin-bottom: 16px;
    }
    
    .menu-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px dashed rgba(128,128,128,0.2);
    }
    .menu-item-row:last-child { border-bottom: none; }
  `}</style>
);

// ==========================================
// 2. CONSTANTS & MOCK DATA
// ==========================================
const EMOJIS = ['🍕', '🍔', '🍜', '🧁', '🍣', '🌭', '🍟', '🍦', '🍩', '🌮'];
const STATUSES = ['Order Received', 'Cooking', 'Cooked', 'Ready to Eat'];

const generateUUID = () => {
  if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const INITIAL_MOCK_DATA = {
  profiles: [
    { id: 'stall-1', email: 'burger@stall.com', password: 'password', role: 'stall', stall_name: 'Burger Palace 🍔', is_approved: true, banner_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', min_pickup_time: 15, categories: ['Fast Food', 'Burgers'], rating: 4.5, reviewCount: 12 },
    { id: 'stall-2', email: 'sushi@stall.com', password: 'password', role: 'stall', stall_name: 'Sushi Station 🍣', is_approved: true, banner_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', min_pickup_time: 10, categories: ['Asian', 'Healthy'], rating: 4.8, reviewCount: 34 },
    { id: 'user-1', name: 'John Doe', email: 'foodie@test.com', password: 'password', role: 'user', favorite_stalls: ['stall-1'] }
  ],
  menuItems: [
    { id: 'm-1', stall_id: 'stall-1', name: 'Classic Cheeseburger', price: 8.99, description: 'Juicy beef patty with melted cheese.', emoji: '🍔', available: true },
    { id: 'm-2', stall_id: 'stall-1', name: 'Large Fries', price: 3.99, description: 'Crispy golden fries.', emoji: '🍟', available: true },
    { id: 'm-3', stall_id: 'stall-2', name: 'Spicy Tuna Roll', price: 12.50, description: 'Fresh tuna with spicy mayo.', emoji: '🍣', available: true },
    { id: 'm-4', stall_id: 'stall-2', name: 'Miso Soup', price: 4.00, description: 'Warm and comforting.', emoji: '🍜', available: true },
  ],
  orders: [
    { id: 'o-1', user_id: 'user-1', stall_id: 'stall-1', items: [{ id: 'm-1', name: 'Classic Cheeseburger', price: 8.99, emoji: '🍔', qty: 2 }], total: 17.98, pickup_time: new Date(Date.now() + 15 * 60000).toISOString(), status: 'Cooking', created_at: new Date().toISOString() }
  ],
  reviews: [
    { id: 'r-1', order_id: 'o-old', stall_id: 'stall-1', user_id: 'user-1', rating: 5, comment: 'Best burger ever!', created_at: new Date().toISOString() }
  ]
};

// ==========================================
// 3. COMPONENTS
// ==========================================

const FloatingEmojis = () => {
  return (
    <div className="floating-emojis">
      {Array.from({ length: 15 }).map((_, i) => (
        <div 
          key={i} 
          className="floating-emoji"
          style={{ 
            left: `${Math.random() * 100}vw`, 
            animationDuration: `${10 + Math.random() * 15}s`,
            animationDelay: `-${Math.random() * 15}s`,
            fontSize: `${1.5 + Math.random() * 2}rem`
          }}
        >
          {EMOJIS[Math.floor(Math.random() * EMOJIS.length)]}
        </div>
      ))}
    </div>
  );
};

const DashboardLayout = ({ sidebarItems, children, onLogout, userBadge, onToggleTheme, theme }) => {
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
        <div className="sidebar">
          <h2 style={{ fontSize: '2rem', marginBottom: '32px', color: 'var(--current-primary)', lineHeight: '1.2' }}>
            Food at<br/>a Click 🍽️
          </h2>
          
          <div style={{ marginBottom: '32px' }}>
            <span className="badge" style={{ fontSize: '1rem', padding: '8px 16px' }}>{userBadge}</span>
          </div>

          <div className="flex-col gap-2" style={{ flex: 1 }}>
            {sidebarItems.map(item => (
              <div 
                key={item.label} 
                className={`sidebar-item ${item.active ? 'active' : ''}`} 
                onClick={item.onClick}
              >
                <span style={{ fontSize: '1.5rem' }}>{item.icon}</span> 
                {item.label}
              </div>
            ))}
          </div>

          <div 
            className="sidebar-item" 
            style={{ color: 'var(--current-primary)', marginTop: 'auto' }}
            onClick={onLogout}
          >
            <span style={{ fontSize: '1.5rem' }}>🚪</span> Logout
          </div>
        </div>

        <div className="main-content">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {sidebarItems.map(item => (
          <button
            key={item.label}
            className={`mobile-nav-item ${item.active ? 'active' : ''}`}
            onClick={item.onClick}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <button className="mobile-nav-item" onClick={onLogout}>
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </nav>
    </>
  );
};

// ==========================================
// 4. MAIN APP COMPONENT
// ==========================================
const playClickSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch(e) {}
};

export default function FoodAtAClick() {
  const [theme, setTheme] = useState('light');
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);
  
  useEffect(() => {
    document.addEventListener('click', playClickSound);
    return () => document.removeEventListener('click', playClickSound);
  }, []);
  
  const [dbData, setDbData] = useState(() => {
    try {
      const saved = localStorage.getItem('faac_dbData');
      return saved ? JSON.parse(saved) : INITIAL_MOCK_DATA;
    } catch (e) {
      return INITIAL_MOCK_DATA;
    }
  });

  useEffect(() => {
    localStorage.setItem('faac_dbData', JSON.stringify(dbData));
  }, [dbData]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'faac_dbData' && e.newValue) {
        try {
          setDbData(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // AWS Real-Time Syncer
  useEffect(() => {
    if (!API_URL) return;

    const loadDataFromAWS = async () => {
      try {
        const [profilesRes, menuItemsRes, ordersRes, reviewsRes] = await Promise.all([
          fetch(`${API_URL}/profiles`),
          fetch(`${API_URL}/menuItems`),
          fetch(`${API_URL}/orders`),
          fetch(`${API_URL}/reviews`)
        ]);

        const [profiles, menuItems, orders, reviews] = await Promise.all([
          profilesRes.json(),
          menuItemsRes.json(),
          ordersRes.json(),
          reviewsRes.json()
        ]);

        let hasData = profiles.length > 0 || menuItems.length > 0 || orders.length > 0 || reviews.length > 0;
        
        if (!hasData) {
          showToast("AWS database is empty. Initializing with mock data...", "info");
          await Promise.all([
            ...INITIAL_MOCK_DATA.profiles.map(p => fetch(`${API_URL}/profiles`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) })),
            ...INITIAL_MOCK_DATA.menuItems.map(m => fetch(`${API_URL}/menuItems`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(m) })),
            ...INITIAL_MOCK_DATA.orders.map(o => fetch(`${API_URL}/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) })),
            ...INITIAL_MOCK_DATA.reviews.map(r => fetch(`${API_URL}/reviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) }))
          ]);
          setDbData(INITIAL_MOCK_DATA);
          showToast("AWS database seeded successfully!", "success");
        } else {
          setDbData({
            profiles: profiles.length > 0 ? profiles : INITIAL_MOCK_DATA.profiles,
            menuItems: menuItems.length > 0 ? menuItems : INITIAL_MOCK_DATA.menuItems,
            orders: orders,
            reviews: reviews
          });
          showToast("Loaded real-time data from AWS DynamoDB!", "success");
        }
      } catch (e) {
        console.error("Failed to load data from AWS:", e);
        showToast("Using local backup database", "info");
      }
    };

    loadDataFromAWS();
  }, [showToast]);

  const [session, setSession] = useState(null); 
  const [currentView, setCurrentView] = useState('landing'); 

  const db = useMemo(() => ({
    profiles: dbData.profiles,
    menuItems: dbData.menuItems,
    orders: dbData.orders,
    reviews: dbData.reviews,
    addProfile: async (p) => {
      setDbData(d => ({...d, profiles: [...d.profiles, p]}));
      if (API_URL) {
        try {
          await fetch(`${API_URL}/profiles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
          });
          showToast("Profile synced to AWS! 🚀", "success");
        } catch (e) { console.error(e); }
      }
    },
    updateProfile: async (id, updates) => {
      setDbData(d => ({...d, profiles: d.profiles.map(p => p.id === id ? {...p, ...updates} : p)}));
      if (API_URL) {
        try {
          await fetch(`${API_URL}/profiles`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates })
          });
        } catch (e) { console.error(e); }
      }
    },
    deleteProfile: async (id) => {
      setDbData(d => ({
        ...d, 
        profiles: d.profiles.filter(p => p.id !== id),
        menuItems: d.menuItems.filter(m => m.stall_id !== id),
        orders: d.orders.filter(o => o.stall_id !== id)
      }));
      if (API_URL) {
        try {
          await fetch(`${API_URL}/profiles`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          });
          const menuToDelete = dbData.menuItems.filter(m => m.stall_id === id);
          const ordersToDelete = dbData.orders.filter(o => o.stall_id === id);
          await Promise.all([
            ...menuToDelete.map(m => fetch(`${API_URL}/menuItems`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id }) })),
            ...ordersToDelete.map(o => fetch(`${API_URL}/orders`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: o.id }) }))
          ]);
        } catch (e) { console.error(e); }
      }
    },
    addMenuItem: async (item) => {
      setDbData(d => ({...d, menuItems: [...d.menuItems, item]}));
      if (API_URL) {
        try {
          await fetch(`${API_URL}/menuItems`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });
        } catch (e) { console.error(e); }
      }
    },
    updateMenuItem: async (id, updates) => {
      setDbData(d => ({...d, menuItems: d.menuItems.map(i => i.id === id ? {...i, ...updates} : i)}));
      if (API_URL) {
        try {
          await fetch(`${API_URL}/menuItems`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates })
          });
        } catch (e) { console.error(e); }
      }
    },
    deleteMenuItem: async (id) => {
      setDbData(d => ({...d, menuItems: d.menuItems.filter(i => i.id !== id)}));
      if (API_URL) {
        try {
          await fetch(`${API_URL}/menuItems`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          });
        } catch (e) { console.error(e); }
      }
    },
    addOrder: async (order) => {
      setDbData(d => ({...d, orders: [...d.orders, order]}));
      if (API_URL) {
        try {
          await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
          });
        } catch (e) { console.error(e); }
      }
    },
    updateOrderStatus: async (id, status) => {
      setDbData(d => ({...d, orders: d.orders.map(o => o.id === id ? {...o, status} : o)}));
      if (API_URL) {
        try {
          await fetch(`${API_URL}/orders`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
          });
        } catch (e) { console.error(e); }
      }
    },
    addReview: async (review) => {
      setDbData(d => {
        const newReviews = [...(d.reviews || []), review];
        const stallReviews = newReviews.filter(r => r.stall_id === review.stall_id);
        const avgRating = stallReviews.reduce((sum, r) => sum + r.rating, 0) / stallReviews.length;
        const newProfiles = d.profiles.map(p => p.id === review.stall_id ? {...p, rating: avgRating, reviewCount: stallReviews.length} : p);
        
        if (API_URL) {
          fetch(`${API_URL}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(review)
          }).then(() => {
            fetch(`${API_URL}/profiles`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: review.stall_id, rating: avgRating, reviewCount: stallReviews.length })
            });
          }).catch(console.error);
        }

        return {...d, reviews: newReviews, profiles: newProfiles};
      });
    },
    toggleFavorite: async (userId, stallId) => {
      setDbData(d => {
        const updatedProfiles = d.profiles.map(p => {
          if (p.id === userId) {
            const favs = p.favorite_stalls || [];
            const newFavs = favs.includes(stallId) ? favs.filter(id => id !== stallId) : [...favs, stallId];
            
            if (API_URL) {
              fetch(`${API_URL}/profiles`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, favorite_stalls: newFavs })
              }).catch(console.error);
            }

            return {...p, favorite_stalls: newFavs};
          }
          return p;
        });
        return {...d, profiles: updatedProfiles};
      });
    }
  }), [dbData, dbData.menuItems, dbData.orders, showToast]);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const handleAdminLogin = (username, password) => {
    if (username === 'FAAC' && password === 'FAAC') {
      setSession({ id: 'admin-id', role: 'admin', profileData: {} });
      setCurrentView('dashboard');
      showToast("Welcome back, Boss! 👑");
    } else {
      showToast("Wrong credentials! ❌", "error");
    }
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentView('landing');
    showToast("Logged out! 👋");
  };

  return (
    <>
      <GlobalStyles />
      {/* Fixed theme toggle — hidden on mobile via CSS (mobile topbar has its own) */}
      <button className="theme-toggle card desktop-only-theme" onClick={toggleTheme}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {currentView === 'landing' && (
        <LandingView
          onSelectRole={(role) => setCurrentView(`login-${role}`)}
          onToggleTheme={toggleTheme}
          theme={theme}
        />
      )}

      {currentView.startsWith('login-') && (
        <AuthView 
          role={currentView.split('-')[1]} 
          onBack={() => setCurrentView('landing')}
          db={db}
          showToast={showToast}
          handleAdminLogin={handleAdminLogin}
          setSession={(sess) => { setSession(sess); setCurrentView('dashboard'); }}
          onToggleTheme={toggleTheme}
          theme={theme}
        />
      )}

      {currentView === 'dashboard' && session && (
        <>
          {session.role === 'user' && <UserDashboard db={db} session={session} showToast={showToast} onLogout={handleLogout} onToggleTheme={toggleTheme} theme={theme} />}
          {session.role === 'stall' && <StallDashboard db={db} session={session} showToast={showToast} setSession={setSession} onLogout={handleLogout} onToggleTheme={toggleTheme} theme={theme} />}
          {session.role === 'admin' && <AdminDashboard db={db} session={session} showToast={showToast} onLogout={handleLogout} onToggleTheme={toggleTheme} theme={theme} />}
        </>
      )}

      <ToastContainer toasts={toasts} />
    </>
  );
}

// ==========================================
// LANDING VIEW
// ==========================================
function LandingView({ onSelectRole, onToggleTheme, theme }) {
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

// ==========================================
// AUTH VIEW
// ==========================================
function AuthView({ role, onBack, db, showToast, handleAdminLogin, setSession, onToggleTheme, theme }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stallName, setStallName] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === 'admin') {
      handleAdminLogin(email, password);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      try {
        if (isLogin) {
          const user = db.profiles.find(p => p.email === email && p.password === password && p.role === role);
          if (user) {
            showToast("Welcome back! 🎉", "success");
            setSession({ id: user.id, role: user.role, profileData: user });
          } else {
            throw new Error("Invalid credentials");
          }
        } else {
          const exists = db.profiles.find(p => p.email === email);
          if (exists) throw new Error("Email already registered!");

          const newProfile = {
            id: generateUUID(),
            email,
            password,
            role,
            min_pickup_time: 10
          };
          if (role === 'stall') {
            newProfile.stall_name = stallName;
            newProfile.is_approved = false;
          }
          if (role === 'user') newProfile.name = userName;

          db.addProfile(newProfile);
          showToast("Signup successful! 🚀", "success");
          setSession({ id: newProfile.id, role: newProfile.role, profileData: newProfile });
        }
      } catch (error) {
        showToast(error.message || "Oops! Something went wrong 😅", "error");
      } finally {
        setLoading(false);
      }
    }, 500); 
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Mobile header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
        <button onClick={onBack} style={{ background: 'transparent', padding: '4px 0', fontSize: '1rem' }}>⬅️ Back</button>
        <button
          className="theme-toggle card"
          onClick={onToggleTheme}
          style={{ position: 'static', width: 40, height: 40, fontSize: '1rem', boxShadow: 'none' }}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
      <div className="container flex-col items-center justify-center" style={{ flex: 1, paddingBottom: '32px' }}>
        <FloatingEmojis />
        <div className="card animated-list auth-card" style={{ width: '100%', maxWidth: '400px' }}>
          
          <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>
            {role === 'admin' ? 'Secret Admin Door 🕵️‍♂️' : role === 'stall' ? 'Stall Portal 🏪' : 'Foodie Login 😋'}
          </h2>

          {isLogin && (
            <div style={{ background: 'rgba(128,128,128,0.1)', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <strong>Demo Accounts:</strong><br/>
              {role === 'stall' ? 'burger@stall.com / password' : 'foodie@test.com / password'}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex-col">
            <input 
              type={role === 'admin' ? "text" : "email"} 
              placeholder={role === 'admin' ? "Username" : "Email"} 
              value={email} onChange={e => setEmail(e.target.value)} required
            />
            <input 
              type="password" placeholder="Password" 
              value={password} onChange={e => setPassword(e.target.value)} required
            />
            
            {!isLogin && role === 'stall' && (
              <input 
                type="text" placeholder="Stall Name" 
                value={stallName} onChange={e => setStallName(e.target.value)} required
              />
            )}

            {!isLogin && role === 'user' && (
              <input 
                type="text" placeholder="Your Full Name" 
                value={userName} onChange={e => setUserName(e.target.value)} required
              />
            )}

            <button type="submit" className="primary" disabled={loading}>
              {loading ? <span className="spinner">🍴</span> : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>

          {role !== 'admin' && (
            <p style={{ textAlign: 'center', marginTop: '16px', opacity: 0.8 }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span style={{ color: 'var(--current-primary)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Sign up' : 'Login'}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// USER DASHBOARD
// ==========================================
function UserDashboard({ db, session, showToast, onLogout, onToggleTheme, theme }) {
  const [stalls, setStalls] = useState([]);
  const [selectedStall, setSelectedStall] = useState(null);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const getDynamicWaitTime = (stallId, minPickupTime) => {
    const activeOrders = db.orders.filter(o => o.stall_id === stallId && o.status !== 'Ready to Eat');
    return (minPickupTime || 10) + (activeOrders.length * 5);
  };

  useEffect(() => {
    if (isCartOpen && selectedStall) {
      const waitTime = getDynamicWaitTime(selectedStall.id, selectedStall.min_pickup_time);
      const estDate = new Date(Date.now() + waitTime * 60000);
      setPickupTime(estDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }
  }, [isCartOpen, selectedStall]);
  const [myOrders, setMyOrders] = useState([]);
  const [view, setView] = useState('home'); // home (stalls), menu, orders
  
  const [pickupTime, setPickupTime] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  // New states for UX features
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [reviewDraft, setReviewDraft] = useState({ orderId: null, stallId: null, rating: 5, comment: '' });

  const categories = ['All', 'Fast Food', 'Asian', 'Healthy', 'Burgers', 'Beverages'];
  const userProfile = db.profiles.find(p => p.id === session.id) || session.profileData;

  useEffect(() => {
    const allStalls = db.profiles.filter(p => p.role === 'stall' && p.is_approved);
    
    const filteredStalls = allStalls.filter(st => {
      const matchesSearch = (st.stall_name || '').toLowerCase().includes((searchQuery || '').toLowerCase());
      const matchesCategory = selectedCategory === 'All' || (st.categories && st.categories.includes(selectedCategory));
      return matchesSearch && matchesCategory;
    });
    setStalls(filteredStalls);

    const stallMap = allStalls.reduce((acc, st) => ({...acc, [st.id]: st.stall_name}), {});
    const userOrders = db.orders.filter(o => o.user_id === session.id).map(o => ({
      ...o, stall_name: stallMap[o.stall_id] || 'Unknown Stall'
    })).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    setMyOrders(userOrders);

    if (selectedStall) {
      const isValid = allStalls.some(s => s.id === selectedStall.id);
      if (!isValid) {
        setSelectedStall(null);
        setView('home');
      } else {
        setMenu(db.menuItems.filter(m => m.stall_id === selectedStall.id));
      }
    }
  }, [db, session.id, selectedStall, searchQuery, selectedCategory]);

  const openStallMenu = (stall) => {
    setSelectedStall(stall);
    setMenu(db.menuItems.filter(m => m.stall_id === stall.id && m.available));
    setView('menu');
  };
  const handleReorder = (order) => {
    const stall = db.profiles.find(p => p.id === order.stall_id);
    if (!stall) { showToast("Stall no longer exists", "error"); return; }
    setSelectedStall(stall);
    setCart(order.items);
    setIsCartOpen(true);
    setView('menu');
  };

  const submitReview = () => {
    db.addReview({
      id: generateUUID(),
      order_id: reviewDraft.orderId,
      stall_id: reviewDraft.stallId,
      user_id: session.id,
      rating: reviewDraft.rating,
      comment: reviewDraft.comment,
      created_at: new Date().toISOString()
    });
    showToast("Review submitted! ⭐", "success");
    setReviewDraft({ orderId: null, stallId: null, rating: 5, comment: '' });
  };
  const addToCart = (item) => {
    if (cart.length > 0 && cart[0].stall_id !== selectedStall.id) {
      showToast("You can only order from one stall at a time! 🛒", "error");
      return;
    }
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
    showToast(`Added ${item.name} ${item.emoji}`);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleProceedToPayment = () => {
    if (!pickupTime) {
      showToast("Please select a pickup time! ⏰", "error");
      return;
    }
    
    setShowPayment(true);
  };

  const handlePlaceOrder = () => {
    if (!pickupTime) {
      showToast("Please select a pickup time! ⏰", "error");
      return;
    }

    const selectedDate = new Date();
    const [hours, mins] = pickupTime.split(':');
    selectedDate.setHours(parseInt(hours), parseInt(mins), 0, 0);

    const orderData = {
      id: generateUUID(),
      user_id: session.id,
      stall_id: selectedStall.id,
      items: cart,
      total: cartTotal,
      pickup_time: selectedDate.toISOString(),
      status: 'Order Received',
      created_at: new Date().toISOString()
    };

    db.addOrder(orderData);
    
    showToast("Order placed! 🎉 See you soon!", "success");
    setCart([]);
    setIsCartOpen(false);
    setView('orders');
  };

  const sidebarItems = [
    { label: 'Home', icon: '🏠', active: view === 'home' || view === 'menu', onClick: () => { setView('home'); setSelectedStall(null); } },
    { label: 'My Orders', icon: '🧾', active: view === 'orders', onClick: () => setView('orders') }
  ];

  return (
    <DashboardLayout sidebarItems={sidebarItems} onLogout={onLogout} userBadge="😋 Foodie" onToggleTheme={onToggleTheme} theme={theme}>
      {view === 'home' && (
        <div className="animated-list">
          <img src="/food_banner.png" alt="Delicious Food Banner" className="top-banner" />
          
          <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Discover Stalls</h2>
          
          <div className="flex gap-2" style={{ marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="Search for stalls or dishes..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, margin: 0 }}
            />
          </div>
          <div className="flex gap-2" style={{ overflowX: 'auto', marginBottom: '24px', paddingBottom: '8px' }}>
            {categories.map(cat => (
              <button 
                key={cat} 
                className={selectedCategory === cat ? 'primary' : 'ghost'} 
                style={{ borderRadius: '20px', padding: '6px 16px', whiteSpace: 'nowrap' }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid-cards">
            {stalls.length === 0 ? (
              <div className="empty-state card col-span-full">
                <h2>No stalls yet 🏗️</h2>
                <p>Check back later when stalls register!</p>
              </div>
            ) : (
              stalls.map(stall => (
                <div key={stall.id} className="card shimmer" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => openStallMenu(stall)}>
                  <button 
                    className="ghost" 
                    style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 8, fontSize: '1.2rem', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={(e) => { e.stopPropagation(); db.toggleFavorite(session.id, stall.id); }}
                  >
                    {userProfile?.favorite_stalls?.includes(stall.id) ? '❤️' : '🤍'}
                  </button>
                  {stall.banner_url ? (
                    <img src={stall.banner_url} alt="Banner" className="banner-img" />
                  ) : (
                    <div className="banner-img flex items-center justify-center" style={{ background: 'var(--current-primary)', opacity: 0.2, fontSize: '3rem' }}>🏪</div>
                  )}
                  <div className="flex justify-between items-center">
                    <h3 style={{ margin: '0 0 4px 0' }}>{stall.stall_name || 'Unnamed Stall'}</h3>
                    {stall.rating && <span style={{ fontWeight: 'bold' }}>⭐ {stall.rating.toFixed(1)} ({stall.reviewCount})</span>}
                  </div>
                  <span className="badge">⏱️ Est. Wait: {getDynamicWaitTime(stall.id, stall.min_pickup_time)}m</span>
                  {stall.categories && <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '8px' }}>{stall.categories.join(' • ')}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {view === 'menu' && selectedStall && (
        <div className="animated-list">
          <button className="ghost" onClick={() => setView('home')} style={{ marginBottom: '16px' }}>⬅️ Back to Stalls</button>
          
          {selectedStall.promotion && (
            <div className="promotion-banner">
              📢 <strong>Special Offer:</strong> {selectedStall.promotion}
            </div>
          )}

          <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>{selectedStall.stall_name} Menu</h2>
          
          {menu.length === 0 ? (
            <div className="empty-state card"><h2>Menu is empty 😴</h2></div>
          ) : (
            <div className="grid-cards">
              {menu.map(item => (
                <div key={item.id} className={`card flex-col justify-between ${!item.available ? 'sold-out-card' : ''}`}>
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{item.emoji} {item.name}</h3>
                      {!item.available && <span className="badge" style={{ background: 'var(--danger, #ff4d4d)', color: 'white' }}>Sold Out</span>}
                    </div>
                    <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '16px' }}>{item.description}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ fontWeight: '800', fontSize: '1.2rem' }}>₹{Number(item.price).toFixed(2)}</span>
                    <button 
                      className="accent" 
                      onClick={() => addToCart(item)} 
                      style={{ padding: '8px 16px' }} 
                      disabled={!item.available}
                    >
                      {item.available ? 'Add ➕' : 'Unavailable 🚫'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'orders' && (
        <div className="animated-list">
          <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Your Orders</h2>
          {myOrders.length === 0 ? (
            <div className="empty-state card"><h2>No orders yet 😴</h2><p>Go grab some food!</p></div>
          ) : (
            <div className="flex-col gap-4" style={{ maxWidth: '800px' }}>
              {myOrders.map(order => (
                <div key={order.id} className="card">
                  <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>{order.stall_name}</h3>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>₹{Number(order.total).toFixed(2)}</span>
                  </div>
                  <p style={{ opacity: 0.8, margin: '0 0 16px 0', fontSize: '0.9rem' }}>
                    Pickup Time: {new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', opacity: 0.8 }}>
                    {order.items.map((it, idx) => (
                      <li key={idx}>{it.qty}x {it.emoji} {it.name}</li>
                    ))}
                  </ul>

                  <div className="flex gap-2" style={{ marginBottom: '16px' }}>
                    <button className="ghost" style={{ padding: '6px 12px', fontSize: '0.9rem' }} onClick={() => handleReorder(order)}>
                      Reorder 🔁
                    </button>
                    {order.status === 'Ready to Eat' && !db.reviews?.some(r => r.order_id === order.id) && (
                      <button className="accent" style={{ padding: '6px 12px', fontSize: '0.9rem' }} onClick={() => setReviewDraft({ orderId: order.id, stallId: order.stall_id, rating: 5, comment: '' })}>
                        Leave Review ⭐
                      </button>
                    )}
                  </div>

                  {reviewDraft.orderId === order.id && (
                    <div className="card flex-col gap-2" style={{ background: 'var(--current-surface-hover)', marginBottom: '16px' }}>
                      <label>Rating: {reviewDraft.rating} ⭐</label>
                      <input type="range" min="1" max="5" value={reviewDraft.rating} onChange={e => setReviewDraft({...reviewDraft, rating: parseInt(e.target.value)})} />
                      <textarea placeholder="How was it?" value={reviewDraft.comment} onChange={e => setReviewDraft({...reviewDraft, comment: e.target.value})} rows="2" style={{ fontSize: '0.9rem', padding: '8px' }} />
                      <div className="flex gap-2">
                        <button className="primary" onClick={submitReview}>Submit</button>
                        <button className="ghost" onClick={() => setReviewDraft({ orderId: null, stallId: null, rating: 5, comment: '' })}>Cancel</button>
                      </div>
                    </div>
                  )}

                  <StatusStepper currentStatus={order.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cart Drawer */}
      {cart.length > 0 && (
        <button className="primary floating-cart-btn" onClick={() => setIsCartOpen(true)}>
          🛒
          <div className="cart-badge">{cart.reduce((s,i) => s + i.qty, 0)}</div>
        </button>
      )}

      <div className={`modal-overlay ${isCartOpen ? '' : 'hidden'}`} style={{ display: isCartOpen ? 'flex' : 'none', opacity: isCartOpen ? 1 : 0, transition: 'opacity 0.3s' }} onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setIsCartOpen(false) }}>
        <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
            <h2>Your Tray 🧺</h2>
            <button className="ghost" style={{ padding: '4px 12px' }} onClick={() => setIsCartOpen(false)}>❌</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {cart.map(item => (
              <div key={item.id} className="menu-item-row">
                <div>
                  <div style={{ fontWeight: 'bold' }}>{item.emoji} {item.name}</div>
                  <div style={{ opacity: 0.8 }}>₹{Number(item.price).toFixed(2)} x {item.qty}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="card" style={{ padding: '4px 10px' }} onClick={() => {
                    if (item.qty > 1) setCart(cart.map(c => c.id === item.id ? {...c, qty: c.qty - 1} : c));
                    else setCart(cart.filter(c => c.id !== item.id));
                  }}>-</button>
                  <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{item.qty}</span>
                  <button className="card" style={{ padding: '4px 10px' }} onClick={() => setCart(cart.map(c => c.id === item.id ? {...c, qty: c.qty + 1} : c))}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', borderTop: '2px solid rgba(128,128,128,0.2)', paddingTop: '16px' }}>
            <div className="flex justify-between" style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px' }}>
              <span>Total:</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
              Pickup Time:
            </label>
            <input type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)} />

            <div className="flex gap-2">
              <button className="primary" style={{ width: '100%', padding: '12px', fontSize: '1.1rem' }} onClick={handleProceedToPayment}>
                Proceed to Payment 💳
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="card text-center flex-col items-center gap-4" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '350px' }}>
            <div style={{ fontSize: '4rem' }}>💳</div>
            <h3 style={{ margin: 0 }}>Complete Payment</h3>
            <p style={{ margin: 0, opacity: 0.8 }}>Total amount due:</p>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--current-primary)' }}>₹{cartTotal.toFixed(2)}</h2>
            
            <button className="primary" style={{ width: '100%', padding: '12px', marginTop: '16px' }} onClick={() => {
              setShowPayment(false);
              handlePlaceOrder();
            }}>
              Pay & Place Order 🚀
            </button>
            <button className="ghost" style={{ width: '100%' }} onClick={() => setShowPayment(false)}>Cancel</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ==========================================
// STALL DASHBOARD
// ==========================================
function StallDashboard({ db, session, showToast, setSession, onLogout, onToggleTheme, theme }) {
  const [view, setView] = useState('analytics'); // analytics, orders, menu, profile
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  
  const [profile, setProfile] = useState({ stall_name: '', banner_url: '', min_pickup_time: 10, promotion: '', is_approved: false });
  const [newItem, setNewItem] = useState({ name: '', emoji: '🍔', price: '', description: '' });
  const [editingItem, setEditingItem] = useState(null);

  const dailyRevenue = useMemo(() => {
    const revMap = {};
    orders.forEach(o => {
      const date = new Date(o.created_at).toLocaleDateString();
      if (!revMap[date]) revMap[date] = 0;
      revMap[date] += o.total;
    });
    return Object.entries(revMap).map(([date, revenue]) => ({ date, revenue }));
  }, [orders]);

  const topItems = useMemo(() => {
    const itemMap = {};
    orders.forEach(o => {
      o.items.forEach(it => {
        if (!itemMap[it.name]) itemMap[it.name] = 0;
        itemMap[it.name] += it.qty;
      });
    });
    return Object.entries(itemMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);
  }, [orders]);

  useEffect(() => {
    const currentProfile = db.profiles.find(p => p.id === session.id);
    if (currentProfile) {
      setProfile({
        stall_name: currentProfile.stall_name || '',
        banner_url: currentProfile.banner_url || '',
        min_pickup_time: currentProfile.min_pickup_time || 10,
        promotion: currentProfile.promotion || '',
        is_approved: currentProfile.is_approved || false
      });
      if (session.profileData.stall_name !== currentProfile.stall_name) {
         setSession({ ...session, profileData: currentProfile });
      }
    }

    setOrders(db.orders.filter(o => o.stall_id === session.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
    setMenu(db.menuItems.filter(m => m.stall_id === session.id));
  }, [db, session.id]); 

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    db.updateProfile(session.id, profile);
    showToast("Profile updated! ✨", "success");
  };

  const handleAddMenuItem = (e) => {
    e.preventDefault();
    db.addMenuItem({
      id: generateUUID(),
      stall_id: session.id,
      ...newItem,
      price: parseFloat(newItem.price),
      available: true
    });
    showToast("Item added to menu! 🍳", "success");
    setNewItem({ name: '', emoji: '🍔', price: '', description: '' });
  };

  const saveEditedItem = (e) => {
    e.preventDefault();
    db.updateMenuItem(editingItem.id, {
      ...editingItem,
      price: parseFloat(editingItem.price)
    });
    showToast("Item updated! ✨", "success");
    setEditingItem(null);
  };

  const toggleItemAvailability = (id, current) => {
    db.updateMenuItem(id, { available: !current });
  };

  const deleteItem = (id) => {
    db.deleteMenuItem(id);
    showToast("Item deleted 🗑️");
  };

  const updateOrderStatus = (orderId, newStatus) => {
    db.updateOrderStatus(orderId, newStatus);
    showToast(`Order moved to ${newStatus}!`, "success");
    // Simulate a push notification to the user
    showToast(`🔔 [Push Notification to User]: Your order is now ${newStatus}!`, "info");
  };

  const sidebarItems = [
    { label: 'Analytics', icon: '📈', active: view === 'analytics', onClick: () => setView('analytics') },
    { label: 'Orders', icon: '🧾', active: view === 'orders', onClick: () => setView('orders') },
    { label: 'Menu Manager', icon: '🍳', active: view === 'menu', onClick: () => setView('menu') },
    { label: 'Profile', icon: '🏪', active: view === 'profile', onClick: () => setView('profile') }
  ];

  const PIE_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9D4EDD'];

  return (
    <DashboardLayout sidebarItems={sidebarItems} onLogout={onLogout} userBadge="🏪 Stall" onToggleTheme={onToggleTheme} theme={theme}>
      {!profile.is_approved && (
        <div style={{ backgroundColor: '#FF6B6B', color: 'white', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: 'bold' }}>
          🚧 Your stall is currently under review by an Admin. It will not be visible to customers until approved.
        </div>
      )}
      {view === 'analytics' && (
        <div className="animated-list">
          <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Analytics Dashboard</h2>
          <div className="grid-cards">
            <div className="card" style={{ height: '300px' }}>
              <h3 style={{ marginBottom: '16px' }}>Daily Revenue</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRevenue}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                  <Bar dataKey="revenue" fill="var(--current-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card" style={{ height: '300px' }}>
              <h3 style={{ marginBottom: '16px' }}>Top Selling Items</h3>
              {topItems.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topItems} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name}) => name}>
                      {topItems.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p>No sales data yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'orders' && (
        <div className="animated-list">
          <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Incoming Orders</h2>
          {orders.length === 0 ? (
             <div className="empty-state card"><h2>No orders right now 😴</h2><p>Time to prep!</p></div>
          ) : (
            <div className="grid-cards">
              {orders.map(order => {
                const customer = db.profiles.find(p => p.id === order.user_id) || { email: 'Guest' };
                const customerName = customer.name || customer.email;
                
                return (
                  <div key={order.id} className="card flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start" style={{ marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem' }}>Order #{order.id.split('-')[0].toUpperCase()}</h3>
                          <span style={{ opacity: 0.8, fontSize: '0.9rem' }}>👤 {customerName}</span>
                        </div>
                        <div className="flex-col items-end">
                          <span className="badge" style={{ marginBottom: '4px' }}>Total: ₹{Number(order.total).toFixed(2)}</span>
                          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
                      {order.items.map((it, idx) => (
                        <li key={idx} style={{ marginBottom: '8px', fontWeight: '600' }}>{it.qty}x {it.emoji} {it.name}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <StatusStepper 
                    currentStatus={order.status} 
                    interactive 
                    onStatusClick={(status) => updateOrderStatus(order.id, status)} 
                  />
                </div>
              )})}
            </div>
          )}
        </div>
      )}

      {view === 'menu' && (
        <div className="animated-list">
          <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Menu Manager</h2>
          <div className="grid-cards">
            <div className="card">
              <h3>Add New Item</h3>
              <form onSubmit={handleAddMenuItem} className="flex-col">
                <div className="flex gap-2">
                  <input style={{ width: '80px' }} value={newItem.emoji} onChange={e => setNewItem({...newItem, emoji: e.target.value})} required />
                  <input placeholder="Item Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
                </div>
                <input type="number" step="0.01" placeholder="Price (₹)" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required />
                <textarea placeholder="Delicious description..." value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} rows="3" />
                <button type="submit" className="primary">Add Item ✨</button>
              </form>
            </div>

            <div className="flex-col gap-4">
              {menu.map(item => (
                <div key={item.id} className="card flex-col gap-2" style={{ opacity: item.available ? 1 : 0.5 }}>
                  {editingItem?.id === item.id ? (
                    <form onSubmit={saveEditedItem} className="flex-col gap-2">
                      <div className="flex gap-2">
                        <input style={{ width: '80px' }} value={editingItem.emoji} onChange={e => setEditingItem({...editingItem, emoji: e.target.value})} required />
                        <input placeholder="Item Name" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} required />
                      </div>
                      <input type="number" step="0.01" placeholder="Price (₹)" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: e.target.value})} required />
                      <textarea placeholder="Delicious description..." value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} rows="2" />
                      <div className="flex gap-2 mt-2">
                        <button type="submit" className="primary">Save Changes 💾</button>
                        <button type="button" className="ghost" onClick={() => setEditingItem(null)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span style={{ fontSize: '2rem' }}>{item.emoji}</span>
                        <div>
                          <h4 style={{ margin: 0 }}>{item.name}</h4>
                          <div style={{ fontWeight: 'bold' }}>₹{Number(item.price).toFixed(2)}</div>
                          <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '4px' }}>{item.description}</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button className="ghost" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => setEditingItem(item)}>
                          Edit ✏️
                        </button>
                        <button className="ghost" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => toggleItemAvailability(item.id, item.available)}>
                          {item.available ? 'Disable 🚫' : 'Enable ✅'}
                        </button>
                        <button className="ghost" style={{ padding: '4px 12px', fontSize: '0.8rem', color: 'red', borderColor: 'red' }} onClick={() => deleteItem(item.id)}>
                          Delete 🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'profile' && (
        <div className="card animated-list" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Stall Profile</h2>
          {profile.banner_url && <img src={profile.banner_url} alt="Banner Preview" className="banner-img" />}
          
          <form onSubmit={handleUpdateProfile} className="flex-col">
            <label>Stall Name</label>
            <input value={profile.stall_name} onChange={e => setProfile({...profile, stall_name: e.target.value})} required />
            
            <label>Promotional Banner (Optional)</label>
            <input placeholder="e.g. 10% off all burgers today!" value={profile.promotion} onChange={e => setProfile({...profile, promotion: e.target.value})} />

            <label>Banner Image URL</label>
            <input placeholder="https://..." value={profile.banner_url} onChange={e => setProfile({...profile, banner_url: e.target.value})} />
            
            <label>Minimum Pickup Time (minutes)</label>
            <input type="number" min="1" value={profile.min_pickup_time} onChange={e => setProfile({...profile, min_pickup_time: parseInt(e.target.value)})} required />
            
            <button type="submit" className="primary">Save Changes 💾</button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================
function AdminDashboard({ db, showToast, onLogout, onToggleTheme, theme }) {
  const stalls = db.profiles.filter(p => p.role === 'stall');
  const orders = [...db.orders].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  
  const [view, setView] = useState('overview'); // overview, stalls
  const [newStallEmail, setNewStallEmail] = useState('');

  const handleDeleteStall = (id) => {
    db.deleteProfile(id);
    showToast("Stall removed! 🗑️");
  }

  const handleToggleApproval = (id, currentStatus) => {
    db.updateProfile(id, { is_approved: !currentStatus });
    showToast(currentStatus ? "Stall Hidden! 🚫" : "Stall Approved! ✅", "success");
  };

  const sidebarItems = [
    { label: 'Overview', icon: '📊', active: view === 'overview', onClick: () => setView('overview') },
    { label: 'Manage Stalls', icon: '🏪', active: view === 'stalls', onClick: () => setView('stalls') }
  ];

  return (
    <DashboardLayout sidebarItems={sidebarItems} onLogout={onLogout} userBadge="👑 Admin" onToggleTheme={onToggleTheme} theme={theme}>
      {view === 'overview' && (
        <div className="animated-list">
          <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Admin Overview</h2>
          <div className="grid-cards" style={{ marginBottom: '32px' }}>
            <div className="card text-center shimmer">
              <div style={{ fontSize: '3rem' }}>🛍️</div>
              <h2>{orders.length}</h2>
              <p style={{ opacity: 0.8, margin: 0 }}>Total Orders</p>
            </div>
            <div className="card text-center shimmer">
              <div style={{ fontSize: '3rem' }}>🏪</div>
              <h2>{stalls.length}</h2>
              <p style={{ opacity: 0.8, margin: 0 }}>Active Stalls</p>
            </div>
            <div className="card text-center shimmer">
              <div style={{ fontSize: '3rem' }}>💰</div>
              <h2>₹{orders.reduce((sum, o) => sum + Number(o.total), 0).toFixed(2)}</h2>
              <p style={{ opacity: 0.8, margin: 0 }}>Total Revenue</p>
            </div>
          </div>
          
          <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Recent Orders</h2>
          <div className="flex-col gap-4">
            {orders.slice(0, 10).map(o => (
               <div key={o.id} className="card flex justify-between items-center">
                 <div>
                   <span className="badge" style={{ marginRight: '8px' }}>{o.status}</span>
                   <span style={{ fontWeight: 'bold' }}>₹{Number(o.total).toFixed(2)}</span>
                 </div>
                 <span style={{ opacity: 0.7 }}>{new Date(o.created_at).toLocaleString()}</span>
               </div>
            ))}
          </div>
        </div>
      )}

      {view === 'stalls' && (
        <div className="animated-list">
          <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Manage Stalls</h2>
          <div className="grid-cards">
            <div className="card">
              <h3>Invite Stall</h3>
              <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>They will need to sign up with this email.</p>
              <div className="flex gap-2">
                <input placeholder="stall@email.com" value={newStallEmail} onChange={e => setNewStallEmail(e.target.value)} style={{ margin: 0 }} />
                <button className="primary" onClick={() => { showToast("Invite sent! 📧 (Simulated)"); setNewStallEmail(''); }}>Send</button>
              </div>
            </div>

            {stalls.map(stall => (
              <div key={stall.id} className="card flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 style={{ margin: '0 0 8px 0' }}>{stall.stall_name || 'Unnamed Stall'}</h3>
                    <span className="badge" style={{ backgroundColor: stall.is_approved ? '#6BCB77' : '#FFD93D', color: '#000' }}>
                      {stall.is_approved ? 'Approved ✅' : 'Pending ⏳'}
                    </span>
                  </div>
                  <p style={{ opacity: 0.8, fontSize: '0.9rem', margin: 0 }}>ID: {stall.id.substring(0,8)}...</p>
                </div>
                <div className="flex gap-2" style={{ marginTop: '16px' }}>
                  <button className="primary" style={{ flex: 1, padding: '8px' }} onClick={() => handleToggleApproval(stall.id, stall.is_approved)}>
                    {stall.is_approved ? 'Hide 🚫' : 'Approve ✅'}
                  </button>
                  <button className="ghost" style={{ padding: '8px', color: 'red', borderColor: 'red' }} onClick={() => handleDeleteStall(stall.id)}>
                    Remove 🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}


// ==========================================
// UTILITY COMPONENTS
// ==========================================
function StatusStepper({ currentStatus, interactive = false, onStatusClick }) {
  const currentIndex = STATUSES.indexOf(currentStatus);
  const progressPercent = currentIndex === -1 ? 0 : (currentIndex / (STATUSES.length - 1)) * 100;

  const ICONS = ['📥', '👨‍🍳', '✅', '🎉'];

  return (
    <div className="stepper">
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
            onClick={() => {
              if (isClickable && onStatusClick) {
                onStatusClick(status);
              }
            }}
          >
            <div className={`step-icon ${animClass}`} style={{ display: 'inline-block' }}>{ICONS[idx]}</div>
            <span className="step-label">{status}</span>
          </div>
        );
      })}
    </div>
  );
}

function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast" style={{ borderColor: t.type === 'error' ? '#FF4B4B' : 'var(--current-primary)' }}>
          {t.type === 'error' ? '❌' : '✨'} {t.msg}
        </div>
      ))}
    </div>
  );
}
