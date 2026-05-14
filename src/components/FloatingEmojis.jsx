"use client";

import React, { useState, useEffect } from 'react';

const EMOJIS = ['🍕', '🍔', '🍜', '🧁', '🍣', '🌭', '🍟', '🍦', '🍩', '🌮'];

export default function FloatingEmojis() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const generated = Array.from({ length: 15 }).map(() => ({
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      left: `${Math.random() * 100}vw`,
      duration: `${10 + Math.random() * 15}s`,
      delay: `-${Math.random() * 15}s`,
      fontSize: `${1.5 + Math.random() * 2}rem`,
    }));
    setItems(generated);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="floating-emojis">
      {items.map((item, i) => (
        <div 
          key={i} 
          className="floating-emoji"
          style={{ 
            left: item.left, 
            animationDuration: item.duration,
            animationDelay: item.delay,
            fontSize: item.fontSize,
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
}
