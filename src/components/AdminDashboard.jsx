"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard({ db, onLogout, showToast, onToggleTheme, theme }) {
  const [stalls, setStalls] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      const slug = parts[parts.length - 1];
      return ['overview', 'stalls', 'orders'].includes(slug) ? slug : 'overview';
    }
    return 'overview';
  }); // overview, stalls, orders

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const newPath = activeTab === 'overview' ? '/dashboard' : `/dashboard/${activeTab}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({ activeTab }, '', newPath + window.location.search);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.activeTab) {
        setActiveTab(e.state.activeTab);
      } else {
        const parts = window.location.pathname.split('/');
        const slug = parts[parts.length - 1];
        setActiveTab(['overview', 'stalls', 'orders'].includes(slug) ? slug : 'overview');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [stallFilter, setStallFilter] = useState('All');

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
    const totalUsers = db.profiles.filter(p => p.role === 'user').length;
    const totalMenuItems = db.menuItems?.length || 0;

    const hourlyMap = {};
    const stallStats = {};

    orders.forEach(o => {
      const hour = new Date(o.created_at).getHours();
      const hourLabel = `${hour}:00`;
      hourlyMap[hourLabel] = (hourlyMap[hourLabel] || 0) + (o.total || 0);

      stallStats[o.stall_id] = stallStats[o.stall_id] || { revenue: 0, orders: 0 };
      stallStats[o.stall_id].revenue += (o.total || 0);
      stallStats[o.stall_id].orders += 1;
    });
    const hourlyData = Object.entries(hourlyMap).map(([name, earnings]) => ({ name, earnings }));

    const topStalls = Object.entries(stallStats)
      .map(([stallId, stats]) => {
        const stall = stalls.find(s => s.id === stallId);
        return {
          id: stallId,
          name: stall?.stall_name || 'Unknown Stall',
          revenue: stats.revenue
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    return { totalOrders, totalVolume, activeStallCount, totalUsers, totalMenuItems, hourlyData, stallStats, topStalls };
  }, [orders, stalls, db]);

  const filteredStalls = stalls.filter(s => (s.stall_name || '').toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredOrders = orders.filter(o => {
    const query = searchQuery.toLowerCase();
    const stallMap = stalls.reduce((acc, st) => ({...acc, [st.id]: st.stall_name}), {});
    const stallName = stallMap[o.stall_id] || '';
    const matchesId = (o.id || '').toLowerCase().includes(query);
    const matchesStallText = stallName.toLowerCase().includes(query);
    const matchesSearch = matchesId || matchesStallText;

    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchesStallFilter = stallFilter === 'All' || o.stall_id === stallFilter;

    return matchesSearch && matchesStatus && matchesStallFilter;
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
            <div className="grid-cards" style={{ marginBottom: '32px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className="card text-center shimmer" style={{ padding: '32px', background: 'linear-gradient(135deg, var(--current-primary) 0%, #ff8a8e 100%)', color: 'white', border: 'none' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💰</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>₹{metrics.totalVolume.toFixed(2)}</div>
                <p style={{ opacity: 0.9, margin: 0, fontWeight: '700' }}>Platform Volume</p>
              </div>
              <div className="card text-center shimmer" style={{ padding: '32px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛍️</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--current-primary)' }}>{metrics.totalOrders}</div>
                <p style={{ opacity: 0.7, margin: 0, fontWeight: '700' }}>Total Orders</p>
              </div>
              <div className="card text-center shimmer" style={{ padding: '32px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏪</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--current-primary)' }}>{metrics.activeStallCount}</div>
                <p style={{ opacity: 0.7, margin: 0, fontWeight: '700' }}>Active Stalls</p>
              </div>
              <div className="card text-center shimmer" style={{ padding: '32px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👥</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--current-primary)' }}>{metrics.totalUsers}</div>
                <p style={{ opacity: 0.7, margin: 0, fontWeight: '700' }}>Registered Users</p>
              </div>
              <div className="card text-center shimmer" style={{ padding: '32px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🍔</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--current-primary)' }}>{metrics.totalMenuItems}</div>
                <p style={{ opacity: 0.7, margin: 0, fontWeight: '700' }}>Menu Items</p>
              </div>
            </div>

            <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
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

              <div className="card flex-col gap-4" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>🏆 Top Performing Stalls</h3>
                <p style={{ opacity: 0.7, margin: '0 0 16px 0' }}>Highest revenue generators on the platform.</p>
                
                {metrics.topStalls.length === 0 ? (
                  <div className="flex items-center justify-center" style={{ flex: 1, opacity: 0.5, fontStyle: 'italic' }}>
                    No sales data available yet.
                  </div>
                ) : (
                  <div className="flex-col gap-3" style={{ flex: 1, overflowY: 'auto' }}>
                    {metrics.topStalls.map((stall, idx) => (
                      <div key={stall.id} className="card flex items-center justify-between" style={{ padding: '16px', background: idx === 0 ? 'rgba(255, 90, 95, 0.1)' : 'var(--current-surface-hover)', border: idx === 0 ? '1px solid var(--current-primary)' : 'none' }}>
                        <div className="flex items-center gap-4">
                          <div style={{ fontSize: '2rem', fontWeight: '900', color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'var(--current-primary)' }}>
                            #{idx + 1}
                          </div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{stall.name}</div>
                        </div>
                        <div style={{ fontWeight: '900', color: 'var(--current-primary)', fontSize: '1.2rem' }}>
                          ₹{stall.revenue.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stalls' && (
          <div className="animated-list">
            <div className="flex justify-between items-center" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
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
              {filteredStalls.map(stall => {
                const stats = metrics.stallStats[stall.id] || { revenue: 0, orders: 0 };
                return (
                  <div key={stall.id} className="card flex-col justify-between" style={{ position: 'relative', overflow: 'hidden' }}>
                    {/* Status Ribbon */}
                    <div style={{ 
                      position: 'absolute', top: '16px', right: '-32px', background: stall.is_approved ? '#10B981' : '#F59E0B', 
                      color: 'white', padding: '4px 32px', transform: 'rotate(45deg)', fontSize: '0.7rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {stall.is_approved ? 'APPROVED' : 'PENDING'}
                    </div>

                    <div>
                      <div className="flex items-center gap-3" style={{ marginBottom: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--current-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', opacity: 0.9 }}>
                          🏪
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.3rem', paddingRight: '40px' }}>{stall.stall_name || 'Unnamed Stall'}</h3>
                          <p style={{ opacity: 0.7, margin: '4px 0 0 0', fontSize: '0.85rem' }}>{stall.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center" style={{ background: 'var(--current-surface-hover)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                        <div className="text-center">
                          <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', fontWeight: 'bold' }}>Revenue</div>
                          <div style={{ fontWeight: '900', color: 'var(--current-primary)' }}>₹{stats.revenue.toFixed(2)}</div>
                        </div>
                        <div style={{ width: '1px', height: '30px', background: 'rgba(128,128,128,0.2)' }}></div>
                        <div className="text-center">
                          <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', fontWeight: 'bold' }}>Orders</div>
                          <div style={{ fontWeight: '900' }}>{stats.orders}</div>
                        </div>
                      </div>
                      
                      <p style={{ opacity: 0.6, margin: '0 0 16px 0', fontSize: '0.85rem' }}>Joined: {new Date(stall.created_at || Date.now()).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        className={stall.is_approved ? 'ghost' : 'primary'} 
                        style={{ flex: 1, padding: '10px', fontSize: '0.95rem', fontWeight: 'bold', borderColor: stall.is_approved ? 'var(--current-text)' : 'transparent' }} 
                        onClick={() => toggleApproval(stall.id)}
                      >
                        {stall.is_approved ? 'Hide Stall 🚫' : 'Approve Stall ✨'}
                      </button>
                      <button 
                        className="card" 
                        style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'none', cursor: 'pointer' }} 
                        onClick={() => deleteStall(stall.id)}
                        title="Delete Stall"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="animated-list">
            <div className="flex justify-between items-end" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '2rem', marginBottom: '8px' }}>Global Order Ledger</h2>
                <p style={{ opacity: 0.7, margin: 0 }}>Monitor and manage all transactions across the platform.</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <input 
                  type="text" 
                  placeholder="Search by ID or Stall..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  style={{ width: '250px', margin: 0 }} 
                />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ margin: 0, padding: '8px 16px', borderRadius: '12px', background: 'var(--current-card)', border: '1px solid rgba(128,128,128,0.2)' }}>
                  <option value="All">All Statuses</option>
                  <option value="Order Received">Order Received</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready to Eat">Ready to Eat</option>
                  <option value="Picked Up">Picked Up</option>
                </select>
                <select value={stallFilter} onChange={e => setStallFilter(e.target.value)} style={{ margin: 0, padding: '8px 16px', borderRadius: '12px', background: 'var(--current-card)', border: '1px solid rgba(128,128,128,0.2)' }}>
                  <option value="All">All Stalls</option>
                  {stalls.map(s => <option key={s.id} value={s.id}>{s.stall_name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-col gap-4">
              {filteredOrders.length === 0 ? (
                <div className="card text-center" style={{ padding: '40px', opacity: 0.6 }}>
                  <h3>No orders found matching your criteria.</h3>
                </div>
              ) : (
                filteredOrders.map(order => {
                  const stallMap = stalls.reduce((acc, st) => ({...acc, [st.id]: st.stall_name}), {});
                  const stallName = stallMap[order.stall_id] || 'Unknown Stall';
                  const isExpanded = expandedOrderId === order.id;

                  let statusColor = '#94A3B8'; // gray
                  if (order.status === 'Order Received') statusColor = '#3B82F6'; // blue
                  else if (order.status === 'Preparing') statusColor = '#F59E0B'; // yellow
                  else if (order.status === 'Ready to Eat') statusColor = '#10B981'; // green
                  else if (order.status === 'Picked Up') statusColor = '#8B5CF6'; // purple

                  return (
                    <div key={order.id} className="card admin-order-row" style={{ padding: 0, overflow: 'hidden' }}>
                      <div 
                        className="flex items-center justify-between" 
                        style={{ padding: '16px 24px', cursor: 'pointer', background: isExpanded ? 'var(--current-surface-hover)' : 'transparent', transition: 'background 0.2s' }}
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      >
                        <div className="flex items-center gap-4">
                          <span style={{ fontWeight: '900', color: 'var(--current-primary)', background: 'rgba(255, 90, 95, 0.1)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.9rem' }}>
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{stallName}</div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{new Date(order.created_at).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="badge" style={{ fontSize: '0.85rem', background: statusColor, color: 'white', fontWeight: 'bold' }}>{order.status}</span>
                          <span style={{ fontWeight: '900', fontSize: '1.2rem', minWidth: '80px', textAlign: 'right' }}>₹{Number(order.total).toFixed(2)}</span>
                          <span style={{ opacity: 0.5, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>▼</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(128,128,128,0.1)', marginTop: '8px', paddingTop: '16px' }}>
                          <div className="flex justify-between items-start flex-wrap gap-6">
                            <div style={{ flex: 1, minWidth: '250px' }}>
                              <h4 style={{ margin: '0 0 12px 0', opacity: 0.7, fontSize: '0.9rem', textTransform: 'uppercase' }}>Order Items</h4>
                              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {order.items?.map((item, idx) => (
                                  <li key={idx} className="flex justify-between items-center" style={{ marginBottom: '8px', padding: '8px', background: 'var(--current-surface-hover)', borderRadius: '8px' }}>
                                    <span>{item.qty}x {item.emoji} {item.name}</span>
                                    <span style={{ fontWeight: 'bold' }}>₹{(item.price * item.qty).toFixed(2)}</span>
                                  </li>
                                ))}
                                {(!order.items || order.items.length === 0) && (
                                  <li style={{ opacity: 0.5, fontStyle: 'italic' }}>No items listed for this order.</li>
                                )}
                              </ul>
                            </div>
                            
                            <div style={{ flex: 1, minWidth: '250px' }}>
                              <h4 style={{ margin: '0 0 12px 0', opacity: 0.7, fontSize: '0.9rem', textTransform: 'uppercase' }}>Details & Actions</h4>
                              <div className="flex-col gap-3">
                                {order.special_instructions && (
                                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
                                    ⚠️ <strong>Note:</strong> {order.special_instructions}
                                  </div>
                                )}
                                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                                  <strong>Customer ID:</strong> {order.user_id}
                                </div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                                  <strong>Pickup Time:</strong> {new Date(order.pickup_time).toLocaleString()}
                                </div>
                                <button className="card" style={{ alignSelf: 'flex-start', padding: '8px 16px', marginTop: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: 'bold', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }}>
                                  Delete Order 🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
