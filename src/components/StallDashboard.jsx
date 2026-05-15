"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from './DashboardLayout';
import StatusStepper, { STATUSES } from './StatusStepper';

const generateUUID = () => {
  if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const detectEmoji = (text) => {
  const str = text.toLowerCase();
  if (/burger|cheeseburger|patty|whopper|slider/i.test(str)) return '🍔';
  if (/fries|chips|potato/i.test(str)) return '🍟';
  if (/pizza|slice/i.test(str)) return '🍕';
  if (/sushi|roll|sashimi|nigiri/i.test(str)) return '🍣';
  if (/ramen|noodle|pho|soup|udon|soba/i.test(str)) return '🍜';
  if (/taco|burrito|quesadilla/i.test(str)) return '🌮';
  if (/salad|greens|bowl|healthy/i.test(str)) return '🥗';
  if (/shake|smoothie|drink|beverage|cola|soda/i.test(str)) return '🥤';
  if (/coffee|latte|cappuccino|espresso|tea/i.test(str)) return '☕';
  if (/cake|pastry|dessert|brownie/i.test(str)) return '🍰';
  if (/ice cream|gelato|sundae/i.test(str)) return '🍦';
  if (/chicken|wings|nuggets|tender/i.test(str)) return '🍗';
  if (/curry|tikka|masala|paneer/i.test(str)) return '🍛';
  if (/sandwich|sub|wrap/i.test(str)) return '🥪';
  if (/pie|tart/i.test(str)) return '🥧';
  if (/boba|bubble/i.test(str)) return '🧋';
  if (/pancake|waffle/i.test(str)) return '🥞';
  if (/donut|doughnut/i.test(str)) return '🍩';
  if (/hotdog|sausage/i.test(str)) return '🌭';
  if (/popcorn/i.test(str)) return '🍿';
  if (/bacon/i.test(str)) return '🥓';
  if (/egg|omelette/i.test(str)) return '🍳';
  if (/cheese/i.test(str)) return '🧀';
  if (/rice|biryani|pulao/i.test(str)) return '🍚';
  if (/bread|toast|bun/i.test(str)) return '🍞';
  if (/fruit|apple|banana|berry/i.test(str)) return '🍎';
  if (/fish|salmon|prawn|shrimp/i.test(str)) return '🍤';
  if (/chocolate|choco/i.test(str)) return '🍫';
  if (/asian/i.test(str)) return '🍱';
  if (/dessert/i.test(str)) return '🍨';
  return '🍲'; // default fallback
};

export default function StallDashboard({ db, session, showToast, onLogout, onToggleTheme, theme }) {
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      const slug = parts[parts.length - 1];
      return ['home', 'orders', 'history', 'menu', 'analytics', 'settings'].includes(slug) ? slug : 'home';
    }
    return 'home';
  }); // home, orders, history, menu, analytics, settings

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const newPath = view === 'home' ? '/dashboard' : `/dashboard/${view}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({ view }, '', newPath + window.location.search);
      }
    }
  }, [view]);

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.view) {
        setView(e.state.view);
      } else {
        const parts = window.location.pathname.split('/');
        const slug = parts[parts.length - 1];
        setView(['home', 'orders', 'history', 'menu', 'analytics', 'settings'].includes(slug) ? slug : 'home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [stallStatus, setStallStatus] = useState('Open'); // Open, Busy, Closed
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', price: '', emoji: '🍲', description: '', category: 'Fast Food', available: true, photo: '' });
  const [photoType, setPhotoType] = useState('emoji'); // 'emoji' vs 'upload'
  const [stallProfile, setStallProfile] = useState({ stall_name: '', min_pickup_time: 10, promotion: '', banner_url: '', categories: ['Fast Food'], food_court: 'North Food Court' });
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
        categories: profile.categories || ['Fast Food'],
        food_court: profile.food_court || 'North Food Court',
        status: profile.status || 'Open'
      });
      setStallStatus(profile.status || 'Open');
    }

    if (db.reviews) {
      setReviews(db.reviews.filter(r => r.stall_id === session.id));
    }
  }, [db, session.id]);

  const homeData = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const allStallOrders = db.orders.filter(o => o.stall_id === session.id);
    const todayOrders = allStallOrders.filter(o => o.created_at.startsWith(today));
    
    const revenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = todayOrders.length > 0 ? revenue / todayOrders.length : 0;
    
    const statusCounts = {
      'Queued': orders.filter(o => o.status === 'Order Received').length,
      'Preparing': orders.filter(o => o.status === 'Cooking' || o.status === 'Cooked').length,
      'Ready': orders.filter(o => o.status === 'Ready to Eat').length,
      'Finished': historyOrders.filter(o => o.created_at.startsWith(today)).length
    };

    const itemSales = {};
    todayOrders.forEach(o => {
      o.items.forEach(it => {
        itemSales[it.name] = (itemSales[it.name] || 0) + it.qty;
      });
    });
    const popularItems = Object.entries(itemSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    const delayedOrders = orders.filter(o => {
      const pickup = new Date(o.pickup_time);
      return pickup < now && o.status !== 'Ready to Eat';
    });

    const recentFeed = [...allStallOrders]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(o => ({
        id: o.id,
        type: o.status === 'Order Received' ? 'NEW' : (o.status === 'Picked Up' ? 'COMPLETED' : 'UPDATE'),
        message: o.status === 'Order Received' ? `New order #${o.id.slice(0,5)}` : `Order #${o.id.slice(0,5)} is ${o.status}`,
        time: o.created_at
      }));

    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    return { 
      revenue, 
      todayCount: todayOrders.length, 
      avgOrderValue, 
      statusCounts, 
      popularItems, 
      delayedOrders, 
      recentFeed,
      avgRating,
      totalReviews: reviews.length,
      recentReview: reviews[0]
    };
  }, [db.orders, orders, historyOrders, reviews, session.id]);

  const updateStatus = (orderId, currentStatus) => {
    const nextIdx = STATUSES.indexOf(currentStatus) + 1;
    if (nextIdx < STATUSES.length) {
      db.updateOrderStatus(orderId, STATUSES[nextIdx]);
      showToast(`Order status updated to: ${STATUSES[nextIdx]}!`);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const finalEmoji = newItem.emoji === '🍲' ? detectEmoji(newItem.name + ' ' + newItem.description + ' ' + newItem.category) : newItem.emoji;
    const itemData = {
      id: generateUUID(),
      stall_id: session.id,
      ...newItem,
      emoji: finalEmoji,
      photo: photoType === 'emoji' ? '' : newItem.photo,
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
    setMenu(menu.filter(m => m.id !== itemId));
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
    { label: 'Home', icon: '🏠', active: view === 'home', onClick: () => setView('home') },
    { label: 'Active Orders', icon: '🛎️', active: view === 'orders', onClick: () => setView('orders') },
    { label: 'History', icon: '📜', active: view === 'history', onClick: () => setView('history') },
    { label: 'Menu Manager', icon: '📋', active: view === 'menu', onClick: () => setView('menu') },
    { label: 'Analytics', icon: '📈', active: view === 'analytics', onClick: () => setView('analytics') },
    { label: 'Settings', icon: '⚙️', active: view === 'settings', onClick: () => setView('settings') }
  ];

  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <DashboardLayout sidebarItems={sidebarItems} onLogout={onLogout} userBadge="🏪 Stall Vendor" onToggleTheme={onToggleTheme} theme={theme}>
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }
        .modal-content {
          background: var(--current-card);
          width: 100%;
          max-width: 550px;
          border-radius: 32px;
          padding: 32px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.2);
          position: relative;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        
        .status-badge-compact {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(128,128,128,0.06);
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.85rem;
          margin-top: 12px;
        }
        .order-card.stall-order-card {
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .order-card.stall-order-card:hover {
          transform: translateY(-5px);
          border-color: var(--current-primary);
          box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }
        button.primary {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        button.primary:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(255, 107, 107, 0.3);
        }

        /* Home Dashboard Styles */
        .home-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }
        @media (max-width: 1100px) { .home-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .home-grid { grid-template-columns: 1fr; } }

        .stat-card {
          background: var(--current-card);
          padding: 24px;
          border-radius: 24px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          overflow: hidden;
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 36px rgba(0,0,0,0.08);
          border-color: var(--current-primary);
        }
        .stat-card.urgent {
          animation: pulse-red 2s infinite;
          border-color: #EF4444;
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        .toggle-container {
          display: flex;
          background: rgba(128,128,128,0.1);
          padding: 6px;
          border-radius: 50px;
          gap: 4px;
        }
        .toggle-btn {
          flex: 1;
          padding: 10px 20px;
          border-radius: 40px;
          font-size: 0.9rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          background: transparent;
          color: inherit;
        }
        .toggle-btn.active {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .toggle-btn.open.active { background: #10B981; color: white; }
        .toggle-btn.busy.active { background: #F59E0B; color: white; }
        .toggle-btn.closed.active { background: #EF4444; color: white; }

        .feed-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(128,128,128,0.05);
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }
        .feed-item:hover {
          background: rgba(128,128,128,0.08);
          transform: translateX(4px);
        }

        .delayed-alert {
          background: #FEF2F2;
          border: 2px solid #F87171;
          color: #991B1B;
          padding: 16px;
          border-radius: 20px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          animation: glow-red 1.5s infinite alternate;
        }
        @keyframes glow-red {
          from { box-shadow: 0 0 5px #F87171; }
          to { box-shadow: 0 0 20px #F87171; }
        }

        @media (max-width: 768px) {
          .mobile-column {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .revenue-header {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 16px;
          }
          .revenue-value {
            font-size: 2.8rem !important;
          }
          .stat-grid-2 {
            grid-template-columns: 1fr !important;
          }
          .welcome-header {
            flex-direction: column;
            align-items: flex-start !important;
          }
          .delayed-alert {
            flex-direction: column;
            align-items: stretch !important;
            gap: 16px;
            text-align: center;
          }
          .delayed-alert .flex {
            flex-direction: column;
          }
          .home-grid {
            gap: 12px !important;
          }
          .stat-card {
            padding: 16px !important;
          }
        }
      `}</style>

      {view === 'home' && (
        <div className="animated-list">
          <div className="flex justify-between items-center welcome-header" style={{ marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '4px' }}>Welcome back, Chef! 👨‍🍳</h1>
              <p style={{ opacity: 0.6, fontSize: '1.1rem', margin: 0 }}>Here's what's happening at your stall today.</p>
            </div>
            
            <div className="flex-col gap-2">
              <label style={{ fontSize: '0.8rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase' }}>Stall Status</label>
              <div className="toggle-container">
                <button 
                  className={`toggle-btn open ${stallStatus === 'Open' ? 'active' : ''}`}
                  onClick={() => { 
                    setStallStatus('Open'); 
                    db.updateProfile(session.id, { ...stallProfile, status: 'Open' });
                    showToast("Stall is now OPEN 🟢"); 
                  }}
                >Open</button>
                <button 
                  className={`toggle-btn busy ${stallStatus === 'Busy' ? 'active' : ''}`}
                  onClick={() => { 
                    setStallStatus('Busy'); 
                    db.updateProfile(session.id, { ...stallProfile, status: 'Busy' });
                    showToast("Stall is now BUSY 🟡"); 
                  }}
                >Busy</button>
                <button 
                  className={`toggle-btn closed ${stallStatus === 'Closed' ? 'active' : ''}`}
                  onClick={() => { 
                    setStallStatus('Closed'); 
                    db.updateProfile(session.id, { ...stallProfile, status: 'Closed' });
                    showToast("Stall is now CLOSED 🔴"); 
                  }}
                >Closed</button>
              </div>
            </div>
          </div>

          {homeData.delayedOrders.length > 0 && (
            <div className="delayed-alert">
              <div className="flex items-center gap-4">
                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                <div>
                  <strong style={{ display: 'block' }}>Action Required: {homeData.delayedOrders.length} Delayed Orders</strong>
                  <span style={{ fontSize: '0.9rem' }}>These orders are past their expected pickup time.</span>
                </div>
              </div>
              <button className="primary" style={{ padding: '8px 16px', background: '#991B1B' }} onClick={() => setView('orders')}>
                View Orders
              </button>
            </div>
          )}

          <div className="home-grid">
            <div className="stat-card" style={{ borderLeft: '6px solid #6366F1' }}>
              <div className="flex justify-between items-center">
                <span style={{ fontSize: '2.5rem' }}>📥</span>
                <span className="badge" style={{ background: '#6366F1' }}>New</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900 }}>{homeData.statusCounts.Queued}</div>
              <div style={{ opacity: 0.7, fontWeight: 700 }}>Queued Orders</div>
            </div>

            <div className="stat-card" style={{ borderLeft: '6px solid #F59E0B' }}>
              <div className="flex justify-between items-center">
                <span style={{ fontSize: '2.5rem' }}>🔥</span>
                <span className="badge" style={{ background: '#F59E0B' }}>Preparing</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900 }}>{homeData.statusCounts.Preparing}</div>
              <div style={{ opacity: 0.7, fontWeight: 700 }}>Preparing</div>
            </div>

            <div className="stat-card" style={{ borderLeft: '6px solid #10B981' }}>
              <div className="flex justify-between items-center">
                <span style={{ fontSize: '2.5rem' }}>🎁</span>
                <span className="badge" style={{ background: '#10B981' }}>Ready</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900 }}>{homeData.statusCounts.Ready}</div>
              <div style={{ opacity: 0.7, fontWeight: 700 }}>Ready for Pickup</div>
            </div>

            <div className="stat-card" style={{ borderLeft: '6px solid #3B82F6' }}>
              <div className="flex justify-between items-center">
                <span style={{ fontSize: '2.5rem' }}>✅</span>
                <span className="badge" style={{ background: '#3B82F6' }}>Done</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900 }}>{homeData.statusCounts.Finished}</div>
              <div style={{ opacity: 0.7, fontWeight: 700 }}>Finished Today</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', marginBottom: '32px' }} className="mobile-column">
            <div className="flex-col gap-6">
              <div className="card" style={{ padding: '32px' }}>
                <h3 className="section-title">Today's Revenue</h3>
                <div className="flex justify-between items-end revenue-header" style={{ flexWrap: 'wrap', gap: '20px' }}>
                  <div>
                    <div className="revenue-value" style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--current-primary)', lineHeight: 1 }}>₹{homeData.revenue.toFixed(2)}</div>
                    <div style={{ opacity: 0.5, fontWeight: 700, marginTop: '8px' }}>Total Sales from {homeData.todayCount} orders</div>
                  </div>
                  <div className="flex gap-8">
                    <div className="text-center">
                      <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{homeData.todayCount}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>Orders</div>
                    </div>
                    <div className="text-center">
                      <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>₹{homeData.avgOrderValue.toFixed(0)}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>Avg Value</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="stat-grid-2">
                <div className="card" style={{ padding: '24px' }}>
                  <h3 className="section-title">Avg. Prep Time</h3>
                  <div className="flex items-center gap-4">
                    <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '1.5rem' }}>⏱️</div>
                    <div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{stallProfile.min_pickup_time}m</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>Current Target</div>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: '24px' }}>
                  <h3 className="section-title">Customer Satisfaction</h3>
                  <div className="flex items-center gap-4">
                    <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(255, 217, 61, 0.1)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '1.5rem' }}>⭐</div>
                    <div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{homeData.avgRating.toFixed(1)}</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>From {homeData.totalReviews} reviews</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card flex-col" style={{ padding: '24px' }}>
              <h3 className="section-title">Popular Today</h3>
              <div className="flex-col gap-3" style={{ flex: 1 }}>
                {homeData.popularItems.length === 0 ? (
                  <div style={{ opacity: 0.5, textAlign: 'center', padding: '40px' }}>No items sold today yet.</div>
                ) : (
                  homeData.popularItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center" style={{ padding: '12px 16px', background: 'rgba(128,128,128,0.05)', borderRadius: '16px' }}>
                      <div className="flex items-center gap-4">
                        <span style={{ fontWeight: 900, color: 'var(--current-primary)', fontSize: '1.1rem' }}>#{idx + 1}</span>
                        <span style={{ fontWeight: 700 }}>{item.name}</span>
                      </div>
                      <span className="badge" style={{ background: 'rgba(255, 107, 107, 0.1)', color: 'var(--current-primary)' }}>{item.qty} sold</span>
                    </div>
                  ))
                )}
              </div>
              <button className="ghost" style={{ marginTop: '20px', width: '100%' }} onClick={() => setView('menu')}>Manage Menu</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }} className="mobile-column">
            <div className="card flex-col" style={{ padding: '24px' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
                <h3 className="section-title" style={{ margin: 0 }}>Recent Activities</h3>
                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Live Feed</span>
              </div>
              <div className="flex-col">
                {homeData.recentFeed.map((item, idx) => (
                  <div key={idx} className="feed-item">
                    <div style={{ 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%', 
                      background: item.type === 'NEW' ? '#6366F1' : (item.type === 'COMPLETED' ? '#10B981' : '#F59E0B') 
                    }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.message}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card flex-col" style={{ padding: '24px' }}>
              <h3 className="section-title">Latest Review</h3>
              {homeData.recentReview ? (
                <div className="flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{ color: i < homeData.recentReview.rating ? '#FFD93D' : '#E5E7EB' }}>★</span>
                      ))}
                    </div>
                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{new Date(homeData.recentReview.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontStyle: 'italic', opacity: 0.9 }}>"{homeData.recentReview.comment}"</p>
                  <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                    <button className="ghost" style={{ width: '100%' }} onClick={() => setView('analytics')}>View All Reviews</button>
                  </div>
                </div>
              ) : (
                <div style={{ opacity: 0.5, textAlign: 'center', padding: '40px' }}>No reviews yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

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
                const statusIcons = {
                  'Order Received': '📥',
                  'Cooking': '👨‍🍳',
                  'Cooked': '✅',
                  'Ready to Eat': '🎉'
                };
                const isDelayed = new Date(order.pickup_time) < new Date() && order.status !== 'Ready to Eat';
                return (
                  <div key={order.id} className={`order-card stall-order-card ${isDelayed ? 'urgent' : ''}`} onClick={() => setSelectedOrder(order)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="order-card-id">#{order.id.slice(0, 5).toUpperCase()}</h3>
                        <div className="order-customer-name">👤 {order.customer_name}</div>
                      </div>
                      <span className="badge" style={{ fontSize: '0.85rem', background: isDelayed ? '#EF4444' : '' }}>
                        ⏰ {new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="status-badge-compact">
                      <span>{statusIcons[order.status] || '⚡'}</span>
                      <span style={{ color: order.status === 'Ready to Eat' ? '#10B981' : 'inherit' }}>
                        {order.status}
                      </span>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '900', color: 'rgba(0,0,0,0.4)', letterSpacing: '0.5px', marginBottom: '12px' }}>ORDER ITEMS</div>
                      <ul className="receipt-list" style={{ gap: '10px' }}>
                        {order.items.slice(0, 3).map((it, idx) => (
                          <li key={idx} className="receipt-item" style={{ marginBottom: '8px' }}>
                            <div className="flex items-center gap-3">
                              <span className="receipt-item-qty" style={{ fontSize: '0.8rem', padding: '2px 6px' }}>{it.qty}x</span>
                              <span style={{ fontSize: '1.2rem' }}>{it.emoji || '🍲'}</span>
                              <span className="receipt-item-name" style={{ fontSize: '0.9rem', fontWeight: '700' }}>{it.name}</span>
                            </div>
                            <span className="receipt-item-price" style={{ fontSize: '0.85rem', opacity: 0.6 }}>₹{(it.price * it.qty).toFixed(2)}</span>
                          </li>
                        ))}
                        {order.items.length > 3 && (
                          <div style={{ fontSize: '0.8rem', opacity: 0.5, fontStyle: 'italic', marginTop: '4px' }}>
                            + {order.items.length - 3} more items...
                          </div>
                        )}
                      </ul>
                    </div>

                    <div className="order-card-divider" style={{ margin: '16px 0' }}></div>
                    
                    <div className="flex justify-between items-center">
                      <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Total Amount</span>
                      <span style={{ fontWeight: 900, color: 'var(--current-primary)', fontSize: '1.1rem' }}>₹{Number(order.total).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button 
              className="ghost" 
              onClick={() => setSelectedOrder(null)}
              style={{ position: 'absolute', top: '24px', right: '24px', padding: '8px', width: '40px', height: '40px', borderRadius: '50%' }}
            >
              ✕
            </button>

            <div style={{ marginBottom: '24px' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
                <span className="badge">Order Detail</span>
                <span style={{ opacity: 0.5 }}>#{selectedOrder.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <h2 style={{ fontSize: '2.2rem', margin: 0 }}>{selectedOrder.customer_name}</h2>
              <div style={{ opacity: 0.6 }}>Expected pickup at {new Date(selectedOrder.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>

            <div className="order-card-divider"></div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', margin: '24px 0', paddingRight: '10px' }} className="hide-scrollbar">
              <h3 className="section-title">Order Items</h3>
              <ul className="receipt-list">
                {selectedOrder.items.map((it, idx) => (
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

              {selectedOrder.special_instructions && (
                <div style={{ 
                  background: 'rgba(255, 107, 107, 0.08)', 
                  padding: '16px', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(255, 107, 107, 0.2)',
                  marginTop: '20px',
                  fontWeight: '700',
                  color: 'var(--current-primary)'
                }}>
                  📝 Notes: "{selectedOrder.special_instructions}"
                </div>
              )}
            </div>

            <div className="order-card-divider"></div>

            <div style={{ marginTop: '24px' }}>
              <StatusStepper 
                currentStatus={selectedOrder.status} 
                onStatusClick={(newStatus) => {
                  db.updateOrderStatus(selectedOrder.id, newStatus);
                  setSelectedOrder({...selectedOrder, status: newStatus});
                  showToast(`Order status jumped to: ${newStatus} ✨`);
                }}
              />
              
              <div className="flex gap-4" style={{ marginTop: '32px' }}>
                {selectedOrder.status !== 'Ready to Eat' ? (
                  <button 
                    className="primary" 
                    style={{ flex: 1, padding: '18px' }}
                    onClick={() => {
                      updateStatus(selectedOrder.id, selectedOrder.status);
                      // Update local state to reflect change immediately in modal
                      const nextIdx = STATUSES.indexOf(selectedOrder.status) + 1;
                      if (nextIdx < STATUSES.length) {
                        setSelectedOrder({...selectedOrder, status: STATUSES[nextIdx]});
                      }
                    }}
                  >
                    {(() => {
                      const labels = {
                        'Order Received': 'Start Cooking 👨‍🍳',
                        'Cooking': 'Mark as Cooked ✅',
                        'Cooked': 'Ready for Pickup 🎉'
                      };
                      return labels[selectedOrder.status] || 'Next Step';
                    })()}
                  </button>
                ) : (
                  <div style={{ 
                    flex: 1, 
                    textAlign: 'center', 
                    padding: '16px', 
                    background: '#10B981', 
                    color: 'white', 
                    borderRadius: '16px',
                    fontWeight: '800'
                  }}>
                    ✅ Order Ready for Pickup
                  </div>
                )}
              </div>
            </div>
          </div>
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
                  <input 
                    value={newItem.name} 
                    onChange={e => {
                      const name = e.target.value;
                      const detectedEmoji = detectEmoji(name);
                      setNewItem(prev => ({
                        ...prev, 
                        name, 
                        emoji: detectedEmoji
                      }));
                    }} 
                    required 
                  />
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
                  <div className="flex justify-between items-center" style={{ marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>Emoji Icon</label>
                    <span style={{ fontSize: '0.75rem', opacity: 0.6, fontStyle: 'italic' }}>✨ Auto-suggested from dish name</span>
                  </div>
                  <input value={newItem.emoji} onChange={e => setNewItem({...newItem, emoji: e.target.value})} required />
                </div>
              ) : (
                <div className="flex-col">
                  <label>Photo URL</label>
                  <input type="url" placeholder="https://images.unsplash.com/..." value={newItem.photo} onChange={e => setNewItem({...newItem, photo: e.target.value})} required />
                </div>
              )}

              <label>Description</label>
              <textarea 
                value={newItem.description} 
                onChange={e => {
                  const description = e.target.value;
                  setNewItem(prev => ({
                    ...prev, 
                    description,
                    emoji: prev.emoji === '🍲' ? detectEmoji(prev.name + ' ' + description) : prev.emoji
                  }));
                }} 
                rows="2" 
                required 
              />

              <label>Category</label>
              <select 
                value={newItem.category} 
                onChange={e => {
                  const category = e.target.value;
                  setNewItem(prev => ({
                    ...prev, 
                    category,
                    emoji: prev.emoji === '🍲' ? detectEmoji(prev.name + ' ' + prev.description + ' ' + category) : prev.emoji
                  }));
                }}
              >
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

            <label>Food Court Name 📍</label>
            <input 
              type="text" 
              placeholder="E.g., North Campus Food Court" 
              value={stallProfile.food_court} 
              onChange={e => setStallProfile({...stallProfile, food_court: e.target.value})} 
              style={{ marginBottom: '24px' }} 
              required 
            />

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

