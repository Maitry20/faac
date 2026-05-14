"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard({ db, onLogout, showToast, onToggleTheme, theme }) {
  const [stalls, setStalls] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, stalls, orders
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setStalls(db.profiles.filter(p => p.role === 'stall'));
    setOrders(db.orders);
  }, [db]);

  const toggleApproval = (stallId) => {
    db.toggleStallApproval(stallId);
    setStalls(stalls.map(s => s.id === stallId ? { ...s, is_approved: !s.is_approved } : s));
    showToast("Stall approval updated!");
  };

  const deleteStall = (stallId) => {
    if (confirm("Are you sure you want to delete this stall?")) {
      db.deleteProfile(stallId);
      setStalls(stalls.filter(s => s.id !== stallId));
      showToast("Stall deleted successfully", "success");
    }
  };

  const deleteOrder = (orderId) => {
    if (confirm("Are you sure you want to delete this order?")) {
      db.deleteOrder(orderId);
      setOrders(orders.filter(o => o.id !== orderId));
      showToast("Order removed", "success");
    }
  };

  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalVolume = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const activeStallCount = stalls.filter(s => s.is_approved).length;

    const hourlyMap = {};
    orders.forEach(o => {
      const hour = new Date(o.created_at).getHours();
      const hourLabel = `${hour}:00`;
      hourlyMap[hourLabel] = (hourlyMap[hourLabel] || 0) + (o.total || 0);
    });
    const hourlyData = Object.entries(hourlyMap).map(([name, earnings]) => ({ name, earnings }));

    return { totalOrders, totalVolume, activeStallCount, hourlyData };
  }, [orders, stalls]);

  const filteredStalls = stalls.filter(s => (s.stall_name || '').toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredOrders = orders.filter(o => {
    const query = searchQuery.toLowerCase();
    const stallMap = stalls.reduce((acc, st) => ({...acc, [st.id]: st.stall_name}), {});
    const stallName = stallMap[o.stall_id] || '';
    const matchesId = (o.id || '').toLowerCase().includes(query);
    const matchesStall = stallName.toLowerCase().includes(query);
    return matchesId || matchesStall;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <div style={{ background: 'var(--current-card)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(128,128,128,0.1)' }}>
        <div className="flex items-center gap-4">
          <h1 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--current-primary)' }}>FAAC Admin Portal 👑</h1>
          <div className="flex gap-2">
            <button className={activeTab === 'overview' ? 'primary' : 'ghost'} style={{ padding: '6px 16px', fontSize: '0.9rem' }} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={activeTab === 'stalls' ? 'primary' : 'ghost'} style={{ padding: '6px 16px', fontSize: '0.9rem' }} onClick={() => setActiveTab('stalls')}>Manage Stalls</button>
            <button className={activeTab === 'orders' ? 'primary' : 'ghost'} style={{ padding: '6px 16px', fontSize: '0.9rem' }} onClick={() => setActiveTab('orders')}>All Orders</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="theme-toggle card"
            onClick={onToggleTheme}
            style={{ position: 'static', width: 40, height: 40, fontSize: '1rem', boxShadow: 'none' }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="ghost" style={{ padding: '6px 16px' }} onClick={onLogout}>Logout 🚪</button>
        </div>
      </div>

      <div className="main-content" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        {activeTab === 'overview' && (
          <div className="animated-list">
            <div className="grid-cards" style={{ marginBottom: '32px' }}>
              <div className="card text-center" style={{ padding: '32px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💰</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>₹{metrics.totalVolume.toFixed(2)}</div>
                <p style={{ opacity: 0.7, margin: 0, fontWeight: '700' }}>Platform Volume</p>
              </div>
              <div className="card text-center" style={{ padding: '32px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛍️</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{metrics.totalOrders}</div>
                <p style={{ opacity: 0.7, margin: 0, fontWeight: '700' }}>Total Orders</p>
              </div>
              <div className="card text-center" style={{ padding: '32px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏪</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{metrics.activeStallCount}</div>
                <p style={{ opacity: 0.7, margin: 0, fontWeight: '700' }}>Active Stalls</p>
              </div>
            </div>

            <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>Platform Traffic 📊</h3>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.hourlyData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="earnings" fill="var(--current-primary)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stalls' && (
          <div className="animated-list">
            <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '2rem' }}>Stall Directory</h2>
              <input 
                type="text" 
                placeholder="Search stalls..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                style={{ width: '300px', margin: 0 }} 
              />
            </div>

            <div className="grid-cards">
              {filteredStalls.map(stall => (
                <div key={stall.id} className="card flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{stall.stall_name || 'Unnamed Stall'}</h3>
                      <span className="badge" style={{ background: stall.is_approved ? '#10B981' : '#F59E0B' }}>
                        {stall.is_approved ? 'Approved ✅' : 'Pending Review ⏳'}
                      </span>
                    </div>
                    <p style={{ opacity: 0.7, margin: '0 0 8px 0', fontSize: '0.9rem' }}>Contact: {stall.email}</p>
                    <p style={{ opacity: 0.7, margin: '0 0 16px 0', fontSize: '0.9rem' }}>Created: {new Date(stall.created_at || Date.now()).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      className={stall.is_approved ? 'ghost' : 'primary'} 
                      style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }} 
                      onClick={() => toggleApproval(stall.id)}
                    >
                      {stall.is_approved ? 'Hide Stall 🚫' : 'Approve Stall ✨'}
                    </button>
                    <button 
                      className="ghost" 
                      style={{ padding: '8px', borderColor: '#EF4444', color: '#EF4444' }} 
                      onClick={() => deleteStall(stall.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="animated-list">
            <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '2rem' }}>Global Order Ledger</h2>
              <input 
                type="text" 
                placeholder="Search by ID or Stall..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                style={{ width: '300px', margin: 0 }} 
              />
            </div>

            <div className="flex-col gap-4">
              {filteredOrders.map(order => {
                const stallMap = stalls.reduce((acc, st) => ({...acc, [st.id]: st.stall_name}), {});
                const stallName = stallMap[order.stall_id] || 'Unknown Stall';
                return (
                  <div key={order.id} className="card flex items-center justify-between admin-order-row" style={{ padding: '16px 24px' }}>
                    <div className="flex items-center gap-4">
                      <span style={{ fontWeight: '900', color: 'var(--current-primary)' }}>#{order.id.slice(0, 5).toUpperCase()}</span>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{stallName}</div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{new Date(order.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="badge" style={{ fontSize: '0.9rem' }}>{order.status}</span>
                      <span style={{ fontWeight: '900', fontSize: '1.1rem' }}>₹{Number(order.total).toFixed(2)}</span>
                      <button className="ghost" style={{ padding: '6px 12px', borderColor: '#EF4444', color: '#EF4444', fontSize: '0.9rem' }} onClick={() => deleteOrder(order.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
