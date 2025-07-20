'use client'

import { useEffect, useState } from 'react';

export default function FallingChairs() {
  const [chairs, setChairs] = useState([]);

  useEffect(() => {
    // Check if we already have chairs stored for this session
    const storedChairs = localStorage.getItem('benchmarked-falling-chairs');
    
    if (storedChairs) {
      // Use existing chairs from this session
      setChairs(JSON.parse(storedChairs));
    } else {
      // Generate new chairs and store them for the session
      const generateChairs = () => {
        const chairCount = 8;
        const newChairs = [];
        
        for (let i = 0; i < chairCount; i++) {
          newChairs.push({
            id: i,
            left: Math.random() * 100,
            duration: Math.random() * 15 + 10,
            delay: Math.random() * 20,
            opacity: Math.random() * 0.25 + 0.1,
            size: Math.random() * 15 + 25,
          });
        }
        
        return newChairs;
      };

      const newChairs = generateChairs();
      setChairs(newChairs);
      localStorage.setItem('benchmarked-falling-chairs', JSON.stringify(newChairs));
    }

    // Clean up chairs when the session ends (when user closes browser/tab)
    const handleBeforeUnload = () => {
      localStorage.removeItem('benchmarked-falling-chairs');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Don't render anything until chairs are loaded
  if (chairs.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {chairs.map((chair) => (
        <div
          key={chair.id}
          className="absolute text-white/30"
          style={{
            left: `${chair.left}%`,
            top: '-50px',
            fontSize: `${chair.size}px`,
            opacity: chair.opacity,
            animation: `fallAndSpin ${chair.duration}s ${chair.delay}s linear infinite`,
          }}
        >
          🪑
        </div>
      ))}
      
      <style jsx global>{`
        @keyframes fallAndSpin {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(calc(100vh + 100px)) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
} 