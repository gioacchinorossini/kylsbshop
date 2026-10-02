'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === 'Admin') {
          router.replace('/masterlist');
        } else if (user.role === 'Manager') {
          router.replace('/reports');
        } else {
          router.replace('/order');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#f4f6f8',
      color: 'var(--primary)',
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
      }}>
        <h1 style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '48px',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: '5px',
        }}>Sizzling Grill</h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          color: '#aaa',
          fontSize: '14px',
          letterSpacing: '4px',
          textTransform: 'uppercase',
        }}>Point of Sale System</p>
      </div>

      <div className="spinner-loader" style={{
        width: '50px',
        height: '50px',
        border: '3px solid var(--border)',
        borderRadius: '50%',
        borderTopColor: 'var(--primary)',
        animation: 'spin 1s ease-in-out infinite',
      }}></div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
