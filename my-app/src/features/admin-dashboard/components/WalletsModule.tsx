import React, { useMemo, useState } from 'react';
import { Search, ArrowUpDown, Wallet } from 'lucide-react';
import type { AdminWalletAccount } from '../types';

interface WalletsModuleProps {
  wallets: AdminWalletAccount[];
  language: 'en' | 'vi';
}

type SortOrder = 'desc' | 'asc';

export const WalletsModule: React.FC<WalletsModuleProps> = ({ wallets, language }) => {
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const formatMoney = (n: number) => `${n.toLocaleString('vi-VN')}₫`;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return language === 'en' ? 'Unknown' : 'Không rõ';
    return d.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN');
  };

  const totalBalance = useMemo(() => wallets.reduce((sum, w) => sum + (w.balance || 0), 0), [wallets]);

  const filteredWallets = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? wallets.filter(w =>
          (w.user?.email || '').toLowerCase().includes(q) ||
          (w.user?.userName || '').toLowerCase().includes(q) ||
          (w.user?.profileFullName || '').toLowerCase().includes(q) ||
          (w.user?.phoneNumber || '').toLowerCase().includes(q)
        )
      : wallets;

    return [...filtered].sort((a, b) =>
      sortOrder === 'desc' ? b.balance - a.balance : a.balance - b.balance
    );
  }, [wallets, search, sortOrder]);

  return (
    <div className="admin-module animate-fade-in">
      <header className="module-header">
        <h1>{language === 'en' ? 'Wallet Management' : 'Quản lý Ví'}</h1>
        <p>{language === 'en' ? 'Track user wallet balances across the platform' : 'Theo dõi số dư ví của người dùng trên toàn hệ thống'}</p>
      </header>

      {/* Summary Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper green"><Wallet size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'TOTAL WALLETS' : 'TỔNG SỐ VÍ'}</span>
            <h2 className="stat-value">{wallets.length}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper purple"><Wallet size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'TOTAL BALANCE' : 'TỔNG SỐ DƯ HỆ THỐNG'}</span>
            <h2 className="stat-value">{formatMoney(totalBalance)}</h2>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="admin-listings-controls glass-card">
        <div className="listings-search">
          <Search size={15} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search by name, email, phone...' : 'Tìm theo tên, email, số điện thoại...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <button
          className="btn-ghost"
          onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
        >
          <ArrowUpDown size={14} />
          {sortOrder === 'desc'
            ? (language === 'en' ? 'Balance: High to Low' : 'Số dư: Cao đến thấp')
            : (language === 'en' ? 'Balance: Low to High' : 'Số dư: Thấp đến cao')}
        </button>
      </div>

      {/* Table */}
      <div className="admin-table-container glass-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{language === 'en' ? 'Wallet Owner' : 'Chủ ví'}</th>
              <th>Email</th>
              <th>{language === 'en' ? 'Phone' : 'Số điện thoại'}</th>
              <th>{language === 'en' ? 'Role' : 'Vai trò'}</th>
              <th style={{ textAlign: 'right' }}>{language === 'en' ? 'Balance' : 'Số dư'}</th>
              <th>{language === 'en' ? 'Last Updated' : 'Cập nhật gần nhất'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredWallets.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                  {language === 'en' ? 'No wallets found.' : 'Không tìm thấy ví nào.'}
                </td>
              </tr>
            ) : (
              filteredWallets.map(w => {
                const displayName = w.user?.profileFullName || w.user?.userName || w.user?.email || (language === 'en' ? 'Unknown user' : 'Chưa rõ');
                return (
                  <tr key={w.id}>
                    <td>
                      <div className="user-info-cell">
                        <div className="user-avatar-mini">
                          {w.user?.profileAvatarUrl ? (
                            <img src={w.user.profileAvatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            displayName[0]?.toUpperCase()
                          )}
                        </div>
                        <span className="user-name">{displayName}</span>
                      </div>
                    </td>
                    <td>{w.user?.email || '—'}</td>
                    <td>{w.user?.phoneNumber || '—'}</td>
                    <td>
                      <span className={`badge-role ${(w.user?.role || '').toLowerCase()}`}>{w.user?.role || '—'}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <strong className="text-neon-green">{formatMoney(w.balance)}</strong>
                    </td>
                    <td className="font-mono">{formatDate(w.updatedAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
