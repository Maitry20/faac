"use client";

import React, { useState } from 'react';
import FloatingEmojis from './FloatingEmojis';

const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function AuthView({ role, onBack, db, showToast, handleAdminLogin, setSession, onToggleTheme, theme }) {
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
    <div className="auth-page-root">
      {/* Self-contained high-fidelity styling for AuthView */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Outfit:wght@400;500;600;700;800;900&display=swap');

        .auth-page-root {
          background-color: #FFF8F2;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
          color: #2B2B2B;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
          transition: background-color 0.3s ease;
        }

        .auth-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          z-index: 10;
          box-sizing: border-box;
        }

        .auth-back-btn {
          background: white;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 20px 6px 6px;
          font-weight: 800;
          font-size: 0.88rem;
          color: #2B2B2B;
          border: 1px solid rgba(0, 0, 0, 0.04);
          border-radius: 50px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .auth-back-btn:hover {
          background: #FF5A5F;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 90, 95, 0.25);
          border-color: #FF5A5F;
        }

        .auth-arrow-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 90, 95, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .auth-back-btn:hover .auth-arrow-circle {
          background: white;
          transform: scale(0.95);
        }

        .auth-arrow-circle svg {
          width: 18px;
          height: 18px;
          fill: none;
          stroke: #FF5A5F;
          stroke-width: 2.5;
          transition: all 0.3s ease;
        }

        .auth-theme-toggle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.04);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
          outline: none;
        }

        .auth-theme-toggle:hover {
          transform: scale(1.08) rotate(15deg);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
        }

        .auth-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px 20px 64px;
          z-index: 5;
          box-sizing: border-box;
        }

        .auth-glass-card {
          width: 100%;
          max-width: 410px;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 32px;
          padding: 40px 32px;
          box-shadow: 0 20px 48px rgba(255, 90, 95, 0.06), 0 8px 24px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: scaleUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
        }

        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .auth-title-section {
          text-align: center;
        }

        .auth-title-subtitle {
          font-size: 0.78rem;
          color: #FF5A5F;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 8px;
        }

        .auth-title {
          font-family: 'Fredoka One', cursive;
          font-size: 2.1rem;
          color: #2B2B2B;
          margin: 0;
          line-height: 1.25;
        }

        .auth-segmented-switch {
          display: flex;
          background: rgba(128, 128, 128, 0.06);
          border-radius: 18px;
          padding: 4px;
          position: relative;
          height: 48px;
          box-sizing: border-box;
          align-items: center;
        }

        .auth-switch-tab {
          flex: 1;
          text-align: center;
          font-weight: 800;
          font-size: 0.95rem;
          color: #666666;
          cursor: pointer;
          z-index: 2;
          transition: color 0.3s ease;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
        }

        .auth-switch-tab.active {
          color: white;
        }

        .auth-switch-slider {
          position: absolute;
          top: 4px;
          left: 4px;
          width: calc(50% - 4px);
          height: 40px;
          background: linear-gradient(135deg, #FF6B6B 0%, #FF5A5F 100%);
          border-radius: 14px;
          box-shadow: 0 4px 12px rgba(255, 90, 95, 0.25);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1;
        }

        .auth-switch-slider.signup-active {
          transform: translateX(100%);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .auth-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .auth-input-icon {
          position: absolute;
          left: 18px;
          font-size: 1.15rem;
          color: #A0A0A0;
          pointer-events: none;
          transition: color 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-input {
          width: 100%;
          height: 52px;
          padding: 0 16px 0 50px;
          border-radius: 16px;
          border: 1.5px solid rgba(0, 0, 0, 0.05);
          background: white;
          font-size: 0.95rem;
          font-weight: 600;
          color: #2B2B2B;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
          box-sizing: border-box;
          transition: all 0.3s ease;
          margin-bottom: 0px !important; /* Override globals */
        }

        .auth-input::placeholder {
          color: #A0A0A0;
          font-weight: 600;
        }

        .auth-input:focus {
          outline: none;
          border-color: #FF5A5F;
          box-shadow: 0 0 0 4px rgba(255, 90, 95, 0.12);
          background: white;
        }

        .auth-input:focus + .auth-input-icon {
          color: #FF5A5F;
        }

        .auth-submit-btn {
          height: 52px;
          background: linear-gradient(135deg, #FF6B6B 0%, #FF5A5F 100%);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 1.05rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(255, 90, 95, 0.3);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          outline: none;
        }

        .auth-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(255, 90, 95, 0.4);
        }

        .auth-submit-btn:active:not(:disabled) {
          transform: scale(0.97);
        }

        .auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .auth-footer {
          text-align: center;
          font-size: 0.9rem;
          color: #666;
          font-weight: 600;
          margin: 0;
        }

        .auth-footer-link {
          color: #FF5A5F;
          cursor: pointer;
          font-weight: 800;
          margin-left: 4px;
          transition: color 0.2s;
        }

        .auth-footer-link:hover {
          color: #FF3B41;
          text-decoration: underline;
        }

        .auth-spinner {
          display: inline-block;
          animation: spin 1s linear infinite;
          font-size: 1.3rem;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* --- Dark Mode Custom Overrides --- */
        body.dark .auth-page-root {
          background-color: #12121E;
        }

        body.dark .auth-glass-card {
          background: rgba(22, 22, 38, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.3);
        }

        body.dark .auth-title {
          color: #E0E0E0;
        }

        body.dark .auth-input {
          background: #1A1A2E;
          border-color: rgba(255, 255, 255, 0.06);
          color: #E0E0E0;
        }

        body.dark .auth-input:focus {
          border-color: #FF8A8A;
          box-shadow: 0 0 0 4px rgba(255, 138, 138, 0.15);
        }

        body.dark .auth-switch-tab {
          color: #A0A0A0;
        }

        body.dark .auth-switch-tab.active {
          color: white;
        }

        body.dark .auth-back-btn {
          background: #16213E;
          color: #E0E0E0;
          border-color: rgba(255, 255, 255, 0.06);
        }

        body.dark .auth-theme-toggle {
          background: #16213E;
          border-color: rgba(255, 255, 255, 0.06);
        }

        body.dark .auth-arrow-circle {
          background: rgba(255, 138, 138, 0.12);
        }

        body.dark .auth-arrow-circle svg {
          stroke: #FF8A8A;
        }

        body.dark .auth-back-btn:hover {
          background: #FF5A5F;
          color: white;
          border-color: #FF5A5F;
        }

        body.dark .auth-footer {
          color: #A0A0A0;
        }
      `}</style>

      {/* Header bar with Back button and Theme toggle */}
      <div className="auth-header">
        <button className="auth-back-btn" onClick={onBack}>
          <div className="auth-arrow-circle">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          Back
        </button>
        <button
          className="auth-theme-toggle"
          onClick={onToggleTheme}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      <div className="auth-container">
        <FloatingEmojis />

        <div className="auth-glass-card">
          {/* Header Title Section */}
          <div className="auth-title-section">
            <div className="auth-title-subtitle">
              {role === 'admin' ? 'SYSTEM CONTROL' : role === 'stall' ? 'PARTNER PORTAL' : 'STUDENT HUB'}
            </div>
            <h2 className="auth-title">
              {role === 'admin' ? 'Admin Portal 🕵️‍♂️' : role === 'stall' ? 'Stall Portal 🏪' : 'Food at a Click 😋'}
            </h2>
          </div>

          {/* Segmented Controller for Login/Signup (Hidden for Admin) */}
          {role !== 'admin' && (
            <div className="auth-segmented-switch">
              <div 
                className={`auth-switch-slider ${!isLogin ? 'signup-active' : ''}`}
              />
              <div 
                className={`auth-switch-tab ${isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(true)}
              >
                Login
              </div>
              <div 
                className={`auth-switch-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </div>
            </div>
          )}

          {/* Input & Action Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            
            {/* Email / Username Input */}
            <div className="auth-input-wrapper">
              <input
                type={role === 'admin' ? "text" : "email"}
                placeholder={role === 'admin' ? "Username" : "Email Address"}
                className="auth-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <span className="auth-input-icon">
                {role === 'admin' ? '👤' : '✉️'}
              </span>
            </div>

            {/* Password Input */}
            <div className="auth-input-wrapper">
              <input
                type="password"
                placeholder="Password"
                className="auth-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <span className="auth-input-icon">🔒</span>
            </div>

            {/* Dynamic Sign up - Stall Name Input */}
            {!isLogin && role === 'stall' && (
              <div className="auth-input-wrapper">
                <input
                  type="text"
                  placeholder="Stall Name"
                  className="auth-input"
                  value={stallName}
                  onChange={e => setStallName(e.target.value)}
                  required
                />
                <span className="auth-input-icon">🏪</span>
              </div>
            )}

            {/* Dynamic Sign up - Student Name Input */}
            {!isLogin && role === 'user' && (
              <div className="auth-input-wrapper">
                <input
                  type="text"
                  placeholder="Your Full Name"
                  className="auth-input"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  required
                />
                <span className="auth-input-icon">👤</span>
              </div>
            )}

            {/* Submit Action Button */}
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="auth-spinner">🍳</span>
              ) : (
                isLogin ? 'Sign In 🚀' : 'Create Account ✨'
              )}
            </button>
          </form>

          {/* Bottom helper toggler (Hidden for Admin) */}
          {role !== 'admin' && (
            <p className="auth-footer">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span 
                className="auth-footer-link" 
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Sign up' : 'Login'}
              </span>
            </p>
          )}

        </div>
      </div>
    </div>
  );
}
