'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

interface Account {
  ACC_ID: number;
  Acc_Name: string;
  User_ID: string;
  Role: string;
  Date_Time: string;
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Live Clock
  const [phTime, setPhTime] = useState('--:--:--');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editAccId, setEditAccId] = useState<number | null>(null);
  const [accountName, setAccountName] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      } else {
        setError('Failed to fetch user accounts.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection database error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role === 'Admin') {
      fetchAccounts();
    }
  }, [user, authLoading]);

  // Clock Hook
  useEffect(() => {
    const updateClock = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Manila',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      setPhTime(new Date().toLocaleString('en-PH', options));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  if (authLoading || !user || user.role !== 'Admin') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-deep)', color: 'var(--primary)' }}>
        <h3>Loading session and verifying privileges...</h3>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setEditAccId(null);
    setAccountName('');
    setUserName('');
    setPassword('');
    setRole('Admin');
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditAccId(acc.ACC_ID);
    setAccountName(acc.Acc_Name);
    setUserName(acc.User_ID);
    setPassword(''); // Secure: don't autofill
    setRole(acc.Role);
    setFormError('');
    setShowModal(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    if (!accountName || !userName || !role || (!editAccId && !password)) {
      setFormError('Please fill out all required fields.');
      setSubmitting(false);
      return;
    }

    const payload = {
      action: editAccId ? 'update' : 'insert',
      accId: editAccId,
      accountName,
      userName,
      password,
      role
    };

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowModal(false);
        fetchAccounts();
      } else {
        setFormError(data.message || 'Error saving user account.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Connection error saving user account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user account?')) {
      return;
    }
    try {
      const res = await fetch(`/api/accounts?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchAccounts();
      } else {
        alert(data.message || 'Failed to delete user account.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error deleting user account.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
      <Sidebar />

      <main className="main-content">
        <div className="header-actions">
          <h1>Account Management</h1>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <i className="ti ti-plus"></i> CREATE ACCOUNT
          </button>
        </div>

        {error && (
          <div style={{ padding: '15px', background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)', color: '#ff4d4d', borderRadius: '8px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* User list */}
        <h2>User Accounts Table</h2>
        <div className="table-wrapper">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--primary)' }}>
              <div className="spinner-loader" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ marginTop: '10px' }}>Loading accounts list...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
              No accounts registered.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Account No</th>
                  <th>Account Name</th>
                  <th>User Name</th>
                  <th>Password</th>
                  <th>Role</th>
                  <th>Date Created</th>
                  <th style={{ textAlign: 'center', width: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.ACC_ID}>
                    <td>#{acc.ACC_ID}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>{acc.Acc_Name}</td>
                    <td style={{ color: 'var(--primary)' }}>{acc.User_ID}</td>
                    <td style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>********</td>
                    <td>
                      <span className="badge badge-role">{acc.Role}</span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(acc.Date_Time).toLocaleString('en-PH')}
                    </td>
                    <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="info-btn"
                        style={{ padding: '6px 10px', fontSize: '14px' }}
                        onClick={() => handleOpenEdit(acc)}
                        title="Edit"
                      >
                        <i className="ti ti-edit"></i>
                      </button>
                      <button
                        className="danger-btn"
                        style={{ padding: '6px 10px', fontSize: '14px' }}
                        onClick={() => handleDelete(acc.ACC_ID)}
                        title="Delete"
                      >
                        <i className="ti ti-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Live system clock panel */}
        <div style={{
          marginTop: '40px',
          padding: '25px',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          borderLeft: '5px solid var(--primary)'
        }}>
          <h2 style={{ color: 'var(--primary)', marginTop: 0, fontSize: '20px', fontFamily: "'Poppins', sans-serif" }}>System Time Check</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '5px 0' }}>The current time in the Philippines (GMT+8) is:</p>
          <div style={{
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--text-dark)',
            margin: '15px 0',
            fontFamily: 'monospace'
          }}>
            {phTime}
          </div>
          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Note: If this time is incorrect, please adjust your computer's Date & Time settings in Windows.</p>
        </div>
      </main>

      {/* Account form modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '500px' }}>
            <button className="close-btn" onClick={() => setShowModal(false)}>
              <i className="ti ti-x"></i>
            </button>
            <h3 style={{ marginBottom: '20px', fontFamily: "'Poppins', sans-serif", fontSize: '24px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              {editAccId ? 'Edit Account' : 'Register New Account'}
            </h3>

            {formError && (
              <div style={{ padding: '10px', background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)', color: '#ff4d4d', borderRadius: '6px', fontSize: '13px', marginBottom: '15px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveAccount}>
              <div className="input-group">
                <label>Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. Juan Cruz"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>User Name</label>
                <input
                  type="text"
                  placeholder="e.g. juancruz"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Password {editAccId && <span style={{ color: '#666', fontWeight: 'normal' }}>(leave blank to keep current)</span>}</label>
                <input
                  type="password"
                  placeholder={editAccId ? '••••••••' : 'Enter password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editAccId}
                />
              </div>

              <div className="input-group">
                <label>Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} required>
                  <option value="Admin">Admin</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>

              <button
                type="submit"
                className="primary-btn"
                style={{ width: '100%', marginTop: '15px' }}
                disabled={submitting}
              >
                {submitting ? 'SAVING ACCOUNT...' : editAccId ? 'UPDATE ACCOUNT' : 'SAVE ACCOUNT'}
              </button>
            </form>
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
