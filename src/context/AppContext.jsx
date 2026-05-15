"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SignJWT, jwtVerify } from 'jose';
import ToastContainer from '../components/ToastContainer';

const INITIAL_MOCK_DATA = {
  profiles: [
    { id: 'u1', email: 'foodie@test.com', password: 'password', role: 'user', name: 'Maitry Patel', favorite_stalls: ['s1'] },
    { id: 's1', email: 'burger@stall.com', password: 'password', role: 'stall', stall_name: 'Campus Burgers 🍔', min_pickup_time: 15, is_approved: true, promotion: 'Free Fries on orders above ₹300!', banner_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80', categories: ['Burgers', 'Fast Food'], food_court: 'North Food Court' },
    { id: 's2', email: 'sushi@stall.com', password: 'password', role: 'stall', stall_name: 'Tokyo Express 🍣', min_pickup_time: 20, is_approved: true, promotion: '10% Off Student ID', banner_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80', categories: ['Asian', 'Healthy'], food_court: 'Central Cafeteria' },
    { id: 's3', email: 'pending@stall.com', password: 'password', role: 'stall', stall_name: 'Healthy Bowls 🥗', min_pickup_time: 10, is_approved: false, banner_url: '', categories: ['Healthy'], food_court: 'South Plaza' }
  ],
  menuItems: [
    { id: 'm1', stall_id: 's1', name: 'Classic Cheesy Burger', price: 149.00, emoji: '🍔', description: 'Juicy patty, melted cheese, crisp lettuce, secret sauce', category: 'Burgers', available: true, photo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80' },
    { id: 'm2', stall_id: 's1', name: 'Loaded Fries', price: 119.00, emoji: '🍟', description: 'Crispy fries topped with cheese sauce and jalapeños', category: 'Fast Food', available: true, photo: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=400&q=80' },
    { id: 'm3', stall_id: 's1', name: 'Thick Chocolate Shake', price: 99.00, emoji: '🥤', description: 'Rich Dutch chocolate milkshake topped with cream', category: 'Beverages', available: true, photo: '' },
    { id: 'm4', stall_id: 's2', name: 'California Roll (8pcs)', price: 299.00, emoji: '🍣', description: 'Crab stick, avocado, cucumber with Japanese mayo', category: 'Asian', available: true, photo: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=400&q=80' },
    { id: 'm5', stall_id: 's2', name: 'Pork Ramen Bowl', price: 349.00, emoji: '🍜', description: 'Rich broth, tender chashu pork, soft boiled egg, nori', category: 'Asian', available: false, photo: '' }
  ],
  orders: [
    { id: 'ord-101', user_id: 'u1', stall_id: 's1', items: [{ id: 'm1', name: 'Classic Cheesy Burger', price: 149.00, qty: 1, emoji: '🍔' }], total: 149.00, pickup_time: new Date(Date.now() + 15 * 60000).toISOString(), status: 'Cooking', special_instructions: 'No pickles please', created_at: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'ord-102', user_id: 'u1', stall_id: 's2', items: [{ id: 'm4', name: 'California Roll (8pcs)', price: 299.00, qty: 2, emoji: '🍣' }], total: 598.00, pickup_time: new Date(Date.now() - 30 * 60000).toISOString(), status: 'Picked Up', special_instructions: 'Extra wasabi', created_at: new Date(Date.now() - 45 * 60000).toISOString() }
  ],
  reviews: [
    { id: 'rev-1', order_id: 'ord-102', stall_id: 's2', user_id: 'u1', rating: 5, comment: 'Absolutely authentic and delicious! Highly recommend.', created_at: new Date(Date.now() - 20 * 60000).toISOString() }
  ]
};

const STORAGE_KEY = 'faac_db_data_v2';
const API_URL = 'https://3pdy6omb24.execute-api.eu-west-2.amazonaws.com';
const JWT_SECRET_KEY = 'faac_super_secret_jwt_key_32_bytes_min';

const playClickSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    // Audio context not allowed or supported
  }
};

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [dbData, setDbData] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { }
      }
    }
    return INITIAL_MOCK_DATA;
  });

  const [session, setSessionState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('faac_session');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return null;
  });

  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState('light');

  const setSession = useCallback((sess) => {
    setSessionState(sess);
    if (typeof window !== 'undefined') {
      if (sess) {
        localStorage.setItem('faac_session', JSON.stringify(sess));
        // Asynchronously sign JWT and store it
        const signAndStoreJWT = async () => {
          try {
            const secret = new TextEncoder().encode(JWT_SECRET_KEY);
            const jwt = await new SignJWT({ id: sess.id, role: sess.role })
              .setProtectedHeader({ alg: 'HS256' })
              .setIssuedAt()
              .setExpirationTime('10m')
              .sign(secret);
            localStorage.setItem('faac_jwt_token', jwt);
            document.cookie = `faac_jwt_token=${jwt}; path=/; max-age=600`;
          } catch (err) {
            console.error('JWT Signing Error:', err);
          }
        };
        signAndStoreJWT();
      } else {
        localStorage.removeItem('faac_session');
        localStorage.removeItem('faac_jwt_token');
        document.cookie = "faac_jwt_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('faac_theme') || 'light';
      setTheme(savedTheme);
      document.body.className = savedTheme;

      // Verify JWT token if session exists
      const token = localStorage.getItem('faac_jwt_token');
      const savedSess = localStorage.getItem('faac_session');
      if (savedSess && token) {
        const verifyJWT = async () => {
          try {
            const secret = new TextEncoder().encode(JWT_SECRET_KEY);
            await jwtVerify(token, secret);
          } catch (err) {
            console.warn('JWT Verification Failed, invalidating session:', err);
            setSessionState(null);
            localStorage.removeItem('faac_session');
            localStorage.removeItem('faac_jwt_token');
            document.cookie = "faac_jwt_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          }
        };
        verifyJWT();
      } else if (savedSess && !token) {
        // Legacy session without JWT token
        setSessionState(null);
        localStorage.removeItem('faac_session');
      }

      const handleStorage = (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            setDbData(JSON.parse(e.newValue));
          } catch (err) {}
        } else if (e.key === 'faac_session') {
          try {
            setSessionState(e.newValue ? JSON.parse(e.newValue) : null);
          } catch (err) {}
        }
      };
      window.addEventListener('storage', handleStorage);

      // Load initial data from AWS
      if (API_URL) {
        const loadAWSData = async () => {
          try {
            const [profRes, menuRes, ordRes, revRes] = await Promise.all([
              fetch(`${API_URL}/profiles`),
              fetch(`${API_URL}/menuItems`),
              fetch(`${API_URL}/orders`),
              fetch(`${API_URL}/reviews`)
            ]);
            if (profRes.ok && menuRes.ok && ordRes.ok && revRes.ok) {
              const profiles = await profRes.json();
              const menuItems = await menuRes.json();
              const orders = await ordRes.json();
              const reviews = await revRes.json();

              const hasData = profiles.length > 0 || menuItems.length > 0 || orders.length > 0 || reviews.length > 0;
              if (!hasData) {
                // Seed AWS database with INITIAL_MOCK_DATA
                await Promise.all([
                  ...INITIAL_MOCK_DATA.profiles.map(p => fetch(`${API_URL}/profiles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) })),
                  ...INITIAL_MOCK_DATA.menuItems.map(m => fetch(`${API_URL}/menuItems`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) })),
                  ...INITIAL_MOCK_DATA.orders.map(o => fetch(`${API_URL}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) })),
                  ...INITIAL_MOCK_DATA.reviews.map(r => fetch(`${API_URL}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) }))
                ]);
                setDbData(INITIAL_MOCK_DATA);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DATA));
              } else {
                const loadedData = {
                  profiles: profiles.length > 0 ? profiles : INITIAL_MOCK_DATA.profiles,
                  menuItems: menuItems.length > 0 ? menuItems : INITIAL_MOCK_DATA.menuItems,
                  orders: orders,
                  reviews: reviews
                };
                setDbData(loadedData);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedData));
              }
            }
          } catch (err) {
            console.warn('AWS fetch failed, using local storage/mock data:', err);
          }
        };
        loadAWSData();
      }

      const interval = setInterval(() => {
        const current = localStorage.getItem(STORAGE_KEY);
        if (current) {
          try {
            setDbData(prev => {
              const prevStr = JSON.stringify(prev);
              if (prevStr !== current) {
                return JSON.parse(current);
              }
              return prev;
            });
          } catch (err) {}
        }
      }, 2000);

      const handleClick = () => {
        playClickSound();
      };
      window.addEventListener('click', handleClick);

      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('click', handleClick);
        clearInterval(interval);
      };
    }
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        document.body.className = next;
        localStorage.setItem('faac_theme', next);
      }
      return next;
    });
  }, []);

  const showToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const saveDb = useCallback((updater) => {
    setDbData(prev => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const db = {
    profiles: dbData.profiles,
    menuItems: dbData.menuItems,
    orders: dbData.orders,
    reviews: dbData.reviews,

    addProfile: (p) => {
      saveDb(d => ({ ...d, profiles: [...d.profiles, p] }));
      if (API_URL) {
        fetch(`${API_URL}/profiles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }).catch(console.error);
      }
    },

    updateProfile: (id, updates) => {
      saveDb(d => ({
        ...d, profiles: d.profiles.map(p => p.id === id ? { ...p, ...updates } : p)
      }));
      if (API_URL) {
        fetch(`${API_URL}/profiles`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) }).catch(console.error);
      }
    },

    deleteProfile: (id) => {
      saveDb(d => ({
        ...d, 
        profiles: d.profiles.filter(p => p.id !== id),
        menuItems: d.menuItems.filter(m => m.stall_id !== id),
        orders: d.orders.filter(o => o.stall_id !== id)
      }));
      if (API_URL) {
        fetch(`${API_URL}/profiles`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(console.error);
        const menuToDelete = dbData.menuItems.filter(m => m.stall_id === id);
        const ordersToDelete = dbData.orders.filter(o => o.stall_id === id);
        Promise.all([
          ...menuToDelete.map(m => fetch(`${API_URL}/menuItems`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id }) })),
          ...ordersToDelete.map(o => fetch(`${API_URL}/orders`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: o.id }) }))
        ]).catch(console.error);
      }
    },

    addMenuItem: (m) => {
      saveDb(d => ({ ...d, menuItems: [...d.menuItems, m] }));
      if (API_URL) {
        fetch(`${API_URL}/menuItems`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) }).catch(console.error);
      }
    },

    toggleItemAvailability: (id) => {
      const item = dbData.menuItems.find(m => m.id === id);
      const newStatus = item ? !item.available : false;
      saveDb(d => ({
        ...d, menuItems: d.menuItems.map(m => m.id === id ? { ...m, available: !m.available } : m)
      }));
      if (API_URL && item) {
        fetch(`${API_URL}/menuItems`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, available: newStatus }) }).catch(console.error);
      }
    },

    deleteMenuItem: (id) => {
      saveDb(d => ({
        ...d, menuItems: d.menuItems.filter(m => m.id !== id)
      }));
      if (API_URL) {
        fetch(`${API_URL}/menuItems`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(console.error);
      }
    },

    addOrder: (o) => {
      saveDb(d => ({ ...d, orders: [...d.orders, o] }));
      if (API_URL) {
        fetch(`${API_URL}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) }).catch(console.error);
      }
    },

    updateOrderStatus: (id, status) => {
      saveDb(d => ({
        ...d, orders: d.orders.map(o => o.id === id ? { ...o, status } : o)
      }));
      if (API_URL) {
        fetch(`${API_URL}/orders`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }).catch(console.error);
      }
    },

    deleteOrder: (id) => {
      saveDb(d => ({
        ...d, orders: d.orders.filter(o => o.id !== id)
      }));
      if (API_URL) {
        fetch(`${API_URL}/orders`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(console.error);
      }
    },

    toggleStallApproval: (id) => {
      const stall = dbData.profiles.find(p => p.id === id);
      const newApproval = stall ? !stall.is_approved : false;
      saveDb(d => ({
        ...d, profiles: d.profiles.map(p => p.id === id ? { ...p, is_approved: !p.is_approved } : p)
      }));
      if (API_URL && stall) {
        fetch(`${API_URL}/profiles`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_approved: newApproval }) }).catch(console.error);
      }
    },

    addReview: (r) => {
      saveDb(d => ({ ...d, reviews: [...(d.reviews || []), r] }));
      if (API_URL) {
        fetch(`${API_URL}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) }).catch(console.error);
      }
    },

    toggleFavorite: (userId, stallId) => {
      const user = dbData.profiles.find(p => p.id === userId);
      if (!user) return;
      const favs = user.favorite_stalls || [];
      const updatedFavs = favs.includes(stallId) ? favs.filter(id => id !== stallId) : [...favs, stallId];
      saveDb(d => ({
        ...d,
        profiles: d.profiles.map(p => p.id === userId ? { ...p, favorite_stalls: updatedFavs } : p)
      }));
      if (API_URL) {
        fetch(`${API_URL}/profiles`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userId, favorite_stalls: updatedFavs }) }).catch(console.error);
      }
    }
  };

  const handleAdminLogin = useCallback((email, password) => {
    if (email === 'FAAC' && password === 'FAAC') {
      showToast("Welcome Almighty Admin! 👑", "success");
      setSession({ id: 'admin-1', role: 'admin', profileData: { name: 'Admin', email: 'admin@faac.com' } });
      return true;
    } else {
      showToast("Invalid Admin credentials 🚫", "error");
      return false;
    }
  }, [showToast, setSession]);

  const handleLogout = useCallback(() => {
    setSession(null);
    showToast("Logged out successfully 👋");
  }, [setSession, showToast]);

  const contextValue = {
    dbData,
    session,
    setSession,
    theme,
    handleToggleTheme,
    showToast,
    dismissToast,
    db,
    handleAdminLogin,
    handleLogout
  };

  return (
    <AppContext.Provider value={contextValue}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
