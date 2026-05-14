"use client";

import React, { useState } from 'react';
import FloatingEmojis from './FloatingEmojis';

const generateUUID = () => {
  if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
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
              {role === 'admin' ? 'FAAC / FAAC' : role === 'stall' ? 'burger@stall.com / password' : 'foodie@test.com / password'}
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
