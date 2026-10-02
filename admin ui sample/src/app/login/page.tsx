'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  useEffect(() => {
    // Read URL errors if any
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'unknown_role') {
      setErrorMessage('Access denied: Unknown account role. ❌');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoadingSubmit(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        login(data.user.userId, data.user.role, data.user.name);
      } else {
        setErrorMessage(data.message || 'Invalid Username or Password. ❌');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Database connection error. ❌');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="sg-wrap">
        <div className="sg-left">
          <div className="sg-logo-circle">
            <img 
              src="/assets/finallogo.png" 
              alt="Sizzling Grill Logo" 
              className="sg-logo-img"
            />
          </div>
          <div className="sg-tagline">
            Grilled to Perfection,<br />
            <em>Made to Satisfy!</em>
          </div>
        </div>

        <div className="sg-right">
          <h1 className="sg-title">WELCOME BACK!</h1>
          <p className="sg-subtitle">Please sign in to continue</p>

          <div className="sg-divider">🔥</div>

          {errorMessage && <div className="sg-msg">{errorMessage}</div>}

          <form onSubmit={handleSubmit} id="login-form">
            <div className="sg-field">
              <i className="ti ti-user" aria-hidden="true"></i>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="sg-field">
              <i className="ti ti-lock" aria-hidden="true"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="sg-eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                <i className={`ti ti-${showPassword ? 'eye-off' : 'eye'}`} aria-hidden="true"></i>
              </button>
            </div>

            <button 
              type="submit" 
              className="sg-btn-login"
              disabled={loadingSubmit}
            >
              {loadingSubmit ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </form>

          <div className="sg-or">OR</div>

          <div className="sg-footer">
            <span>🔥</span>
            <span>
              <span className="orange">SIZZLING</span> FLAVOR. LEGENDARY <span className="orange">TASTE.</span>
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page-container {
          background-color: #481a12;
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          width: 100vw;
          box-sizing: border-box;
          padding: 20px;
        }

        .sg-wrap {
          min-height: 520px;
          background: #1a0a00;
          border-radius: 16px;
          display: flex;
          align-items: stretch;
          overflow: hidden;
          position: relative;
          font-family: 'Roboto', sans-serif;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          width: 900px;
          max-width: 100%;
        }

        .sg-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(ellipse at center, #3d1200 0%, #1a0500 60%, #0d0200 100%);
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        .sg-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 40% at 20% 80%, rgba(255,80,0,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 60% 30% at 80% 90%, rgba(255,120,0,0.12) 0%, transparent 60%);
        }

        .sg-logo-circle {
          width: 250px;
          height: 250px;
          background: rgba(255, 255, 255, 0.08);
          border: 4px solid rgba(242, 122, 24, 0.5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
          overflow: hidden;
          box-shadow: 0 0 60px rgba(242, 122, 24, 0.25);
        }

        .sg-logo-img {
          width: 90%;
          height: 90%;
          object-fit: contain;
        }

        .sg-tagline {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 18px;
          color: #f5f5f5;
          text-align: center;
          margin-top: 1.5rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          position: relative;
          z-index: 1;
          line-height: 1.5;
        }

        .sg-tagline em {
          color: #f27a18;
          font-style: italic;
        }

        .sg-right {
          width: 450px;
          background: rgba(15, 5, 0, 0.95);
          border-left: 1px solid rgba(255, 100, 0, 0.15);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3.5rem 3rem;
        }

        .sg-title {
          font-family: 'Poppins', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #f27a18;
          text-align: center;
          letter-spacing: 1.5px;
          margin-bottom: 4px;
        }

        .sg-subtitle {
          font-size: 13px;
          color: #aaa;
          text-align: center;
          margin-bottom: 1.5rem;
          font-family: 'Roboto', sans-serif;
        }

        .sg-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 1.5rem;
          color: #f27a18;
          font-size: 16px;
        }

        .sg-divider::before,
        .sg-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,100,0,0.25);
        }

        .sg-field {
          position: relative;
          margin-bottom: 18px;
        }

        .sg-field i {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #f27a18;
          font-size: 18px;
        }

        .sg-field input {
          width: 100%;
          box-sizing: border-box;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,100,0,0.2);
          border-radius: 8px;
          padding: 16px 45px 16px 48px;
          color: #f0f0f0;
          font-size: 15px;
          font-family: 'Roboto', sans-serif;
          outline: none;
          transition: all 0.25s ease;
        }

        .sg-field input:focus {
          border-color: #f27a18;
          background: rgba(242,122,24,0.06);
          box-shadow: 0 0 10px rgba(242, 122, 24, 0.15);
        }

        .sg-field input::placeholder { color: #666; }

        .sg-eye {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #777;
          cursor: pointer;
          font-size: 18px;
          background: none;
          border: none;
          padding: 0;
          transition: color 0.2s;
        }

        .sg-eye:hover { color: #f27a18; }

        .sg-btn-login {
          width: 100%;
          background: #f27a18;
          color: #fff;
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 2px;
          border: none;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
          margin-top: 10px;
          box-shadow: 0 4px 12px rgba(242, 122, 24, 0.2);
        }
 
        .sg-btn-login:hover { 
          background: #d9630c; 
          transform: translateY(-1px);
        }
        .sg-btn-login:disabled {
          background: #555;
          cursor: not-allowed;
          box-shadow: none;
        }

        .sg-or {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1.5rem;
          font-size: 12px;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .sg-or::before, .sg-or::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.07);
        }

        .sg-footer {
          font-size: 11px;
          color: #555;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          letter-spacing: 0.5px;
        }

        .sg-footer span.orange { color: #f27a18; font-weight: 700; }

        .sg-msg {
          font-size: 13px;
          text-align: center;
          margin-bottom: 15px;
          color: #ff4d4d;
          background: rgba(220, 53, 69, 0.08);
          border: 1px solid rgba(220, 53, 69, 0.2);
          border-radius: 6px;
          padding: 10px;
        }

        @media (max-width: 768px) {
          .sg-wrap {
            flex-direction: column;
            width: 100%;
          }
          .sg-right {
            width: 100%;
            padding: 2.5rem 1.5rem;
            border-left: none;
            border-top: 1px solid rgba(255, 100, 0, 0.15);
          }
          .sg-left {
            padding: 3rem 1.5rem;
          }
          .sg-logo-circle {
            width: 180px;
            height: 180px;
          }
        }
      `}</style>
    </div>
  );
}
