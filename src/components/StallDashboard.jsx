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
  const [isMobile, setIsMobile] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showMobileAddDish, setShowMobileAddDish] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', price: '', emoji: '🍲', description: '', category: 'Fast Food', available: true, photo: '' });
  const [photoType, setPhotoType] = useState('emoji'); // 'emoji' vs 'upload'
  const [stallProfile, setStallProfile] = useState({ stall_name: '', min_pickup_time: 10, promotion: '', banner_url: '', description: '', categories: ['Fast Food'], food_court: 'North Food Court' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [customFoodCourtMode, setCustomFoodCourtMode] = useState(false);

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
    if (profile && !stallProfile.stall_name) { // Only load on mount or if name is missing
      setStallProfile({
        stall_name: profile.stall_name || '',
        min_pickup_time: profile.min_pickup_time || 10,
        promotion: profile.promotion || '',
        banner_url: profile.banner_url || '',
        description: profile.description || '',
        categories: profile.categories || ['Fast Food'],
        food_court: profile.food_court || (db.foodCourts && db.foodCourts.length > 0 ? db.foodCourts[0] : 'North Food Court'),
        status: profile.status || 'Open'
      });
      setStallStatus(profile.status || 'Open');
      if (profile.food_court && db.foodCourts && !db.foodCourts.includes(profile.food_court)) {
        setCustomFoodCourtMode(true);
      }
    }

    if (db.reviews) {
      setReviews(db.reviews.filter(r => r.stall_id === session.id));
    }
  }, [db, session.id]);

  const homeData = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const allStallOrders = db.orders.filter(o => o.stall_id === session.id);
    const todayOrders = allStallOrders.filter(o => o.created_at && o.created_at.startsWith(today));
    
    const revenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = todayOrders.length > 0 ? revenue / todayOrders.length : 0;
    
    const statusCounts = {
      'Queued': orders.filter(o => o.status === 'Order Received').length,
      'Preparing': orders.filter(o => o.status === 'Cooking' || o.status === 'Cooked').length,
      'Ready': orders.filter(o => o.status === 'Ready to Eat').length,
      'Finished': historyOrders.filter(o => o.created_at && o.created_at.startsWith(today)).length
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
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5)
      .map(o => ({
        id: o.id,
        type: o.status === 'Order Received' ? 'NEW' : (o.status === 'Picked Up' ? 'COMPLETED' : 'UPDATE'),
        message: o.status === 'Order Received' ? `New order #${o.id.slice(0,5)}` : `Order #${o.id.slice(0,5)} is ${o.status}`,
        time: o.created_at || new Date().toISOString()
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

  const handleFileUpload = (e, target) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        showToast("Image is too large! (Limit 1.5MB for mock DB)", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'banner') {
          const updatedProfile = { ...stallProfile, banner_url: reader.result };
          setStallProfile(updatedProfile);
          db.updateProfile(session.id, updatedProfile);
          showToast("Banner image updated & saved! 📸", "success");
        } else if (target === 'menu') {
          setNewItem(prev => ({ ...prev, photo: reader.result }));
          showToast("Item photo ready! 🥘");
        }
      };
      reader.readAsDataURL(file);
    }
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
      const hour = new Date(o.created_at || Date.now()).getHours();
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
    const matchesSearch = matchesId || matchesCustomer || matchesItem;

    let matchesStatus = true;
    if (statusFilter === 'Queued') matchesStatus = o.status === 'Order Received';
    else if (statusFilter === 'Preparing') matchesStatus = o.status === 'Cooking' || o.status === 'Cooked';
    else if (statusFilter === 'Ready') matchesStatus = o.status === 'Ready to Eat';
    else if (statusFilter !== 'All') matchesStatus = o.status === statusFilter;

    return matchesSearch && matchesStatus;
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

  if (isMobile) {
    const activeOrdersCount = orders.length;
    const finishedTodayCount = historyOrders.filter(o => o.created_at && o.created_at.startsWith(new Date().toISOString().split('T')[0])).length;

    return (
      <div className="mobile-app-container" style={{
        background: '#FFF8F2',
        minHeight: '100vh',
        padding: '24px 16px 140px 16px',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#2B2B2B',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        {/* CSS Encapsulated Style block */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Outfit:wght@400;500;600;700;800;900&display=swap');
          
          .mobile-app-container {
            font-family: 'Outfit', 'Inter', -apple-system, sans-serif !important;
          }
          
          .mobile-navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }
          
          .mobile-nav-btn {
            background: #FFFFFF;
            border: none;
            width: 48px;
            height: 48px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.02);
            cursor: pointer;
            font-size: 1.3rem;
            position: relative;
          }
          
          .mobile-bell-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 8px;
            height: 8px;
            background: #EF4444;
            border-radius: 50%;
            border: 2px solid #FFFFFF;
          }
          
          .mobile-welcome-header {
            margin-bottom: 24px;
          }
          
          .mobile-welcome-title {
            font-size: 1.95rem;
            font-weight: 800;
            margin: 0;
            color: #1A1A1A;
            letter-spacing: -0.5px;
          }
          
          .mobile-welcome-subtitle {
            font-size: 0.92rem;
            color: #7C7C7C;
            margin: 6px 0 0 0;
            font-weight: 500;
          }
          
          .mobile-status-card {
            background: #FFFFFF;
            border-radius: 20px;
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 8px 24px rgba(220, 190, 170, 0.1);
            border: 1px solid rgba(128, 128, 128, 0.03);
            margin-bottom: 24px;
            position: relative;
            cursor: pointer;
          }
          
          .mobile-status-label {
            font-size: 0.72rem;
            font-weight: 900;
            color: #A3A3A3;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          
          .mobile-status-pill {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.85rem;
          }
          
          .mobile-status-pill.open { background: #10B981; color: #FFFFFF; }
          .mobile-status-pill.busy { background: #F59E0B; color: #FFFFFF; }
          .mobile-status-pill.closed { background: #EF4444; color: #FFFFFF; }
          
          .mobile-status-dropdown {
            position: absolute;
            top: 68px;
            right: 20px;
            background: #FFFFFF;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.12);
            border: 1px solid rgba(128, 128, 128, 0.08);
            z-index: 1001;
            width: 140px;
            overflow: hidden;
            animation: slideDownMobile 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          }
          
          @keyframes slideDownMobile {
            from { transform: translateY(-10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          
          .mobile-status-option {
            padding: 12px 16px;
            font-weight: 700;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: background 0.2s;
          }
          
          .mobile-status-option:hover {
            background: rgba(128,128,128,0.05);
          }
          
          .mobile-section-title {
            font-size: 1.15rem;
            font-weight: 800;
            color: #1A1A1A;
            margin: 0 0 16px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .mobile-card {
            background: #FFFFFF;
            border-radius: 20px;
            padding: 16px;
            box-shadow: 0 8px 24px rgba(220, 190, 170, 0.06);
            border: 1px solid rgba(128, 128, 128, 0.03);
            position: relative;
            box-sizing: border-box;
            transition: all 0.2s ease;
          }
          
          .mobile-card:active {
            transform: scale(0.98);
          }
          
          .mobile-revenue-card {
            background: #FFFFFF;
            border-radius: 24px;
            padding: 24px;
            box-shadow: 0 12px 30px rgba(220, 190, 170, 0.08);
            border: 1px solid rgba(128, 128, 128, 0.03);
            margin-bottom: 24px;
            position: relative;
          }
          
          .mobile-revenue-icon {
            position: absolute;
            top: 24px;
            right: 24px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #FEECEE;
            color: #FF5A5F;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
          }
          
          .mobile-quick-actions-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 24px;
          }
          
          .mobile-action-btn {
            background: #FFFFFF;
            border-radius: 16px;
            padding: 12px 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 6px 16px rgba(220, 190, 170, 0.04);
            border: 1px solid rgba(128, 128, 128, 0.02);
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .mobile-action-btn:active {
            transform: translateY(2px) scale(0.95);
          }
          
          .mobile-action-circle {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            margin-bottom: 8px;
          }
          
          .mobile-action-label {
            font-size: 0.65rem;
            font-weight: 800;
            color: #4A4A4A;
            text-align: center;
            line-height: 1.2;
          }
          
          .mobile-activity-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .mobile-activity-card {
            background: #FFFFFF;
            border-radius: 16px;
            padding: 14px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 12px rgba(220, 190, 170, 0.03);
            border: 1px solid rgba(128, 128, 128, 0.02);
          }
          
          .mobile-nav-bar {
            position: fixed;
            bottom: 20px;
            left: 16px;
            right: 16px;
            height: 68px;
            background: rgba(255, 255, 255, 0.94);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 34px;
            box-shadow: 0 12px 35px rgba(210, 180, 160, 0.22);
            border: 1px solid rgba(128, 128, 128, 0.06);
            display: flex;
            justify-content: space-around;
            align-items: center;
            z-index: 1000;
            padding: 0 10px;
            box-sizing: border-box;
          }
          
          .mobile-nav-item {
            background: transparent;
            border: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #8E8E93;
            cursor: pointer;
            padding: 8px 4px;
            width: 50px;
            transition: all 0.2s ease;
          }
          
          .mobile-nav-item.active {
            color: #FF5A5F;
          }
          
          .mobile-nav-icon {
            font-size: 1.35rem;
          }
          
          .mobile-nav-label {
            font-size: 0.62rem;
            font-weight: 800;
            margin-top: 3px;
          }
          
          .mobile-add-btn {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #FF6B6B, #FF5A5F);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            border: none;
            box-shadow: 0 4px 12px rgba(255, 90, 95, 0.25);
            font-size: 1.8rem;
            font-weight: 300;
            cursor: pointer;
            transition: all 0.2s ease;
            z-index: 1002;
          }
          
          .mobile-add-btn:active {
            transform: scale(0.92);
          }
          
          .mobile-drawer-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.35);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 2000;
            animation: fadeInMobile 0.25s ease;
          }
          
          .mobile-drawer-panel {
            position: absolute;
            top: 0; left: 0;
            width: 270px;
            height: 100vh;
            background: #FFFFFF;
            box-shadow: 10px 0 30px rgba(0,0,0,0.15);
            padding: 32px 24px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            animation: slideInLeftMobile 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          
          @keyframes fadeInMobile { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideInLeftMobile {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
          
          .mobile-drawer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
          }
          
          .mobile-drawer-close {
            background: #F5F5F7;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            cursor: pointer;
            font-weight: 800;
          }
          
          .mobile-drawer-item {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 14px 16px;
            border-radius: 14px;
            font-weight: 800;
            font-size: 0.98rem;
            cursor: pointer;
            margin-bottom: 6px;
            transition: all 0.2s;
            color: #2B2B2B;
          }
          
          .mobile-drawer-item.active {
            background: #FFF1F2;
            color: #FF5A5F;
          }
          
          .mobile-switch {
            width: 44px;
            height: 24px;
            background: #E5E5EA;
            border-radius: 12px;
            position: relative;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          
          .mobile-switch.active {
            background: #10B981;
          }
          
          .mobile-switch-thumb {
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            position: absolute;
            top: 2px;
            left: 2px;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          }
          
          .mobile-switch.active .mobile-switch-thumb {
            left: 22px;
          }
          
          .mobile-menu-card {
            background: #FFFFFF;
            border-radius: 16px;
            padding: 14px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 12px rgba(220,190,170,0.04);
            border: 1px solid rgba(128,128,128,0.02);
            margin-bottom: 12px;
          }
          
          .mobile-delete-btn {
            background: #FEECEE;
            color: #EF4444;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 0.95rem;
            transition: all 0.2s;
          }
          
          .mobile-delete-btn:active {
            transform: scale(0.9);
          }
          
          .mobile-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            z-index: 2100;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            animation: fadeInMobile 0.25s ease;
          }
          
          .mobile-modal-panel {
            background: #FFFFFF;
            width: 100%;
            max-width: 480px;
            border-top-left-radius: 32px;
            border-top-right-radius: 32px;
            padding: 28px 24px 44px 24px;
            box-shadow: 0 -10px 40px rgba(0,0,0,0.15);
            box-sizing: border-box;
            animation: slideUpMobileModal 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            max-height: 90vh;
            overflow-y: auto;
          }
          
          @keyframes slideUpMobileModal {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          
          .mobile-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          
          .mobile-input-label {
            font-weight: 800;
            font-size: 0.8rem;
            color: #666;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .mobile-form-input {
            width: 100%;
            background: #F5F5F7;
            border: 1px solid transparent;
            border-radius: 16px;
            padding: 14px 16px;
            font-size: 0.95rem;
            font-weight: 700;
            margin-bottom: 16px;
            box-sizing: border-box;
            transition: all 0.2s;
            font-family: inherit;
          }
          
          .mobile-form-input:focus {
            background: #FFFFFF;
            border-color: #FF5A5F;
            outline: none;
            box-shadow: 0 4px 12px rgba(255, 90, 95, 0.08);
          }
          
          .mobile-submit-btn {
            background: linear-gradient(135deg, #FF6B6B, #FF5A5F);
            color: white;
            border: none;
            border-radius: 16px;
            padding: 16px;
            font-weight: 800;
            font-size: 1rem;
            cursor: pointer;
            width: 100%;
            box-shadow: 0 8px 20px rgba(255, 90, 95, 0.3);
            transition: all 0.2s;
            margin-top: 12px;
          }
          
          .mobile-submit-btn:active {
            transform: scale(0.97);
          }
          
          .mobile-order-card {
            background: #FFFFFF;
            border-radius: 20px;
            padding: 18px;
            box-shadow: 0 6px 18px rgba(220,190,170,0.05);
            border: 1px solid rgba(128,128,128,0.03);
            margin-bottom: 16px;
          }
          
          .mobile-order-item-qty {
            background: #FFF1F2;
            color: #FF5A5F;
            padding: 2px 8px;
            border-radius: 8px;
            font-weight: 800;
            font-size: 0.75rem;
          }
          
          .mobile-action-pill {
            background: #FF5A5F;
            color: #FFFFFF;
            border: none;
            border-radius: 12px;
            padding: 10px 16px;
            font-weight: 800;
            font-size: 0.82rem;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(255,90,95,0.2);
          }
          
          .mobile-action-pill:active {
            transform: scale(0.95);
          }
          
          .mobile-delayed-alert {
            background: #FEF2F2;
            border-left: 4px solid #EF4444;
            border-radius: 16px;
            padding: 14px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            box-shadow: 0 6px 16px rgba(239, 68, 68, 0.05);
          }
        `}</style>

        {/* 1. Mobile Top Navbar */}
        <div className="mobile-navbar">
          <button className="mobile-nav-btn" onClick={() => setShowMobileDrawer(true)}>☰</button>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.25rem', color: '#FF5A5F', fontWeight: 'bold' }}>Food at a Click</div>
          <button className="mobile-nav-btn">
            🔔
            <span className="mobile-bell-badge" />
          </button>
        </div>

        {/* Dynamic Inner Views */}
        {view === 'home' && (
          <>
            {/* 2. Welcome Back Section */}
            <div className="mobile-welcome-header">
              <h2 className="mobile-welcome-title">Welcome back, Chef! 👨‍🍳</h2>
              <p className="mobile-welcome-subtitle">Here's what's happening at your stall today.</p>
            </div>

            {/* 3. Stall Status Horizontal Selector Card */}
            <div className="mobile-status-card" onClick={() => setShowStatusDropdown(!showStatusDropdown)}>
              <span className="mobile-status-label">Stall Status</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`mobile-status-pill ${stallStatus.toLowerCase()}`}>
                  {stallStatus === 'Open' ? '🟢' : stallStatus === 'Busy' ? '🟡' : '🔴'} {stallStatus}
                </span>
                <span style={{ fontSize: '0.6rem', color: '#7C7C7C' }}>▼</span>
              </div>

              {showStatusDropdown && (
                <div className="mobile-status-dropdown">
                  <div className="mobile-status-option" onClick={(e) => {
                    e.stopPropagation();
                    setStallStatus('Open');
                    db.updateProfile(session.id, { ...stallProfile, status: 'Open' });
                    setShowStatusDropdown(false);
                    showToast("Stall is now OPEN 🟢");
                  }}>🟢 Open</div>
                  <div className="mobile-status-option" onClick={(e) => {
                    e.stopPropagation();
                    setStallStatus('Busy');
                    db.updateProfile(session.id, { ...stallProfile, status: 'Busy' });
                    setShowStatusDropdown(false);
                    showToast("Stall is now BUSY 🟡");
                  }}>🟡 Busy</div>
                  <div className="mobile-status-option" onClick={(e) => {
                    e.stopPropagation();
                    setStallStatus('Closed');
                    db.updateProfile(session.id, { ...stallProfile, status: 'Closed' });
                    setShowStatusDropdown(false);
                    showToast("Stall is now CLOSED 🔴");
                  }}>🔴 Closed</div>
                </div>
              )}
            </div>

            {/* Delayed Warning Alert if any delayed orders */}
            {homeData.delayedOrders.length > 0 && (
              <div className="mobile-delayed-alert">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                  <div>
                    <strong style={{ fontSize: '0.85rem', display: 'block', color: '#991B1B' }}>{homeData.delayedOrders.length} Delayed Orders</strong>
                    <span style={{ fontSize: '0.72rem', color: '#B91C1C', opacity: 0.8 }}>Past Expected Pickup Time</span>
                  </div>
                </div>
                <button className="mobile-action-pill" style={{ background: '#EF4444', fontSize: '0.7rem', padding: '6px 12px', boxShadow: 'none' }} onClick={() => setView('orders')}>
                  Fix Now
                </button>
              </div>
            )}

            {/* 4. Today Overview Title and 2x2 Grid */}
            <h3 className="mobile-section-title">Today Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div className="mobile-card" style={{ borderLeft: '4px solid #6366F1', margin: 0, padding: '16px', cursor: 'pointer' }} onClick={() => { setView('orders'); setStatusFilter('Queued'); }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                  <div style={{ background: '#EEF2FF', width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>📥</div>
                  <span style={{ fontSize: '0.65rem', background: '#6366F1', color: 'white', padding: '3px 8px', borderRadius: '12px', fontWeight: '800' }}>New</span>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#2B2B2B', lineHeight: 1.2 }}>{homeData.statusCounts.Queued}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#666', marginTop: '4px' }}>Queued Orders</div>
              </div>

              <div className="mobile-card" style={{ borderLeft: '4px solid #F59E0B', margin: 0, padding: '16px', cursor: 'pointer' }} onClick={() => { setView('orders'); setStatusFilter('Preparing'); }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                  <div style={{ background: '#FFF7ED', width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🔥</div>
                  <span style={{ fontSize: '0.65rem', background: '#F59E0B', color: 'white', padding: '3px 8px', borderRadius: '12px', fontWeight: '800' }}>Preparing</span>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#2B2B2B', lineHeight: 1.2 }}>{homeData.statusCounts.Preparing}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#666', marginTop: '4px' }}>Preparing</div>
              </div>

              <div className="mobile-card" style={{ borderLeft: '4px solid #10B981', margin: 0, padding: '16px', cursor: 'pointer' }} onClick={() => { setView('orders'); setStatusFilter('Ready'); }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                  <div style={{ background: '#ECFDF5', width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🎁</div>
                  <span style={{ fontSize: '0.65rem', background: '#10B981', color: 'white', padding: '3px 8px', borderRadius: '12px', fontWeight: '800' }}>Ready</span>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#2B2B2B', lineHeight: 1.2 }}>{homeData.statusCounts.Ready}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#666', marginTop: '4px' }}>Ready for Pickup</div>
              </div>

              <div className="mobile-card" style={{ borderLeft: '4px solid #3B82F6', margin: 0, padding: '16px', cursor: 'pointer' }} onClick={() => setView('history')}>
                <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                  <div style={{ background: '#EFF6FF', width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>✅</div>
                  <span style={{ fontSize: '0.65rem', background: '#3B82F6', color: 'white', padding: '3px 8px', borderRadius: '12px', fontWeight: '800' }}>Done</span>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#2B2B2B', lineHeight: 1.2 }}>{homeData.statusCounts.Finished}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#666', marginTop: '4px' }}>Finished Today</div>
              </div>
            </div>

            {/* 5. Revenue Card */}
            <div className="mobile-revenue-card">
              <span className="mobile-revenue-icon">📊</span>
              <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#A0A0A0', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px' }}>Today's Revenue</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#FF5A5F', lineHeight: 1.1 }}>₹{homeData.revenue.toFixed(2)}</div>
              <div style={{ fontSize: '0.8rem', color: '#777', fontWeight: '600', marginTop: '6px' }}>Total sales from {homeData.todayCount} orders</div>
              
              <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '18px 0' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#2B2B2B' }}>{homeData.todayCount}</div>
                  <div style={{ fontSize: '0.7rem', color: '#A0A0A0', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>Orders</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#2B2B2B' }}>₹{homeData.avgOrderValue.toFixed(0)}</div>
                  <div style={{ fontSize: '0.7rem', color: '#A0A0A0', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>Avg Value</div>
                </div>
              </div>
            </div>

            {/* 6. Quick Actions */}
            <h3 className="mobile-section-title">Quick Actions</h3>
            <div className="mobile-quick-actions-row">
              <div className="mobile-action-btn" onClick={() => setView('orders')}>
                <div className="mobile-action-circle" style={{ background: '#FFE4E6' }}>🛎️</div>
                <span className="mobile-action-label">Active Orders</span>
              </div>
              <div className="mobile-action-btn" onClick={() => setView('menu')}>
                <div className="mobile-action-circle" style={{ background: '#FEF3C7' }}>📋</div>
                <span className="mobile-action-label">Menu Manager</span>
              </div>
              <div className="mobile-action-btn" onClick={() => setView('analytics')}>
                <div className="mobile-action-circle" style={{ background: '#F3E8FF' }}>📈</div>
                <span className="mobile-action-label">Analytics</span>
              </div>
              <div className="mobile-action-btn" onClick={() => setView('history')}>
                <div className="mobile-action-circle" style={{ background: '#D1FAE5' }}>🕰️</div>
                <span className="mobile-action-label">History</span>
              </div>
            </div>

            {/* 7. Recent Activities */}
            <h3 className="mobile-section-title">
              Recent Activities
              <span style={{ fontSize: '0.78rem', color: '#FF5A5F', fontWeight: '700' }}>Live Feed</span>
            </h3>
            <div className="mobile-activity-list">
              {homeData.recentFeed.length === 0 ? (
                <div className="mobile-card" style={{ textAlign: 'center', padding: '20px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#888' }}>No recent activity yet</span>
                </div>
              ) : (
                homeData.recentFeed.map(feed => (
                  <div key={feed.id} className="mobile-activity-card">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div className="mobile-activity-dot" style={{ background: feed.type === 'NEW' ? '#6366F1' : feed.type === 'COMPLETED' ? '#10B981' : '#F59E0B' }} />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#2B2B2B' }}>{feed.message}</div>
                        <div style={{ fontSize: '0.72rem', color: '#909090', marginTop: '2px', fontWeight: '600' }}>{new Date(feed.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#CCCCCC', fontWeight: '800' }}>❯</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {view === 'orders' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button onClick={() => setView('home')} style={{ background: '#FFFFFF', border: 'none', width: '38px', height: '38px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800' }}>❮</button>
              <h2 style={{ fontSize: '1.45rem', fontWeight: '800', margin: 0 }}>Incoming Orders ({filteredOrders.length})</h2>
            </div>

            <input 
              type="text" 
              placeholder="Search ID, customer, food..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="mobile-form-input"
              style={{ marginBottom: '20px' }}
            />

            {filteredOrders.length === 0 ? (
              <div className="mobile-card" style={{ textAlign: 'center', padding: '32px' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>🍳</span>
                <strong style={{ display: 'block', fontSize: '1.05rem', color: '#2B2B2B' }}>Kitchen is quiet</strong>
                <span style={{ fontSize: '0.82rem', color: '#888', marginTop: '4px', display: 'block' }}>Waiting for hungry foodies to order!</span>
              </div>
            ) : (
              filteredOrders.map(order => {
                const isDelayed = new Date(order.pickup_time) < new Date() && order.status !== 'Ready to Eat';
                const nextStatuses = {
                  'Order Received': { text: 'Start Cooking 👨‍🍳', icon: '🔥' },
                  'Cooking': { text: 'Mark Cooked 🍳', icon: '✅' },
                  'Cooked': { text: 'Ready for Pickup 🎁', icon: '🎉' },
                  'Ready to Eat': { text: 'Mark Picked Up ✅', icon: 'Picked Up' }
                };
                const nextStep = nextStatuses[order.status];

                return (
                  <div key={order.id} className="mobile-order-card" style={{ borderLeft: isDelayed ? '4px solid #EF4444' : 'none', cursor: 'pointer' }} onClick={() => setSelectedOrder(order)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <strong style={{ fontSize: '0.98rem', color: '#FF5A5F' }}>#{order.id.slice(0, 5).toUpperCase()}</strong>
                        <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px', fontWeight: '700' }}>👤 {order.customer_name}</div>
                      </div>
                      <span style={{ fontSize: '0.78rem', background: isDelayed ? '#EF4444' : '#F59E0B', color: 'white', padding: '4px 10px', borderRadius: '10px', fontWeight: '800' }}>
                        ⏰ {new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ background: '#F5F5F7', padding: '6px 12px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: '800', marginBottom: '12px' }}>
                      <span>⚡</span> {order.status}
                    </div>

                    <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '12px 0' }} />

                    <div style={{ margin: '12px 0' }}>
                      {order.items.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="mobile-order-item-qty">{it.qty}x</span>
                            <span>{it.emoji}</span>
                            <span style={{ fontWeight: '700' }}>{it.name}</span>
                          </div>
                          <span style={{ color: '#888' }}>₹{(it.price * it.qty).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '12px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#888', display: 'block', fontWeight: '700' }}>Total Amount</span>
                        <strong style={{ fontSize: '1.1rem', color: '#FF5A5F' }}>₹{Number(order.total).toFixed(2)}</strong>
                      </div>
                      {nextStep && (
                        <button className="mobile-action-pill" onClick={(e) => { e.stopPropagation(); updateStatus(order.id, order.status); }}>
                          {nextStep.text}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {view === 'menu' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setView('home')} style={{ background: '#FFFFFF', border: 'none', width: '38px', height: '38px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800' }}>❮</button>
                <h2 style={{ fontSize: '1.45rem', fontWeight: '800', margin: 0 }}>Menu Manager</h2>
              </div>
              <button className="mobile-action-pill" style={{ padding: '8px 14px', fontSize: '0.75rem' }} onClick={() => setShowMobileAddDish(true)}>
                + Add Dish
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {menu.length === 0 ? (
                <div className="mobile-card" style={{ textAlign: 'center', padding: '32px' }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>📋</span>
                  <strong style={{ display: 'block', fontSize: '1.05rem', color: '#2B2B2B' }}>No dishes added</strong>
                  <span style={{ fontSize: '0.82rem', color: '#888', marginTop: '4px', display: 'block' }}>Add dishes to start selling!</span>
                </div>
              ) : (
                menu.map(item => (
                  <div key={item.id} className="mobile-menu-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                        {item.photo ? <img src={item.photo} alt={item.name} style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} /> : (item.emoji || '🍲')}
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#2B2B2B', display: 'block' }}>{item.name}</strong>
                        <span style={{ fontSize: '0.8rem', color: '#FF5A5F', fontWeight: '800', marginTop: '2px', display: 'block' }}>₹{Number(item.price).toFixed(2)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div 
                        className={`mobile-switch ${item.available ? 'active' : ''}`}
                        onClick={() => toggleAvailability(item.id)}
                      >
                        <div className="mobile-switch-thumb" />
                      </div>
                      <button className="mobile-delete-btn" onClick={() => deleteItem(item.id)}>🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {view === 'analytics' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button onClick={() => setView('home')} style={{ background: '#FFFFFF', border: 'none', width: '38px', height: '38px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800' }}>❮</button>
              <h2 style={{ fontSize: '1.45rem', fontWeight: '800', margin: 0 }}>Analytics</h2>
            </div>

            <div className="mobile-card" style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF5A5F)', color: 'white', padding: '24px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Stall Earnings</span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: '900', margin: '4px 0 16px 0', lineHeight: 1.1 }}>₹{analytics.totalEarnings.toFixed(2)}</h2>
              
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.15)', margin: '16px 0' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: '700' }}>Completed Orders</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', marginTop: '2px' }}>{analytics.completedOrders}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: '700' }}>Top Selling Dish</span>
                  <div style={{ fontSize: '1rem', fontWeight: '900', marginTop: '4px', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{analytics.topDish}</div>
                </div>
              </div>
            </div>

            <h3 className="mobile-section-title" style={{ marginTop: '24px' }}>Customer Reviews ({homeData.totalReviews})</h3>
            <div className="mobile-activity-list">
              {reviews.length === 0 ? (
                <div className="mobile-card" style={{ textAlign: 'center', padding: '20px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#888' }}>No reviews yet</span>
                </div>
              ) : (
                reviews.map(r => (
                  <div key={r.id} className="mobile-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '0.85rem' }}>👤 {db.profiles.find(p => p.id === r.user_id)?.name || 'Foodie Student'}</strong>
                      <span style={{ color: '#F59E0B', fontWeight: '800', fontSize: '0.82rem' }}>{'★'.repeat(r.rating)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#666', lineHeight: 1.4 }}>{r.comment}</p>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {view === 'history' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button onClick={() => setView('home')} style={{ background: '#FFFFFF', border: 'none', width: '38px', height: '38px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800' }}>❮</button>
              <h2 style={{ fontSize: '1.45rem', fontWeight: '800', margin: 0 }}>Order History</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {historyOrders.length === 0 ? (
                <div className="mobile-card" style={{ textAlign: 'center', padding: '32px' }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>🕰️</span>
                  <strong style={{ display: 'block', fontSize: '1.05rem', color: '#2B2B2B' }}>No order history</strong>
                  <span style={{ fontSize: '0.82rem', color: '#888', marginTop: '4px', display: 'block' }}>Completed orders will appear here!</span>
                </div>
              ) : (
                historyOrders.map(order => (
                  <div key={order.id} className="mobile-order-card" style={{ opacity: 0.9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ color: '#666', fontSize: '0.85rem' }}>#{order.id.slice(0, 5).toUpperCase()}</strong>
                      <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: '800' }}>Completed</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#2B2B2B', marginBottom: '4px' }}>👤 {order.customer_name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#888' }}>
                      Picked up at {new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    
                    <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '10px 0' }} />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>{order.items.map(it => `${it.qty}x ${it.name}`).join(', ')}</span>
                      <strong style={{ fontSize: '0.98rem', color: '#FF5A5F' }}>₹{Number(order.total).toFixed(2)}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {view === 'settings' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button onClick={() => setView('home')} style={{ background: '#FFFFFF', border: 'none', width: '38px', height: '38px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800' }}>❮</button>
              <h2 style={{ fontSize: '1.45rem', fontWeight: '800', margin: 0 }}>Stall Settings</h2>
            </div>

            <div className="mobile-card" style={{ padding: '24px' }}>
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="mobile-input-label">Stall Name</div>
                <input 
                  value={stallProfile.stall_name} 
                  onChange={e => setStallProfile({ ...stallProfile, stall_name: e.target.value })} 
                  className="mobile-form-input" 
                  required 
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div className="mobile-input-label" style={{ marginBottom: 0 }}>Banner Image 📸</div>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="file" 
                      id="mobile-banner-upload" 
                      hidden 
                      accept="image/*" 
                      onChange={(e) => handleFileUpload(e, 'banner')} 
                    />
                    <button 
                      type="button" 
                      className="mobile-action-pill" 
                      style={{ padding: '4px 12px', fontSize: '0.75rem', boxShadow: 'none', background: '#2D2D2D' }}
                      onClick={() => document.getElementById('mobile-banner-upload').click()}
                    >
                      Upload Photo 📁
                    </button>
                  </div>
                </div>
                
                {stallProfile.banner_url && (
                  <div style={{ marginBottom: '12px', position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '120px', border: '2px solid rgba(128,128,128,0.1)' }}>
                    <img src={stallProfile.banner_url} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)', display: 'flex', alignItems: 'flex-end', padding: '12px' }}>
                      <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 800 }}>LIVE PREVIEW</span>
                    </div>
                  </div>
                )}
                
                <input 
                  type="text" 
                  placeholder="Paste image URL or upload above..." 
                  value={stallProfile.banner_url} 
                  onChange={e => setStallProfile({...stallProfile, banner_url: e.target.value})} 
                  className="mobile-form-input"
                />

                <div className="mobile-input-label">Promotion / Special Offer 📢</div>
                <input 
                  placeholder="E.g., 10% off on all burgers today!" 
                  value={stallProfile.promotion} 
                  onChange={e => setStallProfile({...stallProfile, promotion: e.target.value})} 
                  className="mobile-form-input"
                />

                <div className="mobile-input-label">Min Prep Time (Minutes)</div>
                <input 
                  type="number" 
                  value={stallProfile.min_pickup_time} 
                  onChange={e => setStallProfile({ ...stallProfile, min_pickup_time: parseInt(e.target.value) })} 
                  className="mobile-form-input" 
                  required 
                />

                <div className="mobile-input-label">Food Court Name 📍</div>
                {!customFoodCourtMode ? (
                  <select 
                    value={stallProfile.food_court} 
                    onChange={e => {
                      if (e.target.value === 'OTHER_CUSTOM') {
                        setCustomFoodCourtMode(true);
                        setStallProfile({...stallProfile, food_court: ''});
                      } else {
                        setStallProfile({...stallProfile, food_court: e.target.value});
                      }
                    }} 
                    className="mobile-form-input"
                    required 
                  >
                    {db.foodCourts?.map(fc => (
                      <option key={fc} value={fc}>{fc}</option>
                    ))}
                    <option value="OTHER_CUSTOM">Other (Add Custom)</option>
                  </select>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input 
                      type="text" 
                      placeholder="Type your custom food court..." 
                      value={stallProfile.food_court} 
                      onChange={e => setStallProfile({...stallProfile, food_court: e.target.value})} 
                      className="mobile-form-input"
                      style={{ marginBottom: 0, flex: 1 }}
                      required 
                      autoFocus
                    />
                    <button 
                      type="button" 
                      className="mobile-action-pill" 
                      style={{ background: '#E5E5EA', color: '#2B2B2B', boxShadow: 'none' }}
                      onClick={() => {
                        setCustomFoodCourtMode(false);
                        setStallProfile({...stallProfile, food_court: db.foodCourts?.[0] || ''});
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="mobile-input-label">Stall Categories</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {['Fast Food', 'Asian', 'Healthy', 'Burgers', 'Beverages', 'Desserts'].map(cat => (
                    <button
                      type="button"
                      key={cat}
                      className="mobile-action-pill"
                      style={{ 
                        background: stallProfile.categories?.includes(cat) ? '#FF5A5F' : '#E5E5EA', 
                        color: stallProfile.categories?.includes(cat) ? '#FFFFFF' : '#2B2B2B',
                        boxShadow: 'none',
                        padding: '6px 14px',
                        fontSize: '0.8rem'
                      }}
                      onClick={() => {
                        const categories = stallProfile.categories || [];
                        const exists = categories.includes(cat);
                        const updated = exists ? categories.filter(c => c !== cat) : [...categories, cat];
                        setStallProfile({...stallProfile, categories: updated});
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="mobile-input-label">Stall Description 📝</div>
                <textarea 
                  value={stallProfile.description} 
                  onChange={e => setStallProfile({ ...stallProfile, description: e.target.value })} 
                  className="mobile-form-input"
                  style={{ minHeight: '80px', fontFamily: 'inherit' }}
                  required 
                />

                <button type="submit" className="mobile-submit-btn" style={{ margin: 0 }}>
                  Save Stall Settings 💾
                </button>
              </form>
            </div>

            <button 
              className="mobile-submit-btn" 
              style={{ background: '#FEECEE', color: '#EF4444', boxShadow: 'none', marginTop: '16px', border: '1px solid rgba(239, 68, 68, 0.1)' }}
              onClick={onLogout}
            >
              Logout 🚪
            </button>
          </>
        )}

        {/* 8. Slide-out Hamburger Menu Drawer Overlay */}
        {showMobileDrawer && (
          <div className="mobile-drawer-overlay" onClick={() => setShowMobileDrawer(false)}>
            <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-drawer-header">
                <div style={{ color: '#FF5A5F', fontFamily: "'Fredoka One', cursive", fontSize: '1.45rem', fontWeight: 'bold' }}>Chef Portal</div>
                <button className="mobile-drawer-close" onClick={() => setShowMobileDrawer(false)}>✕</button>
              </div>

              <div style={{ flex: 1 }}>
                <div className={`mobile-drawer-item ${view === 'home' ? 'active' : ''}`} onClick={() => { setView('home'); setShowMobileDrawer(false); }}>
                  <span>🏠</span> Home
                </div>
                <div className={`mobile-drawer-item ${view === 'orders' ? 'active' : ''}`} onClick={() => { setView('orders'); setShowMobileDrawer(false); }}>
                  <span>🛍️</span> Active Orders ({orders.length})
                </div>
                <div className={`mobile-drawer-item ${view === 'menu' ? 'active' : ''}`} onClick={() => { setView('menu'); setShowMobileDrawer(false); }}>
                  <span>🍴</span> Menu Manager
                </div>
                <div className={`mobile-drawer-item ${view === 'analytics' ? 'active' : ''}`} onClick={() => { setView('analytics'); setShowMobileDrawer(false); }}>
                  <span>📈</span> Analytics
                </div>
                <div className={`mobile-drawer-item ${view === 'history' ? 'active' : ''}`} onClick={() => { setView('history'); setShowMobileDrawer(false); }}>
                  <span>🕰️</span> Order History
                </div>
                <div className={`mobile-drawer-item ${view === 'settings' ? 'active' : ''}`} onClick={() => { setView('settings'); setShowMobileDrawer(false); }}>
                  <span>⚙️</span> Stall Settings
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#2D2D2D', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem' }}>
                    {(stallProfile.stall_name || 'Chef').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.85rem', display: 'block' }}>{stallProfile.stall_name || 'Chef Vendor'}</strong>
                    <span style={{ fontSize: '0.72rem', color: '#A0A0A0' }}>Vendor</span>
                  </div>
                </div>
                <button 
                  onClick={onLogout} 
                  style={{ background: 'transparent', border: 'none', color: '#EF4444', fontWeight: '800', fontSize: '0.85rem', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: 0 }}
                >
                  Logout 🚪
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 9. Floating Bottom Navigation Bar */}
        <div className="mobile-nav-bar">
          <button className={`mobile-nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>
            <span className="mobile-nav-icon">🏠</span>
            <span className="mobile-nav-label">Home</span>
          </button>

          <button className={`mobile-nav-item ${view === 'orders' ? 'active' : ''}`} onClick={() => setView('orders')}>
            <span className="mobile-nav-icon">🛍️</span>
            <span className="mobile-nav-label">Orders</span>
          </button>

          {/* Floating plus add button in center */}
          <button className="mobile-add-btn" onClick={() => setShowMobileAddDish(true)}>+</button>

          <button className={`mobile-nav-item ${view === 'menu' ? 'active' : ''}`} onClick={() => setView('menu')}>
            <span className="mobile-nav-icon">🍴</span>
            <span className="mobile-nav-label">Menu</span>
          </button>

          <button className={`mobile-nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>
            <span className="mobile-nav-icon">👤</span>
            <span className="mobile-nav-label">Settings</span>
          </button>
        </div>

        {/* 10. Add New Dish Modal Overlay */}
        {showMobileAddDish && (
          <div className="mobile-modal-overlay" onClick={() => setShowMobileAddDish(false)}>
            <div className="mobile-modal-panel" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-modal-header">
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Add New Dish 🍳</h3>
                <button className="mobile-drawer-close" onClick={() => setShowMobileAddDish(false)}>✕</button>
              </div>

              <form onSubmit={(e) => {
                handleAddItem({ preventDefault: () => {} });
                setShowMobileAddDish(false);
              }}>
                <div className="mobile-input-label">Dish Name</div>
                <input 
                  type="text" 
                  value={newItem.name} 
                  onChange={e => {
                    const name = e.target.value;
                    const detectedEmoji = detectEmoji(name);
                    setNewItem(prev => ({ ...prev, name, emoji: detectedEmoji }));
                  }} 
                  className="mobile-form-input" 
                  required 
                />

                <div className="mobile-input-label">Price (₹)</div>
                <input 
                  type="number" 
                  step="0.01" 
                  value={newItem.price} 
                  onChange={e => setNewItem({ ...newItem, price: e.target.value })} 
                  className="mobile-form-input" 
                  required 
                />

                <div className="mobile-input-label">Category</div>
                <select 
                  value={newItem.category} 
                  onChange={e => setNewItem({ ...newItem, category: e.target.value })} 
                  className="mobile-form-input"
                  style={{ height: '48px' }}
                >
                  {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>

                <div className="mobile-input-label">Description</div>
                <textarea 
                  value={newItem.description} 
                  onChange={e => setNewItem({ ...newItem, description: e.target.value })} 
                  className="mobile-form-input" 
                  style={{ minHeight: '60px', fontFamily: 'inherit' }}
                  required 
                />

                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <button type="button" className="mobile-action-pill" style={{ background: photoType === 'emoji' ? '#FF5A5F' : '#E5E5EA', color: photoType === 'emoji' ? 'white' : '#2B2B2B', fontSize: '0.72rem', padding: '8px 12px', boxShadow: 'none' }} onClick={() => setPhotoType('emoji')}>Emoji Icon</button>
                  <button type="button" className="mobile-action-pill" style={{ background: photoType === 'upload' ? '#FF5A5F' : '#E5E5EA', color: photoType === 'upload' ? 'white' : '#2B2B2B', fontSize: '0.72rem', padding: '8px 12px', boxShadow: 'none' }} onClick={() => setPhotoType('upload')}>Photo Upload</button>
                </div>

                {photoType === 'emoji' ? (
                  <>
                    <div className="mobile-input-label">Emoji Icon (Auto-suggested)</div>
                    <input 
                      value={newItem.emoji} 
                      onChange={e => setNewItem({ ...newItem, emoji: e.target.value })} 
                      className="mobile-form-input" 
                      required 
                    />
                  </>
                ) : (
                  <>
                    <div className="mobile-input-label">Photo URL or Upload</div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                      <input 
                        type="text" 
                        placeholder="https://images.unsplash.com/..." 
                        value={newItem.photo} 
                        onChange={e => setNewItem({ ...newItem, photo: e.target.value })} 
                        className="mobile-form-input" 
                        style={{ flex: 1, margin: 0 }}
                        required 
                      />
                      <input 
                        type="file" 
                        id="mobile-menu-upload" 
                        hidden 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, 'menu')} 
                      />
                      <button 
                        type="button" 
                        className="mobile-action-pill" 
                        style={{ padding: '0 16px', background: '#2D2D2D', fontSize: '0.78rem', boxShadow: 'none' }} 
                        onClick={() => document.getElementById('mobile-menu-upload').click()}
                      >
                        File
                      </button>
                    </div>
                    {newItem.photo && (
                      <div style={{ marginBottom: '16px' }}>
                        <img src={newItem.photo} alt="Preview" style={{ width: '100px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                      </div>
                    )}
                  </>
                )}

                <button type="submit" className="mobile-submit-btn">
                  Add Item To Menu 🍳
                </button>
              </form>
            </div>
          </div>
        )}
        {/* Mobile Order Detail Bottom Modal Sheet */}
        {selectedOrder && (
          <div className="mobile-modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="mobile-modal-panel" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-modal-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.65rem', background: '#FF5A5F', color: 'white', padding: '3px 8px', borderRadius: '12px', fontWeight: '800' }}>Order Detail</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#888' }}>#{selectedOrder.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: '800', margin: 0, color: '#2B2B2B' }}>{selectedOrder.customer_name}</h3>
                </div>
                <button className="mobile-drawer-close" onClick={() => setSelectedOrder(null)}>✕</button>
              </div>

              <div style={{ margin: '14px 0', fontSize: '0.85rem', color: '#666', fontWeight: '700' }}>
                ⏰ Expected Pickup: <span style={{ color: '#FF5A5F' }}>{new Date(selectedOrder.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '16px 0' }} />

              <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '16px' }} className="hide-scrollbar">
                <h4 style={{ fontSize: '0.78rem', fontWeight: '900', color: '#909090', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px' }}>Order Items</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="mobile-order-item-qty">{it.qty}x</span>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                          {it.photo ? <img src={it.photo} alt={it.name} style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }} /> : (it.emoji || '🍲')}
                        </div>
                        <span style={{ fontWeight: '700', color: '#2B2B2B' }}>{it.name}</span>
                      </div>
                      <span style={{ fontWeight: '700', color: '#666' }}>₹{(it.price * it.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {selectedOrder.special_instructions && (
                  <div style={{ 
                    background: '#FFF1F2', 
                    padding: '12px 14px', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255, 90, 95, 0.15)',
                    marginTop: '16px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    color: '#FF5A5F'
                  }}>
                    📝 Notes: "{selectedOrder.special_instructions}"
                  </div>
                )}
              </div>

              <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '16px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: '700' }}>Total Amount</span>
                <strong style={{ fontSize: '1.25rem', color: '#FF5A5F', fontWeight: '900' }}>₹{Number(selectedOrder.total).toFixed(2)}</strong>
              </div>

              <div style={{ marginTop: '24px' }}>
                <div style={{ marginBottom: '24px', padding: '0 4px' }}>
                  <StatusStepper 
                    currentStatus={selectedOrder.status} 
                    onStatusClick={(newStatus) => {
                      db.updateOrderStatus(selectedOrder.id, newStatus);
                      setSelectedOrder({...selectedOrder, status: newStatus});
                      showToast(`Order status jumped to: ${newStatus} ✨`);
                    }}
                  />
                </div>
                
                {selectedOrder.status !== 'Ready to Eat' ? (
                  <button 
                    className="mobile-submit-btn" 
                    style={{ margin: 0 }}
                    onClick={() => {
                      updateStatus(selectedOrder.id, selectedOrder.status);
                      const nextIdx = STATUSES.indexOf(selectedOrder.status) + 1;
                      if (nextIdx < STATUSES.length) {
                        setSelectedOrder({...selectedOrder, status: STATUSES[nextIdx]});
                      }
                    }}
                  >
                    {(() => {
                      const labels = {
                        'Order Received': 'Start Cooking 👨‍🍳',
                        'Cooking': 'Mark Cooked 🍳',
                        'Cooked': 'Ready for Pickup 🎁'
                      };
                      return labels[selectedOrder.status] || 'Next Step';
                    })()}
                  </button>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '14px', 
                    background: '#10B981', 
                    color: 'white', 
                    borderRadius: '16px',
                    fontWeight: '800',
                    fontSize: '0.92rem'
                  }}>
                    ✅ Ready for Pickup
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <DashboardLayout 
      sidebarItems={sidebarItems} 
      onLogout={onLogout} 
      userBadge="🏪 Stall Vendor" 
      onToggleTheme={onToggleTheme} 
      theme={theme}
      userName={stallProfile?.stall_name || session?.profileData?.stall_name || 'Chef Vendor'}
      userRole="Vendor"
    >
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
            <div className="stat-card" style={{ borderLeft: '6px solid #6366F1', cursor: 'pointer' }} onClick={() => { setView('orders'); setStatusFilter('Queued'); }}>
              <div className="flex justify-between items-center">
                <span style={{ fontSize: '2.5rem' }}>📥</span>
                <span className="badge" style={{ background: '#6366F1' }}>New</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900 }}>{homeData.statusCounts.Queued}</div>
              <div style={{ opacity: 0.7, fontWeight: 700 }}>Queued Orders</div>
            </div>

            <div className="stat-card" style={{ borderLeft: '6px solid #F59E0B', cursor: 'pointer' }} onClick={() => { setView('orders'); setStatusFilter('Preparing'); }}>
              <div className="flex justify-between items-center">
                <span style={{ fontSize: '2.5rem' }}>🔥</span>
                <span className="badge" style={{ background: '#F59E0B' }}>Preparing</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900 }}>{homeData.statusCounts.Preparing}</div>
              <div style={{ opacity: 0.7, fontWeight: 700 }}>Preparing</div>
            </div>

            <div className="stat-card" style={{ borderLeft: '6px solid #10B981', cursor: 'pointer' }} onClick={() => { setView('orders'); setStatusFilter('Ready'); }}>
              <div className="flex justify-between items-center">
                <span style={{ fontSize: '2.5rem' }}>🎁</span>
                <span className="badge" style={{ background: '#10B981' }}>Ready</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900 }}>{homeData.statusCounts.Ready}</div>
              <div style={{ opacity: 0.7, fontWeight: 700 }}>Ready for Pickup</div>
            </div>

            <div className="stat-card" style={{ borderLeft: '6px solid #3B82F6', cursor: 'pointer' }} onClick={() => setView('history')}>
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
            <div className="flex gap-2 items-center" style={{ width: '100%', maxWidth: '400px' }}>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 16px', borderRadius: '12px', background: 'var(--current-card)', border: '1px solid rgba(128,128,128,0.2)', flexShrink: 0 }}>
                <option value="All">All</option>
                <option value="Queued">Queued</option>
                <option value="Preparing">Preparing</option>
                <option value="Ready">Ready</option>
              </select>
              <input 
                type="text" 
                placeholder="Search orders (ID, foodie, dish)..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ margin: 0, flex: 1 }}
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
                  <div className="flex justify-between items-center" style={{ marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>Photo URL or Upload</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="file" 
                        id="menu-upload" 
                        hidden 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, 'menu')} 
                      />
                      <button 
                        type="button" 
                        className="ghost" 
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '4px 12px', fontSize: '0.8rem', height: 'auto' }}
                        onClick={() => document.getElementById('menu-upload').click()}
                      >
                        Upload 📁
                      </button>
                    </div>
                  </div>
                  <input 
                    type="text" 
                    placeholder="https://images.unsplash.com/..." 
                    value={newItem.photo} 
                    onChange={e => setNewItem({...newItem, photo: e.target.value})} 
                    required 
                  />
                  {newItem.photo && (
                    <div style={{ marginTop: '8px' }}>
                      <img src={newItem.photo} alt="Preview" style={{ width: '100px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                    </div>
                  )}
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

            <div className="flex justify-between items-center" style={{ marginBottom: '4px' }}>
              <label style={{ margin: 0 }}>Banner Image 📸</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="file" 
                  id="banner-upload" 
                  hidden 
                  accept="image/*" 
                  onChange={(e) => handleFileUpload(e, 'banner')} 
                />
                <button 
                  type="button" 
                  className="ghost" 
                  style={{ padding: '4px 12px', fontSize: '0.85rem', height: 'auto', borderRadius: '12px' }}
                  onClick={() => document.getElementById('banner-upload').click()}
                >
                  Upload Photo 📁
                </button>
              </div>
            </div>
            
            {stallProfile.banner_url && (
              <div style={{ marginBottom: '12px', position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '120px', border: '2px solid rgba(128,128,128,0.1)' }}>
                <img src={stallProfile.banner_url} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)', display: 'flex', alignItems: 'flex-end', padding: '12px' }}>
                  <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 800 }}>LIVE PREVIEW</span>
                </div>
              </div>
            )}
            
            <input 
              type="text" 
              placeholder="Paste image URL or upload above..." 
              value={stallProfile.banner_url} 
              onChange={e => setStallProfile({...stallProfile, banner_url: e.target.value})} 
              style={{ marginBottom: '24px' }}
            />

            <label>Promotion / Special Offer 📢</label>
            <input placeholder="E.g., 10% off on all burgers today!" value={stallProfile.promotion} onChange={e => setStallProfile({...stallProfile, promotion: e.target.value})} />

            <label>Minimum Preparation Time (minutes)</label>
            <input type="number" value={stallProfile.min_pickup_time} onChange={e => setStallProfile({...stallProfile, min_pickup_time: parseInt(e.target.value)})} required />

            <label>Food Court Name 📍</label>
            {!customFoodCourtMode ? (
              <select 
                value={stallProfile.food_court} 
                onChange={e => {
                  if (e.target.value === 'OTHER_CUSTOM') {
                    setCustomFoodCourtMode(true);
                    setStallProfile({...stallProfile, food_court: ''});
                  } else {
                    setStallProfile({...stallProfile, food_court: e.target.value});
                  }
                }} 
                style={{ marginBottom: '24px' }} 
                required 
              >
                {db.foodCourts?.map(fc => (
                  <option key={fc} value={fc}>{fc}</option>
                ))}
                <option value="OTHER_CUSTOM">Other (Add Custom)</option>
              </select>
            ) : (
              <div className="flex gap-2" style={{ marginBottom: '24px' }}>
                <input 
                  type="text" 
                  placeholder="Type your custom food court..." 
                  value={stallProfile.food_court} 
                  onChange={e => setStallProfile({...stallProfile, food_court: e.target.value})} 
                  style={{ margin: 0, flex: 1 }} 
                  required 
                  autoFocus
                />
                <button 
                  type="button" 
                  className="ghost" 
                  onClick={() => {
                    setCustomFoodCourtMode(false);
                    setStallProfile({...stallProfile, food_court: db.foodCourts?.[0] || ''});
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

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

            <label>Stall Description 📝</label>
            <textarea 
              placeholder="Tell students about your stall, specialties, and history..." 
              value={stallProfile.description} 
              onChange={e => setStallProfile({...stallProfile, description: e.target.value})} 
              rows="4"
              style={{ marginBottom: '24px', resize: 'none' }}
            />

            <button type="submit" className="primary">Save Settings 💾</button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}

