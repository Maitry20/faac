"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from './DashboardLayout';
import StatusStepper from './StatusStepper';

const generateUUID = () => {
  if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function UserDashboard({ db, session, showToast, onLogout, onToggleTheme, theme }) {
  const [isMobile, setIsMobile] = useState(false);
  const [stalls, setStalls] = useState([]);
  const [selectedStall, setSelectedStall] = useState(null);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      const slug = parts[parts.length - 1];
      return ['orders', 'history', 'stats', 'profile', 'menu'].includes(slug) ? slug : 'home';
    }
    return 'home';
  }); // home (stalls), menu, orders, history, stats, profile

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize(); // initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        // Fallback for dashboard home
        const parts = window.location.pathname.split('/');
        const slug = parts[parts.length - 1];
        setView(['orders', 'history', 'stats', 'profile', 'menu'].includes(slug) ? slug : 'home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [myOrders, setMyOrders] = useState([]);
  const [myHistory, setMyHistory] = useState([]);
  const [exitingOrders, setExitingOrders] = useState(new Set());
  const [animatingOrders, setAnimatingOrders] = useState(new Set());
  const [pickupTime, setPickupTime] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFoodCourt, setSelectedFoodCourt] = useState('All');
  const [reviewDraft, setReviewDraft] = useState({ orderId: null, stall_id: null, rating: 5, comment: '' });
  const [flippedStalls, setFlippedStalls] = useState({});

  const toggleFlip = (e, id) => {
    e.stopPropagation();
    setFlippedStalls(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Group Tray State
  const [groupTray, setGroupTray] = useState(null); // { id, host, stallId, stallName, members: [{ id: 'm1', name: 'You', items: [] }] }
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('m1');
  const [showGroupSplitModal, setShowGroupSplitModal] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  const stats = useMemo(() => {
    const allUserOrders = db.orders.filter(o => o.user_id === session.id);
    const totalSpent = allUserOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    // Favorite Stall
    const stallCounts = {};
    allUserOrders.forEach(o => {
      stallCounts[o.stall_id] = (stallCounts[o.stall_id] || 0) + 1;
    });
    const favStallId = Object.entries(stallCounts).sort((a,b) => b[1] - a[1])[0]?.[0];
    const favStall = db.profiles.find(p => p.id === favStallId)?.stall_name || 'None yet';

    // Most Ordered Item
    const itemCounts = {};
    allUserOrders.forEach(o => {
      o.items.forEach(it => {
        itemCounts[it.name] = (itemCounts[it.name] || 0) + it.qty;
      });
    });
    const topItem = Object.entries(itemCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'None yet';

    // Monthly Data
    const monthlyMap = {};
    allUserOrders.forEach(o => {
      const month = new Date(o.created_at).toLocaleString('default', { month: 'short' });
      monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    });
    const monthlyData = Object.entries(monthlyMap).map(([name, count]) => ({ name, count }));

    // Rank Logic
    let rank = 'Snack Scout 🥨';
    let rankColor = '#94A3B8';
    if (allUserOrders.length > 20) { rank = 'Foodie Legend 👑'; rankColor = '#F59E0B'; }
    else if (allUserOrders.length > 10) { rank = 'Flavor Master 👨‍🍳'; rankColor = '#10B981'; }
    else if (allUserOrders.length > 5) { rank = 'Hunger Hero 🦸'; rankColor = '#3B82F6'; }

    return { totalOrders: allUserOrders.length, totalSpent, favStall, topItem, monthlyData, rank, rankColor };
  }, [db.orders, db.profiles, session.id]);

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
  }, [isCartOpen, selectedStall, db.orders]);

  const categories = ['All', 'Fast Food', 'Asian', 'Healthy', 'Burgers', 'Beverages'];
  const foodCourtsList = useMemo(() => {
    const courts = new Set();
    db.profiles.forEach(p => {
      if (p.role === 'stall' && p.is_approved && p.food_court) {
        courts.add(p.food_court.trim());
      }
    });
    return ['All', ...Array.from(courts)];
  }, [db.profiles]);

  const userProfile = db.profiles.find(p => p.id === session.id) || session.profileData;

  useEffect(() => {
    const currentProfile = db.profiles.find(p => p.id === session.id);
    if (currentProfile) {
      setProfile({
        name: currentProfile.name || '',
        email: currentProfile.email || ''
      });
    }

    const allStalls = db.profiles.filter(p => p.role === 'stall' && p.is_approved);
    
    const filteredStalls = allStalls.filter(st => {
      const matchesSearch = (st.stall_name || '').toLowerCase().includes((searchQuery || '').toLowerCase());
      const matchesCategory = selectedCategory === 'All' || (st.categories && st.categories.includes(selectedCategory));
      const matchesFoodCourt = selectedFoodCourt === 'All' || (st.food_court && st.food_court.trim().toLowerCase() === selectedFoodCourt.trim().toLowerCase());
      return matchesSearch && matchesCategory && matchesFoodCourt;
    });
    setStalls(filteredStalls);

    const stallMap = allStalls.reduce((acc, st) => ({...acc, [st.id]: st.stall_name}), {});
    const userOrders = db.orders.filter(o => o.user_id === session.id && (o.status !== 'Picked Up' || exitingOrders.has(o.id))).map(o => ({
      ...o, stall_name: stallMap[o.stall_id] || 'Unknown Stall'
    })).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    setMyOrders(userOrders);

    const historyOrders = db.orders.filter(o => o.user_id === session.id && o.status === 'Picked Up').map(o => ({
      ...o, stall_name: stallMap[o.stall_id] || 'Unknown Stall'
    })).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    setMyHistory(historyOrders);

    if (selectedStall) {
      const isValid = allStalls.some(s => s.id === selectedStall.id);
      if (!isValid) {
        setSelectedStall(null);
        setView('home');
      } else {
        setMenu(db.menuItems.filter(m => m.stall_id === selectedStall.id));
      }
    }
  }, [db, session.id, selectedStall, searchQuery, selectedCategory, selectedFoodCourt, exitingOrders]);

  const openStallMenu = (stall) => {
    if (stall.status === 'Closed') {
      showToast(`${stall.stall_name} is currently Closed 🛑`, "error");
      return;
    }
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

  const submitReview = (e) => {
    e.preventDefault();
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

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    db.updateProfile(session.id, profile);
    showToast("Profile updated! ✨", "success");
  };

  const addToCart = (item) => {
    const stall = db.profiles.find(p => p.id === selectedStall?.id);
    if (stall?.status === 'Closed') {
      showToast("This stall is now closed 🛑", "error");
      return;
    }

    if (groupTray) {
      const currentMember = groupTray.members.find(m => m.id === selectedMemberId);
      if (!currentMember) return;
      const existing = currentMember.items.find(i => i.id === item.id);
      let updatedItems;
      if (existing) {
        updatedItems = currentMember.items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      } else {
        updatedItems = [...currentMember.items, { ...item, qty: 1 }];
      }
      const updatedMembers = groupTray.members.map(m => m.id === selectedMemberId ? { ...m, items: updatedItems } : m);
      setGroupTray({ ...groupTray, members: updatedMembers });
      showToast(`Added ${item.name} for ${currentMember.name} 🍱`);
      return;
    }

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
    const stall = db.profiles.find(p => p.id === selectedStall?.id);
    if (stall?.status === 'Closed') {
      showToast("This stall is now closed. Order cannot be placed. 🛑", "error");
      return;
    }

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
      special_instructions: specialInstructions,
      created_at: new Date().toISOString()
    };

    db.addOrder(orderData);
    
    showToast("Order placed! 🎉 See you soon!", "success");
    setCart([]);
    setSpecialInstructions('');
    setIsCartOpen(false);
    setView('orders');
  };

  const startGroupTray = () => {
    const trayId = `GRP-${Math.floor(100 + Math.random() * 900)}`;
    setGroupTray({
      id: trayId,
      host: userProfile?.name || 'You',
      stallId: selectedStall.id,
      stallName: selectedStall.stall_name,
      members: [{ id: 'm1', name: userProfile?.name || 'You', items: [] }]
    });
    setSelectedMemberId('m1');
    showToast(`Group Tray #${trayId} created! Invite friends. 👥`, "success");
  };

  const handleJoinRoom = () => {
    if (!joinRoomCode.trim()) return;
    const code = joinRoomCode.trim().toUpperCase();
    const mockStall = stalls[0] || db.profiles.find(p => p.role === 'stall');
    
    setSelectedStall(mockStall);
    setMenu(db.menuItems.filter(m => m.stall_id === mockStall.id));
    setGroupTray({
      id: code,
      host: 'Friend',
      stallId: mockStall.id,
      stallName: mockStall.stall_name,
      members: [
        { id: 'm-host', name: 'Host Friend', items: [{ id: 'm1', name: 'Classic Burger', price: 149, qty: 1, emoji: '🍔' }] },
        { id: 'm1', name: userProfile?.name || 'You', items: [] }
      ]
    });
    setSelectedMemberId('m1');
    setShowJoinModal(false);
    setJoinRoomCode('');
    setView('menu');
    showToast(`Successfully joined Room #${code}! 🤝`, "success");
  };

  const sidebarItems = [
    { label: 'Home', icon: '🏠', active: view === 'home' || view === 'menu', onClick: () => { setView('home'); setSelectedStall(null); } },
    { label: 'My Orders', icon: '🧾', active: view === 'orders', onClick: () => setView('orders') },
    { label: 'History', icon: '🕰️', active: view === 'history', onClick: () => setView('history') },
    { label: 'Stats', icon: '📊', active: view === 'stats', onClick: () => setView('stats') },
    { label: 'Profile', icon: '👤', active: view === 'profile', onClick: () => setView('profile') }
  ];

  return (
    <DashboardLayout sidebarItems={sidebarItems} onLogout={onLogout} userBadge="😋 Foodie" onToggleTheme={onToggleTheme} theme={theme}>
      {view === 'home' && (
        <div className="animated-list">
          <div className="flex justify-between items-center" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <img src="/food_banner.png" alt="Delicious Food Banner" className="top-banner" style={{ width: '100%' }} />
          </div>

          <div className="flex justify-between items-center" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ fontSize: '2rem', margin: 0 }}>Discover Stalls</h2>
            <button className="accent card" style={{ padding: '10px 20px', fontWeight: '900' }} onClick={() => setShowJoinModal(true)}>
              🤝 Join Group Room
            </button>
          </div>
          
          <div className="flex gap-4 items-center" style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Search for stalls or dishes..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, margin: 0, minWidth: '250px' }}
            />
            <div className="flex items-center gap-2">
              <span style={{ fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>📍 Food Court:</span>
              <select 
                value={selectedFoodCourt} 
                onChange={e => setSelectedFoodCourt(e.target.value)}
                style={{ margin: 0, borderRadius: '16px', padding: '8px 16px', fontWeight: 700 }}
              >
                {foodCourtsList.map(fc => <option key={fc} value={fc}>{fc === 'All' ? 'All Locations' : fc}</option>)}
              </select>
            </div>
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
                <h2>No stalls found 🏗️</h2>
                <p>Try selecting a different food court or category!</p>
              </div>
            ) : (
              stalls.map(stall => {
                const statusClass = `status-${(stall.status || 'Open').toLowerCase()}`;
                return (
                  <div key={stall.id} className={`stall-card ${statusClass} ${flippedStalls[stall.id] && !isMobile ? 'is-flipped' : ''}`} style={{ cursor: 'pointer', position: 'relative' }} onClick={() => openStallMenu(stall)}>
                  {!isMobile ? (
                    <>
                      <div className="stall-card-inner">
                        {/* Front of Card */}
                        <div className="stall-card-front">
                          {/* Floating Heart Button at Top Left */}
                          <button 
                            className="ghost heart-btn" 
                            style={{ position: 'absolute', top: 12, left: 12, zIndex: 12, padding: 8, fontSize: '1.2rem', background: 'rgba(255,255,255,0.95)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            onClick={(e) => { e.stopPropagation(); db.toggleFavorite(session.id, stall.id); }}
                          >
                            {userProfile?.favorite_stalls?.includes(stall.id) ? '❤️' : '🤍'}
                          </button>

                          <button 
                            className="ghost info-btn" 
                            style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 8, fontSize: '1.2rem', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            onClick={(e) => toggleFlip(e, stall.id)}
                            title="View Stall Description"
                          >
                            ℹ️
                          </button>

                          <div className="stall-card-img-wrapper">
                            {stall.banner_url ? (
                              <img 
                                src={stall.banner_url} 
                                alt="Banner" 
                                className="banner-img" 
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = ''; // Force fallback div
                                  e.target.parentElement.innerHTML = '<div class="banner-img flex items-center justify-center" style="background: var(--current-primary); opacity: 0.2; fontSize: 3rem">🏪</div>';
                                }}
                              />
                            ) : (
                              <div className="banner-img flex items-center justify-center" style={{ background: 'var(--current-primary)', opacity: 0.2, fontSize: '3rem' }}>🏪</div>
                            )}
                          </div>
                          
                          <div className="stall-card-content">
                            <div className="flex justify-between items-start stall-card-header">
                              <h3 style={{ margin: '0 0 2px 0', fontWeight: '800' }}>{stall.stall_name || 'Unnamed Stall'}</h3>
                            </div>
                            
                            <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
                              <span className="badge" style={{ background: '#FF6B6B', color: 'white', fontSize: '0.65rem', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                ⏱️ {getDynamicWaitTime(stall.id, stall.min_pickup_time)}m
                              </span>
                            </div>

                            <div className="flex justify-between items-end" style={{ marginTop: 'auto' }}>
                              <div style={{ fontSize: '0.7rem', opacity: 0.6, fontWeight: '600' }}>
                                {stall.categories && stall.categories.join(' • ')}
                              </div>
                              
                              <div className="flex-col items-end gap-1">
                                <span className="badge" style={{ background: '#FF6B6B', color: 'white', fontSize: '0.65rem', padding: '4px 10px', borderRadius: '20px', fontWeight: '800' }}>
                                  📍 {stall.food_court_short || stall.food_court?.split(' ')[0] || 'FC'}
                                </span>
                                
                                {stall.rating && (
                                  <div style={{ fontWeight: '800', fontSize: '0.8rem', color: '#FFB800', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    ⭐ {stall.rating.toFixed(1)}
                                  </div>
                                )}

                                {/* Mobile Description Toggle */}
                                <div 
                                  className={`mobile-desc-toggle ${flippedStalls[stall.id] ? 'active' : ''}`}
                                  onClick={(e) => toggleFlip(e, stall.id)}
                                  style={{ padding: '4px', marginTop: '2px' }}
                                >
                                  <span style={{ fontSize: '0.9rem' }}>▼</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Back of Card */}
                        <div className="stall-card-back" onClick={(e) => toggleFlip(e, stall.id)}>
                          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏬</div>
                          <h3>{stall.stall_name}</h3>
                          <p>{stall.description || "Fresh food, great taste! Visit us to explore our specialties. 😊"}</p>
                          <button className="ghost" style={{ marginTop: '24px', padding: '8px 20px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            Back to Menu ↩️
                          </button>
                        </div>
                      </div>

                      <div className={`mobile-desc-drawer ${flippedStalls[stall.id] ? 'open' : ''}`}>
                        <p>{stall.description || "Fresh food, great taste! Visit us to explore our specialties. 😊"}</p>
                      </div>
                    </>
                  ) : (
                    /* Mobile Version matching image */
                    <>
                      <div className={`stall-card-mobile ${flippedStalls[stall.id] ? 'is-expanded' : ''}`}>
                        <div className="mobile-card-img-wrapper">
                          <button className="heart-btn-mobile" onClick={(e) => { e.stopPropagation(); db.toggleFavorite(session.id, stall.id); }}>
                            {userProfile?.favorite_stalls?.includes(stall.id) ? '❤️' : '🤍'}
                          </button>
                          <div className="wait-time-pill-mobile">
                            ⏱️ {getDynamicWaitTime(stall.id, stall.min_pickup_time)}m
                          </div>
                          <span className="location-pill-mobile floating-badge">
                            🍷 {stall.food_court_short || stall.food_court?.split(' ')[0] || 'Main'}
                          </span>
                          {stall.banner_url ? (
                            <img src={stall.banner_url} alt="Banner" onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: 'var(--current-primary)', opacity: 0.2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🏪</div>
                          )}
                        </div>
                        
                        <div className="mobile-card-content">
                          <div className="mobile-sheet-handle"></div>
                          
                          <div className="mobile-card-header">
                            <h3 className="stall-title-mobile">{stall.stall_name || 'Unnamed Stall'}</h3>
                            <span className="location-pill-mobile header-badge">
                              🍷 {stall.food_court_short || stall.food_court?.split(' ')[0] || 'Main'}
                            </span>
                            <div className="stall-rating-mobile header-rating">
                              ⭐ {stall.rating ? stall.rating.toFixed(1) : '5.0'}
                            </div>
                          </div>
                          
                          <div className="mobile-card-desc-row">
                            <p className="stall-desc-mobile">
                              {(() => {
                                const parts = (stall.description || "Juicy burgers, crispy fries and more!").split('. ');
                                return parts[0] ? parts[0] + (parts.length > 1 ? '.' : '') : '';
                              })()}
                            </p>
                            <div className="stall-rating-mobile normal-rating">
                              ⭐ {stall.rating ? stall.rating.toFixed(1) : '5.0'}
                            </div>
                          </div>
                          
                          <div className="mobile-card-categories">
                            {stall.categories && stall.categories.slice(0, 2).map((cat, i) => (
                              <React.Fragment key={cat}>
                                <span className="cat-pill-mobile">{cat}</span>
                                {i === 0 && stall.categories.length > 1 && <span className="cat-dot-mobile">•</span>}
                              </React.Fragment>
                            ))}
                          </div>

                          <div className={`mobile-desc-drawer ${flippedStalls[stall.id] ? 'open' : ''}`}>
                            <p style={{ display: 'flex', alignItems: 'center' }}>
                              {(() => {
                                const parts = (stall.description || "Juicy burgers, crispy fries and more!").split('. ');
                                return parts.slice(1).join('. ') || stall.description || "Fresh food, great taste! Visit us to explore our specialties. 😊";
                              })()}
                            </p>
                          </div>
                          
                          <div className="mobile-card-divider"></div>
                          
                          <div className="mobile-card-footer">
                            <div 
                              className="view-menu-btn-wrapper" 
                              onClick={() => openStallMenu(stall)}
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                            >
                              <span className="view-menu-text">View Menu</span>
                              <span className="view-menu-icon">→</span>
                            </div>
                            <button 
                              className={`ghost chevron-btn-mobile ${flippedStalls[stall.id] ? 'active' : ''}`}
                              onClick={(e) => { e.stopPropagation(); toggleFlip(e, stall.id); }}
                            >
                              <svg 
                                width="14" 
                                height="14" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="3" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                style={{ 
                                  color: '#FF5A5F',
                                  transition: 'transform 0.3s ease',
                                  transform: flippedStalls[stall.id] ? 'rotate(180deg)' : 'rotate(0deg)'
                                }}
                              >
                                <path d="M6 9l6 6 6-6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
          </div>
        </div>
      )}

      {view === 'menu' && selectedStall && (
        <div className="animated-list">
          <div className="flex justify-between items-center" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <button className="back-btn" onClick={() => { setView('home'); setSelectedStall(null); }} style={{ margin: 0 }}>
              <div className="arrow-circle">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              Back to Stalls
            </button>

            {!groupTray ? (
              <button className="accent card" style={{ padding: '10px 24px', fontWeight: '900', fontSize: '1.1rem' }} onClick={startGroupTray}>
                👥 Start Group Tray (Split Bill)
              </button>
            ) : (
              <button className="ghost" style={{ padding: '10px 24px', borderColor: '#EF4444', color: '#EF4444' }} onClick={() => setGroupTray(null)}>
                Leave Group Room
              </button>
            )}
          </div>
          
          {selectedStall.promotion && (
            <div className="promotion-banner">
              📢 <strong>Special Offer:</strong> {selectedStall.promotion}
            </div>
          )}

          {groupTray && (
            <div className="card flex justify-between items-center" style={{ background: 'var(--current-surface-hover)', borderColor: 'var(--current-primary)', borderWidth: '2px', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="badge" style={{ background: 'var(--current-accent)', color: '#2D2D2D', marginBottom: '4px' }}>👥 Active Room: #{groupTray.id}</span>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Ordering for: <span style={{ color: 'var(--current-primary)' }}>{groupTray.members.find(m => m.id === selectedMemberId)?.name}</span></div>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <label style={{ fontWeight: 'bold', opacity: 0.7 }}>Select Person:</label>
                <select value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} style={{ margin: 0, padding: '8px 16px', width: 'auto', borderRadius: '12px' }}>
                  {groupTray.members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <button className="primary" style={{ padding: '8px 20px', fontWeight: '900' }} onClick={() => setIsCartOpen(true)}>
                  View Hub 🧺 ({groupTray.members.reduce((sum, m) => sum + m.items.reduce((s, i) => s + i.qty, 0), 0)})
                </button>
              </div>
            </div>
          )}

          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>{selectedStall.stall_name} Menu</h2>
          {db.profiles.find(p => p.id === selectedStall.id)?.status === 'Closed' && (
            <div className="delayed-alert" style={{ marginBottom: '24px', background: '#FEF2F2', borderColor: '#EF4444', color: '#B91C1C' }}>
              <span>🛑 This stall just closed. You won't be able to place new orders.</span>
            </div>
          )}
          
          {menu.length === 0 ? (
            <div className="empty-state card"><h2>Menu is empty 😴</h2></div>
          ) : (
            <div className="grid-cards">
              {menu.map(item => (
                <div key={item.id} className={`card flex-col justify-between ${!item.available ? 'sold-out-card' : ''}`}>
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
                <div key={order.id} className={`card ${animatingOrders.has(order.id) ? 'card-exit' : ''}`}>
                  <div className="flex justify-between items-center order-header" style={{ marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>
                      {order.stall_name} 
                      {order.id.startsWith('grp-') && <span className="badge" style={{ marginLeft: '8px', background: 'var(--current-accent)', color: '#2D2D2D' }}>👥 Group Order</span>}
                    </h3>
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

                  {order.special_instructions && (
                    <div style={{ 
                      background: 'rgba(128, 128, 128, 0.05)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontStyle: 'italic',
                      marginBottom: '16px'
                    }}>
                      {/allergy|allergic/i.test(order.special_instructions) ? '⚠️ Allergy: ' : '📝 Instructions: '}"{order.special_instructions}"
                    </div>
                  )}

                  <div className="flex gap-2" style={{ marginBottom: '16px' }}>
                    <button className="ghost" style={{ padding: '6px 12px', fontSize: '0.9rem' }} onClick={() => handleReorder(order)}>
                      Reorder 🔁
                    </button>
                    {order.status === 'Ready to Eat' && (
                      <button className="primary" style={{ padding: '6px 12px', fontSize: '0.9rem' }} onClick={() => { 
                        setExitingOrders(prev => new Set(prev).add(order.id));
                        db.updateOrderStatus(order.id, 'Picked Up'); 
                        showToast("Order marked as Picked Up! 😋", "success"); 
                        
                        setTimeout(() => {
                          setAnimatingOrders(prev => new Set(prev).add(order.id));
                        }, 800);

                        setTimeout(() => {
                          setExitingOrders(prev => {
                            const next = new Set(prev);
                            next.delete(order.id);
                            return next;
                          });
                          setAnimatingOrders(prev => {
                            const next = new Set(prev);
                            next.delete(order.id);
                            return next;
                          });
                        }, 1500);
                      }}>
                        Picked ✅
                      </button>
                    )}
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
      {(cart.length > 0 || groupTray) && (
        <button className="primary floating-cart-btn" onClick={() => setIsCartOpen(true)}>
          🛒
          <div className="cart-badge">
            {groupTray 
              ? groupTray.members.reduce((sum, m) => sum + m.items.reduce((s, i) => s + i.qty, 0), 0)
              : cart.reduce((s,i) => s + i.qty, 0)
            }
          </div>
        </button>
      )}

      <div className={`modal-overlay ${isCartOpen ? '' : 'hidden'}`} style={{ display: isCartOpen ? 'flex' : 'none', opacity: isCartOpen ? 1 : 0, transition: 'opacity 0.3s' }} onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setIsCartOpen(false); }}>
        <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
          <div style={{ width: '40px', height: '5px', background: 'rgba(128,128,128,0.25)', borderRadius: '10px', margin: '0 auto 16px', display: 'block' }} className="mobile-only-pill" />
          <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
            <h2>{groupTray ? '👥 Group Tray Hub' : 'Your Tray 🧺'}</h2>
            <button className="ghost" style={{ padding: '4px 12px' }} onClick={() => setIsCartOpen(false)}>❌</button>
          </div>
          
          {groupTray ? (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '16px', background: 'rgba(128,128,128,0.05)', padding: '12px', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 'bold' }}>ROOM CODE</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--current-primary)' }}>{groupTray.id}</div>
                </div>
                <button className="ghost" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => {
                  navigator.clipboard.writeText(`https://foodataclick.campus/join?room=${groupTray.id}`);
                  showToast("Invite Link copied! Share on WhatsApp 🔗");
                }}>Copy Room Link 🔗</button>
              </div>

              {/* Add friend simulation */}
              <div className="flex gap-2 items-center" style={{ marginBottom: '24px', background: 'var(--current-surface-hover)', padding: '12px', borderRadius: '12px', border: '1px dashed rgba(128,128,128,0.2)' }}>
                <input 
                  type="text" 
                  placeholder="Simulate adding friend..." 
                  value={newMemberName} 
                  onChange={e => setNewMemberName(e.target.value)}
                  style={{ margin: 0, flex: 1, padding: '8px 12px' }}
                />
                <button className="accent" style={{ padding: '8px 16px', fontWeight: 'bold' }} onClick={() => {
                  if (!newMemberName.trim()) return;
                  const newId = `m-${Date.now()}`;
                  setGroupTray({
                    ...groupTray,
                    members: [...groupTray.members, { id: newId, name: newMemberName.trim(), items: [] }]
                  });
                  setSelectedMemberId(newId);
                  setNewMemberName('');
                  showToast("Friend joined tray! Select their name to order. 🙋‍♂️");
                }}>Add Friend ➕</button>
              </div>

              {groupTray.members.map(member => {
                const memberTotal = member.items.reduce((s, i) => s + (i.price * i.qty), 0);
                return (
                  <div key={member.id} className="card" style={{ marginBottom: '16px', padding: '16px', borderColor: member.id === selectedMemberId ? 'var(--current-primary)' : 'transparent', borderWidth: '2px' }}>
                    <div className="flex justify-between items-center" style={{ borderBottom: '1px solid rgba(128,128,128,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>
                      <span style={{ fontWeight: '800', fontSize: '1.1rem', color: member.id === selectedMemberId ? 'var(--current-primary)' : 'inherit' }}>
                        👤 {member.name} {member.id === selectedMemberId && '(Active)'}
                      </span>
                      <span style={{ fontWeight: 'bold' }}>₹{memberTotal.toFixed(2)}</span>
                    </div>

                    {member.items.length === 0 ? (
                      <div style={{ opacity: 0.5, fontStyle: 'italic', fontSize: '0.85rem' }}>No items added yet</div>
                    ) : (
                      member.items.map(item => (
                        <div key={item.id} className="menu-item-row" style={{ padding: '6px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{item.emoji}</span>
                            <span>{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ opacity: 0.8 }}>₹{Number(item.price).toFixed(2)} x</span>
                            <button className="card" style={{ padding: '2px 8px' }} onClick={() => {
                              const updatedItems = member.items.map(i => i.id === item.id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0);
                              setGroupTray({
                                ...groupTray,
                                members: groupTray.members.map(m => m.id === member.id ? { ...m, items: updatedItems } : m)
                              });
                            }}>-</button>
                            <span style={{ fontWeight: 'bold', width: '16px', textAlign: 'center' }}>{item.qty}</span>
                            <button className="card" style={{ padding: '2px 8px' }} onClick={() => {
                              const updatedItems = member.items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
                              setGroupTray({
                                ...groupTray,
                                members: groupTray.members.map(m => m.id === member.id ? { ...m, items: updatedItems } : m)
                              });
                            }}>+</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {cart.map(item => (
                <div key={item.id} className="menu-item-row">
                  <div>
                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.photo ? (
                        <img src={item.photo} alt={item.name} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
                      ) : (
                        <span>{item.emoji}</span>
                      )}
                      <span>{item.name}</span>
                    </div>
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
          )}

          <div style={{ marginTop: '24px', borderTop: '2px solid rgba(128,128,128,0.2)', paddingTop: '16px' }}>
            <div className="flex justify-between" style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px' }}>
              <span>{groupTray ? 'Group Total:' : 'Total:'}</span>
              <span>
                ₹{groupTray 
                  ? groupTray.members.reduce((sum, m) => sum + m.items.reduce((s, i) => s + (i.price * i.qty), 0), 0).toFixed(2)
                  : cartTotal.toFixed(2)
                }
              </span>
            </div>
            
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
              Pickup Time:
            </label>
            <input type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)} />

            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                Allergies / Special Instructions:
              </label>
              <textarea 
                placeholder="E.g., No onions, peanut allergy, make it spicy..." 
                value={specialInstructions} 
                onChange={e => setSpecialInstructions(e.target.value)}
                rows="2"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '12px', 
                  border: '2px solid rgba(128,128,128,0.2)', 
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                  background: 'var(--current-card)',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  resize: 'none'
                }} 
              />
            </div>

            <div className="flex gap-2">
              {groupTray ? (
                <button className="primary" style={{ width: '100%', padding: '12px', fontSize: '1.1rem' }} onClick={() => {
                  const totalItems = groupTray.members.reduce((sum, m) => sum + m.items.length, 0);
                  if (totalItems === 0) {
                    showToast("Please add items to your group tray first! 🧺", "error");
                    return;
                  }
                  setShowGroupSplitModal(true);
                }}>
                  Split Bill & Checkout 💸
                </button>
              ) : (
                <button className="primary" style={{ width: '100%', padding: '12px', fontSize: '1.1rem' }} onClick={handleProceedToPayment}>
                  Proceed to Payment 💳
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Split Bill Calculator Modal */}
      {showGroupSplitModal && groupTray && (
        <div className="modal-overlay" onClick={() => setShowGroupSplitModal(false)}>
          <div className="card flex-col gap-4" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center">
              <h2 style={{ margin: 0 }}>Split Bill Calculator 💸</h2>
              <button className="ghost" style={{ padding: '4px 10px' }} onClick={() => setShowGroupSplitModal(false)}>❌</button>
            </div>
            <p style={{ opacity: 0.7, margin: 0, fontSize: '0.9rem' }}>
              Instant breakdown for Room #{groupTray.id}. Send UPI reminders directly to your friends!
            </p>

            <div className="flex-col gap-3">
              {groupTray.members.map(m => {
                const mTotal = m.items.reduce((s, i) => s + (i.price * i.qty), 0);
                return (
                  <div key={m.id} className="card flex justify-between items-center" style={{ background: 'rgba(128,128,128,0.05)', padding: '12px 16px' }}>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '1.05rem' }}>👤 {m.name}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{m.items.reduce((s,i) => s + i.qty, 0)} items</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span style={{ fontWeight: '900', color: 'var(--current-primary)', fontSize: '1.1rem' }}>₹{mTotal.toFixed(2)}</span>
                      {m.id !== 'm1' ? (
                        <button className="accent" style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold' }} onClick={() => {
                          showToast(`UPI payment link sent to ${m.name} for ₹${mTotal.toFixed(2)}! 📲`, "success");
                        }}>
                          Request UPI 🔔
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--current-primary)' }}>Your Share</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card flex justify-between items-center" style={{ background: 'var(--current-primary)', color: 'white' }}>
              <span style={{ fontWeight: '900', fontSize: '1.2rem' }}>Grand Total</span>
              <span style={{ fontWeight: '900', fontSize: '1.4rem' }}>
                ₹{groupTray.members.reduce((sum, m) => sum + m.items.reduce((s, i) => s + (i.price * i.qty), 0), 0).toFixed(2)}
              </span>
            </div>

            <button className="primary" style={{ width: '100%', padding: '14px', fontSize: '1.1rem' }} onClick={() => {
              const allItems = groupTray.members.flatMap(m => m.items);
              const totalAmount = groupTray.members.reduce((sum, m) => sum + m.items.reduce((s, i) => s + (i.price * i.qty), 0), 0);
              
              const orderData = {
                id: `grp-ord-${Date.now().toString().slice(-4)}`,
                user_id: session.id,
                stall_id: groupTray.stallId,
                items: allItems,
                total: totalAmount,
                pickup_time: new Date(Date.now() + 20 * 60000).toISOString(),
                status: 'Order Received',
                special_instructions: `Group Order (${groupTray.members.length} people) • Notes: ${specialInstructions}`,
                created_at: new Date().toISOString()
              };

              db.addOrder(orderData);
              showToast("Group Order placed successfully! 🎉 Check your order ledger.", "success");
              setGroupTray(null);
              setShowGroupSplitModal(false);
              setIsCartOpen(false);
              setView('orders');
            }}>
              Confirm & Place Group Order 🚀
            </button>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="card flex-col gap-4" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '350px' }}>
            <div className="flex justify-between items-center">
              <h2 style={{ margin: 0 }}>Join Group Tray 🤝</h2>
              <button className="ghost" style={{ padding: '4px 10px' }} onClick={() => setShowJoinModal(false)}>❌</button>
            </div>
            <p style={{ opacity: 0.7, margin: 0, fontSize: '0.9rem' }}>
              Enter the room code shared by your friend to order together!
            </p>

            <input 
              type="text" 
              placeholder="E.g. GRP-482" 
              value={joinRoomCode} 
              onChange={e => setJoinRoomCode(e.target.value)}
              style={{ margin: 0, textTransform: 'uppercase' }}
            />

            <button className="primary" style={{ padding: '12px', fontSize: '1.1rem' }} onClick={handleJoinRoom}>
              Join Room 🚀
            </button>
          </div>
        </div>
      )}

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

      {view === 'history' && (
        <div className="animated-list">
          <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Order History</h2>
          {myHistory.length === 0 ? (
            <div className="empty-state card"><h2>No past records 🕰️</h2><p>Your finished orders will appear here.</p></div>
          ) : (
            <div className="flex-col gap-4" style={{ maxWidth: '800px' }}>
              {myHistory.map(order => (
                <div key={order.id} className="card" style={{ opacity: 0.9 }}>
                  <div className="flex justify-between items-center order-header" style={{ marginBottom: '12px' }}>
                    <h3 style={{ margin: 0 }}>{order.stall_name}</h3>
                    <span style={{ fontWeight: 'bold' }}>₹{Number(order.total).toFixed(2)}</span>
                  </div>
                  <p style={{ opacity: 0.7, margin: '0 0 12px 0', fontSize: '0.85rem' }}>
                    Completed on: {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px 0', opacity: 0.8, fontSize: '0.9rem' }}>
                    {order.items.map((it, idx) => (
                      <li key={idx}>{it.qty}x {it.emoji} {it.name}</li>
                    ))}
                  </ul>

                  {order.special_instructions && (
                    <div style={{ 
                      background: 'rgba(128, 128, 128, 0.05)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontStyle: 'italic',
                      marginBottom: '12px'
                    }}>
                      {/allergy|allergic/i.test(order.special_instructions) ? '⚠️ Allergy: ' : '📝 Instructions: '}"{order.special_instructions}"
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button className="ghost" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleReorder(order)}>
                      Reorder 🔁
                    </button>
                    {!db.reviews?.some(r => r.order_id === order.id) && (
                      <button className="accent" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setReviewDraft({ orderId: order.id, stallId: order.stall_id, rating: 5, comment: '' })}>
                        Leave Review ⭐
                      </button>
                    )}
                  </div>
                  {reviewDraft.orderId === order.id && (
                    <div className="card flex-col gap-2" style={{ background: 'var(--current-surface-hover)', marginTop: '12px' }}>
                      <label>Rating: {reviewDraft.rating} ⭐</label>
                      <input type="range" min="1" max="5" value={reviewDraft.rating} onChange={e => setReviewDraft({...reviewDraft, rating: parseInt(e.target.value)})} />
                      <textarea placeholder="How was it?" value={reviewDraft.comment} onChange={e => setReviewDraft({...reviewDraft, comment: e.target.value})} rows="2" style={{ fontSize: '0.9rem', padding: '8px' }} />
                      <div className="flex gap-2">
                        <button className="primary" onClick={submitReview}>Submit</button>
                        <button className="ghost" onClick={() => setReviewDraft({ orderId: null, stallId: null, rating: 5, comment: '' })}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'stats' && (
        <div className="animated-list">
          <div className="flex justify-between items-end" style={{ marginBottom: '32px' }}>
            <div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Your Foodie Journey 📊</h2>
              <p style={{ opacity: 0.7, fontSize: '1.1rem' }}>Tracking your delicious adventures on campus.</p>
            </div>
            <div className="card" style={{ padding: '12px 24px', background: stats.rankColor, color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', boxShadow: `0 10px 20px ${stats.rankColor}44` }}>
              {stats.rank}
            </div>
          </div>

          <div className="grid-cards" style={{ marginBottom: '32px' }}>
            <div className="card shimmer text-center" style={{ padding: '32px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛍️</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{stats.totalOrders}</div>
              <p style={{ opacity: 0.7, margin: 0, fontWeight: '700' }}>Total Orders</p>
            </div>
            <div className="card shimmer text-center" style={{ padding: '32px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💰</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>₹{stats.totalSpent.toFixed(2)}</div>
              <p style={{ opacity: 0.7, margin: 0, fontWeight: '700' }}>Total Spent</p>
            </div>
            <div className="card shimmer text-center" style={{ padding: '32px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏪</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '8px', color: 'var(--current-primary)' }}>{stats.favStall}</div>
              <p style={{ opacity: 0.7, margin: 0, fontWeight: '700' }}>Favorite Stall</p>
            </div>
            <div className="card shimmer text-center" style={{ padding: '32px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🍱</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '8px', color: 'var(--current-primary)' }}>{stats.topItem}</div>
              <p style={{ opacity: 0.7, margin: 0, fontWeight: '700' }}>Top Ordered Item</p>
            </div>
          </div>

          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>Order Frequency 📈</h3>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" fill="var(--current-primary)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card" style={{ height: '400px', background: 'var(--current-primary)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '10rem', opacity: 0.1 }}>🥯</div>
              <h3 style={{ fontSize: '2rem', marginBottom: '16px' }}>Pro Tip! 💡</h3>
              <p style={{ fontSize: '1.2rem', lineHeight: '1.6', opacity: 0.9 }}>
                Ordering during off-peak hours (like 3:00 PM) can save you up to <strong>15 minutes</strong> of wait time! 
                <br/><br/>
                Keep exploring new stalls to unlock the <strong>Global Foodie</strong> achievement!
              </p>
              <button className="white" style={{ position: 'absolute', bottom: '32px', left: '32px', color: 'var(--current-primary)', fontWeight: '900' }}>
                Share My Stats 📸
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'profile' && (
        <div className="card animated-list" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>My Profile</h2>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--current-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', margin: '0 auto 16px' }}>
              {profile.name.charAt(0) || '👤'}
            </div>
            <h3>{profile.name}</h3>
            <p style={{ opacity: 0.7 }}>{profile.email}</p>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="flex-col">
            <label>Full Name</label>
            <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} required />
            
            <label>Email Address</label>
            <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} required />
            
            <button type="submit" className="primary">Save Changes 💾</button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
