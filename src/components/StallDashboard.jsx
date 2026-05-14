"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from './DashboardLayout';
import { STATUSES } from './StatusStepper';

const generateUUID = () => {
  if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function StallDashboard({ db, session, showToast, onLogout, onToggleTheme, theme }) {
  const [view, setView] = useState('orders'); // orders, history, menu, analytics, settings
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', price: '', emoji: '🍲', description: '', category: 'Fast Food', available: true, photo: '' });
  const [photoType, setPhotoType] = useState('emoji'); // 'emoji' vs 'upload'
  const [stallProfile, setStallProfile] = useState({ stall_name: '', min_pickup_time: 10, promotion: '', banner_url: '', categories: ['Fast Food'] });
  const [searchQuery, setSearchQuery] = useState('');

  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const userMap = db.profiles.reduce((acc, p) => ({...acc, [p.id]: p.name}), {});

    const stallOrders = db.orders
      .filter(o => o.stall_id === session.id && o.status !== 'Picked Up')
      .map(o => ({
        ...o,
        customer_name: userMap[o.user_id] || 'Anonymous Foodie'
      }))
      .sort((a,b) => new Date(a.pickup_time) - new Date(b.pickup_time));

    setOrders(stallOrders);

    const stallHistory = db.orders
      .filter(o => o.stall_id === session.id && o.status === 'Picked Up')
      .map(o => ({
        ...o,
        customer_name: userMap[o.user_id] || 'Anonymous Foodie'
      }))
      .sort((a,b) => new Date(b.pickup_time) - new Date(a.pickup_time));

    setHistoryOrders(stallHistory);

    setMenu(db.menuItems.filter(m => m.stall_id === session.id));

    const profile = db.profiles.find(p => p.id === session.id);
    if (profile) {
      setStallProfile({
        stall_name: profile.stall_name || '',
        min_pickup_time: profile.min_pickup_time || 10,
        promotion: profile.promotion || '',
        banner_url: profile.banner_url || '',
        categories: profile.categories || ['Fast Food']
      });
    }

    if (db.reviews) {
      setReviews(db.reviews.filter(r => r.stall_id === session.id));
    }
  }, [db, session.id]);

  const updateStatus = (orderId, currentStatus) => {
    const nextIdx = STATUSES.indexOf(currentStatus) + 1;
    if (nextIdx < STATUSES.length) {
      db.updateOrderStatus(orderId, STATUSES[nextIdx]);
      showToast(`Order status updated to: ${STATUSES[nextIdx]}!`);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const itemData = {
      id: generateUUID(),
      stall_id: session.id,
      ...newItem,
      price: parseFloat(newItem.price)
    };
    db.addMenuItem(itemData);
    setMenu([...menu, itemData]);
    setNewItem({ name: '', price: '', emoji: '🍲', description: '', category: 'Fast Food', available: true, photo: '' });
    showToast("Menu item added! 🍳", "success");
  };

  const toggleAvailability = (itemId) => {
    db.toggleItemAvailability(itemId);
    setMenu(menu.map(m => m.id === itemId ? { ...m, available: !m.available } : m));
    showToast("Item availability updated!");
  };

  const deleteItem = (itemId) => {
    db.deleteMenuItem(itemId);
    setMenu(menu.filter(m => m.id === itemId));
    showToast("Item removed from menu", "success");
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    db.updateProfile(session.id, stallProfile);
    showToast("Stall settings updated! ✨", "success");
  };

  const analytics = useMemo(() => {
    const allStallOrders = db.orders.filter(o => o.stall_id === session.id);
    const totalEarnings = allStallOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const completedOrders = allStallOrders.filter(o => o.status === 'Picked Up').length;
    const pendingOrders = allStallOrders.filter(o => o.status !== 'Picked Up').length;

    const itemSales = {};
    allStallOrders.forEach(o => {
      o.items.forEach(it => {
        itemSales[it.name] = (itemSales[it.name] || 0) + it.qty;
      });
    });
    const topDish = Object.entries(itemSales).sort((a,b) => b[1] - a[1])[0]?.[0] || 'No sales yet';

    const hourlyMap = {};
    allStallOrders.forEach(o => {
      const hour = new Date(o.created_at).getHours();
      const hourLabel = `${hour}:00`;
      hourlyMap[hourLabel] = (hourlyMap[hourLabel] || 0) + (o.total || 0);
    });
    const hourlyData = Object.entries(hourlyMap).map(([name, earnings]) => ({ name, earnings }));

    return { totalEarnings, completedOrders, pendingOrders, topDish, hourlyData };
  }, [db.orders, session.id]);

  const categoriesList = ['Fast Food', 'Asian', 'Healthy', 'Burgers', 'Beverages', 'Desserts'];

  const filteredOrders = orders.filter(o => {
    const query = searchQuery.toLowerCase();
    const matchesId = (o.id || '').toLowerCase().includes(query);
    const matchesCustomer = (o.customer_name || '').toLowerCase().includes(query);
    const matchesItem = o.items.some(i => (i.name || '').toLowerCase().includes(query));
    return matchesId || matchesCustomer || matchesItem;
  });

  const sidebarItems = [
    { label: 'Active Orders', icon: '🛎️', active: view === 'orders', onClick: () => setView('orders') },
    { label: 'History', icon: '📜', active: view === 'history', onClick: () => setView('history') },
    { label: 'Menu Manager', icon: '📋', active: view === 'menu', onClick: () => setView('menu') },
    { label: 'Analytics', icon: '📈', active: view === 'analytics', onClick: () => setView('analytics') },
    { label: 'Settings', icon: '⚙️', active: view === 'settings', onClick: () => setView('settings') }
  ];

  return (
    <DashboardLayout sidebarItems={sidebarItems} onLogout={onLogout} userBadge="🏪 Stall Vendor" onToggleTheme={onToggleTheme} theme={theme}>
      {view === 'orders' && (
        <div className="animated-list">
          <div className="flex justify-between items-center" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ fontSize: '2rem', margin: 0 }}>Incoming Orders</h2>
            <div className="flex gap-2 items-center" style={{ width: '100%', maxWidth: '350px' }}>
              <input 
                type="text" 
                placeholder="Search orders (ID, foodie, dish)..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ margin: 0 }}
              />
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="empty-state card">
              <h2>Kitchen is quiet 🍳</h2>
              <p>Waiting for hungry foodies to place orders!</p>
            </div>
          ) : (
            <div className="grid-cards orders-grid">
              {filteredOrders.map(order => {
                const nextStatuses = {
                  'Order Received': { label: 'Start Cooking 👨‍🍳', class: 'primary' },
                  'Cooking': { label: 'Mark Cooked ✅', class: 'accent' },
                  'Cooked': { label: 'Ready to Eat 🎉', class: 'primary' },
                  'Ready to Eat': { label: 'Waiting for Pickup 🛍️', class: 'ghost' }
                };
                const nextAct = nextStatuses[order.status];

                return (
                  <div key={order.id} className="order-card stall-order-card">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="order-card-id">#{order.id.slice(0, 5).toUpperCase()}</h3>
                          <div className="order-customer-name">👤 {order.customer_name}</div>
                        </div>
                        <span className="badge" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                          ⏰ {new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="order-card-divider"></div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div className="section-title">Order Items</div>
                      <ul className="receipt-list">
                        {order.items.map((it, idx) => (
                          <li key={idx} className="receipt-item">
                            <div className="flex items-center gap-3">
                              <span className="receipt-item-qty">{it.qty}x</span>
                              {it.photo ? (
                                <img src={it.photo} alt={it.name} className="receipt-item-img" />
                              ) : (
                                <span style={{ fontSize: '1.2rem' }}>{it.emoji}</span>
                              )}
                              <span className="receipt-item-name">{it.name}</span>
                            </div>
                            <span className="receipt-item-price">₹{(it.price * it.qty).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {order.special_instructions && (
                      <div style={{ 
                        background: 'rgba(255, 107, 107, 0.08)', 
                        padding: '12px 16px', 
                        borderRadius: '16px', 
                        border: '1px solid rgba(255, 107, 107, 0.2)',
                        fontSize: '0.9rem', 
                        fontWeight: '700',
                        color: 'var(--current-primary)'
                      }}>
                        {/allergy|allergic/i.test(order.special_instructions) ? '⚠️ Allergy Alert: ' : '📝 Notes: '}"{order.special_instructions}"
                      </div>
                    )}

                    <div className="status-badge-preview">
                      <span style={{ fontSize: '1.4rem' }}>
                        {order.status === 'Order Received' ? '📥' : order.status === 'Cooking' ? '👨‍🍳' : order.status === 'Cooked' ? '✅' : '🎉'}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase', fontWeight: 800 }}>Current Status</span>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--current-primary)' }}>{order.status}</span>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: '0.8rem', opacity: 0.5 }}>Hover to expand 👇</span>
                    </div>

                    <div className="stepper-wrapper">
                      <div className="section-title" style={{ marginBottom: 0 }}>Progress Tracker</div>
                      <div className="order-card-stepper-container">
                        <div className="stepper" style={{ margin: '16px 0 24px 0', padding: 0 }}>
                          <div className="step-line-progress" style={{ width: `${(STATUSES.indexOf(order.status) / (STATUSES.length - 1)) * 100}%` }}></div>
                          {STATUSES.map((st, idx) => {
                            const isCompleted = idx <= STATUSES.indexOf(order.status);
                            const isActive = st === order.status;
                            return (
                              <div key={st} className={`step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`} style={{ width: 24, height: 24 }}>
                                <span style={{ fontSize: '0.7rem' }}>{idx + 1}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="order-card-actions">
                      {order.status !== 'Ready to Eat' ? (
                        <button 
                          className={`action-btn ${nextAct?.class || 'primary'}`}
                          onClick={(e) => { e.stopPropagation(); updateStatus(order.id, order.status); }}
                        >
                          {nextAct?.label || 'Next Step'}
                        </button>
                      ) : (
                        <div className="order-completed-badge">
                          🎉 Ready & Waiting for Foodie
                        </div>
                      )}
                      <div className="order-card-footer">
                        <span>Ordered at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span style={{ fontWeight: 900, color: 'var(--current-primary)', fontSize: '1.1rem' }}>₹{Number(order.total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view === 'history' && (
        <div className="animated-list">
          <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Order History (Picked Up)</h2>
          {historyOrders.length === 0 ? (
            <div className="empty-state card"><h2>No completed orders yet 📜</h2></div>
          ) : (
            <div className="grid-cards orders-grid">
              {historyOrders.map(order => (
                <div key={order.id} className="order-card">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="order-card-id">#{order.id.slice(0, 5).toUpperCase()}</h3>
                        <div className="order-customer-name">👤 {order.customer_name}</div>
                      </div>
                      <span className="badge" style={{ fontSize: '0.9rem', padding: '6px 12px', background: '#6BCB77' }}>
                        ✅ Picked Up
                      </span>
                    </div>
                  </div>

                  <div className="order-card-divider"></div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="section-title">Order Items</div>
                    <ul className="receipt-list">
                      {order.items.map((it, idx) => (
                        <li key={idx} className="receipt-item">
                          <div className="flex items-center gap-3">
                            <span className="receipt-item-qty">{it.qty}x</span>
                            {it.photo ? (
                              <img src={it.photo} alt={it.name} className="receipt-item-img" />
                            ) : (
                              <span style={{ fontSize: '1.2rem' }}>{it.emoji}</span>
                            )}
                            <span className="receipt-item-name">{it.name}</span>
                          </div>
                          <span className="receipt-item-price">₹{(it.price * it.qty).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {order.special_instructions && (
                    <div style={{ 
                      background: 'rgba(128, 128, 128, 0.05)', 
                      padding: '12px 16px', 
                      borderRadius: '16px', 
                      fontSize: '0.9rem', 
                      fontWeight: '700',
                      fontStyle: 'italic'
                    }}>
                      📝 "{order.special_instructions}"
                    </div>
                  )}

                  <div className="order-card-actions">
                    <div className="order-card-footer" style={{ marginTop: '16px' }}>
                      <span>Completed at {new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span style={{ fontWeight: 900, color: 'var(--current-primary)', fontSize: '1.1rem' }}>₹{Number(order.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'menu' && (
        <div className="animated-list flex-col gap-4">
          <div className="card">
            <h2 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>Add New Dish 🍳</h2>
            <form onSubmit={handleAddItem} className="flex-col">
              <div className="flex gap-4 mobile-column">
                <div className="flex-col" style={{ flex: 1 }}>
                  <label>Dish Name</label>
                  <input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
                </div>
                <div className="flex-col" style={{ flex: 1 }}>
                  <label>Price (₹)</label>
                  <input type="number" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required />
                </div>
              </div>

              <div className="flex gap-2" style={{ marginBottom: '16px' }}>
                <button type="button" className={photoType === 'emoji' ? 'primary' : 'ghost'} onClick={() => setPhotoType('emoji')}>Emoji Icon 🥑</button>
                <button type="button" className={photoType === 'upload' ? 'primary' : 'ghost'} onClick={() => setPhotoType('upload')}>Photo URL 📸</button>
              </div>

              {photoType === 'emoji' ? (
                <div className="flex-col">
                  <label>Emoji Icon</label>
                  <input value={newItem.emoji} onChange={e => setNewItem({...newItem, emoji: e.target.value})} required />
                </div>
              ) : (
                <div className="flex-col">
                  <label>Photo URL</label>
                  <input type="url" placeholder="https://images.unsplash.com/..." value={newItem.photo} onChange={e => setNewItem({...newItem, photo: e.target.value})} required />
                </div>
              )}

              <label>Description</label>
              <textarea value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} rows="2" required />

              <label>Category</label>
              <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>

              <button type="submit" className="primary">Add to Menu ➕</button>
            </form>
          </div>

          <h2 style={{ fontSize: '1.8rem', marginTop: '16px' }}>Current Menu</h2>
          <div className="grid-cards">
            {menu.map(item => (
              <div key={item.id} className="card flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start" style={{ marginBottom: '12px' }}>
                    <div className="flex items-center gap-3">
                      {item.photo ? (
                        <img src={item.photo} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '2rem' }}>{item.emoji}</span>
                      )}
                      <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{item.name}</h3>
                    </div>
                    <span className="badge" style={{ background: item.available ? '#10B981' : '#EF4444' }}>
                      {item.available ? 'Available' : 'Sold Out'}
                    </span>
                  </div>
                  <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '16px' }}>{item.description}</p>
                </div>

                <div className="flex justify-between items-center">
                  <span style={{ fontWeight: '800', fontSize: '1.2rem' }}>₹{Number(item.price).toFixed(2)}</span>
                  <div className="flex gap-2">
                    <button className="ghost" style={{ padding: '6px 12px' }} onClick={() => toggleAvailability(item.id)}>
                      {item.available ? 'Pause ⏸️' : 'Resume ▶️'}
                    </button>
                    <button className="ghost" style={{ padding: '6px 12px', borderColor: '#EF4444', color: '#EF4444' }} onClick={() => deleteItem(item.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'analytics' && (
        <div className="animated-list">
          <h2 style={{ fontSize: '2.5rem', marginBottom: '32px' }}>Stall Analytics 📈</h2>
          
          <div className="grid-cards" style={{ marginBottom: '32px' }}>
            <div className="card text-center" style={{ padding: '32px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💰</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>₹{analytics.totalEarnings.toFixed(2)}</div>
              <p style={{ opacity: 0.7, margin: 0, fontWeight: '700' }}>Total Earnings</p>
            </div>
            <div className="card text-center" style={{ padding: '32px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛍️</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{analytics.completedOrders}</div>
              <p style={{ opacity: 0.7, margin: 0, fontWeight: '700' }}>Completed Orders</p>
            </div>
            <div className="card text-center" style={{ padding: '32px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{analytics.pendingOrders}</div>
              <p style={{ opacity: 0.7, margin: 0, fontWeight: '700' }}>Pending Orders</p>
            </div>
            <div className="card text-center" style={{ padding: '32px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🍲</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '8px', color: 'var(--current-primary)' }}>{analytics.topDish}</div>
              <p style={{ opacity: 0.7, margin: 0, fontWeight: '700' }}>Top Selling Dish</p>
            </div>
          </div>

          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', marginBottom: '32px' }}>
            <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>Hourly Revenue 📊</h3>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.hourlyData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="earnings" fill="var(--current-primary)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card flex-col gap-4" style={{ overflowY: 'auto', maxHeight: '400px' }}>
              <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Recent Reviews ⭐</h3>
              {reviews.length === 0 ? (
                <div className="empty-state">No reviews yet</div>
              ) : (
                reviews.map(rev => (
                  <div key={rev.id} style={{ padding: '16px', background: 'rgba(128,128,128,0.05)', borderRadius: '16px' }}>
                    <div className="flex justify-between" style={{ marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>{rev.rating} ⭐</span>
                      <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ margin: 0, opacity: 0.9 }}>"{rev.comment}"</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'settings' && (
        <div className="card animated-list" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Stall Settings ⚙️</h2>
          
          <form onSubmit={handleUpdateProfile} className="flex-col">
            <label>Stall Name</label>
            <input value={stallProfile.stall_name} onChange={e => setStallProfile({...stallProfile, stall_name: e.target.value})} required />

            <label>Banner URL 📸</label>
            <input type="url" placeholder="https://images.unsplash.com/..." value={stallProfile.banner_url} onChange={e => setStallProfile({...stallProfile, banner_url: e.target.value})} />

            <label>Promotion / Special Offer 📢</label>
            <input placeholder="E.g., 10% off on all burgers today!" value={stallProfile.promotion} onChange={e => setStallProfile({...stallProfile, promotion: e.target.value})} />

            <label>Minimum Preparation Time (minutes)</label>
            <input type="number" value={stallProfile.min_pickup_time} onChange={e => setStallProfile({...stallProfile, min_pickup_time: parseInt(e.target.value)})} required />

            <label>Stall Categories</label>
            <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: '24px' }}>
              {['Fast Food', 'Asian', 'Healthy', 'Burgers', 'Beverages', 'Desserts'].map(cat => (
                <button
                  type="button"
                  key={cat}
                  className={stallProfile.categories.includes(cat) ? 'primary' : 'ghost'}
                  style={{ borderRadius: '20px', padding: '6px 16px' }}
                  onClick={() => {
                    const exists = stallProfile.categories.includes(cat);
                    const updated = exists ? stallProfile.categories.filter(c => c !== cat) : [...stallProfile.categories, cat];
                    setStallProfile({...stallProfile, categories: updated});
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button type="submit" className="primary">Save Settings 💾</button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
